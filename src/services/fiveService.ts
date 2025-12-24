import { supabase } from "../lib/supabase";
import type { Five, FiveParticipant, FiveWithDetails, GuestParticipant } from "../types/database";

type FiveInsert = Omit<Five, "id" | "share_code" | "created_at" | "updated_at" | "group_id"> & {
  group_id?: string | null;
};

async function countParticipants(fiveId: string) {
  const { count } = await supabase
    .from("five_participants")
    .select("*", { count: "exact", head: true })
    .eq("five_id", fiveId)
    .eq("is_substitute", false);
  return count || 0;
}

async function countSubstitutes(fiveId: string) {
  const { count } = await supabase
    .from("five_participants")
    .select("*", { count: "exact", head: true })
    .eq("five_id", fiveId)
    .eq("is_substitute", true);
  return count || 0;
}

async function countGuestParticipants(fiveId: string) {
  const { count } = await supabase
    .from("guest_participants")
    .select("*", { count: "exact", head: true })
    .eq("five_id", fiveId)
    .eq("is_substitute", false);
  return count || 0;
}

async function countGuestSubstitutes(fiveId: string) {
  const { count } = await supabase
    .from("guest_participants")
    .select("*", { count: "exact", head: true })
    .eq("five_id", fiveId)
    .eq("is_substitute", true);
  return count || 0;
}

async function getParticipation(fiveId: string, userId: string) {
  const { data } = await supabase
    .from("five_participants")
    .select("*")
    .eq("five_id", fiveId)
    .eq("user_id", userId)
    .maybeSingle();
  return data || null;
}

async function enrichFive(five: Five, userId: string): Promise<FiveWithDetails> {
  const [participantCount, substituteCount, guestCount, guestSubstituteCount, participation] = await Promise.all([
    countParticipants(five.id),
    countSubstitutes(five.id),
    countGuestParticipants(five.id),
    countGuestSubstitutes(five.id),
    getParticipation(five.id, userId),
  ]);

  // Total active players = registered users + guests (excluding substitutes)
  const totalActiveCount = participantCount + guestCount;

  return {
    ...five,
    participantCount,
    substituteCount,
    guestCount,
    guestSubstituteCount,
    isUserParticipant: !!participation,
    isUserSubstitute: participation?.is_substitute || false,
    isFull: totalActiveCount >= five.max_players,
    isCreator: five.created_by === userId,
  };
}

export async function fetchFiveParticipants(fiveId: string) {
  const { data, error } = await supabase
    .from("five_participants")
    .select(`
      id,
      user_id,
      joined_at,
      is_substitute,
      user:users (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq("five_id", fiveId)
    .order("is_substitute", { ascending: true })
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as (FiveParticipant & { user: FiveParticipant["user_id"] })[]) || [];
}

export async function fetchFivesForUser(userId: string) {
  // Get all fives the user participates in
  const { data: participations, error: partError } = await supabase
    .from("five_participants")
    .select("five_id")
    .eq("user_id", userId);

  if (partError) throw partError;

  const fiveIds = participations.map((p) => p.five_id);

  // If the user doesn't participate in any fives, return an empty array
  if (fiveIds.length === 0) return [];

  // Fetch all fives the user participates in
  const { data: fives, error: fivesError } = await supabase
    .from("fives")
    .select("*")
    .in("id", fiveIds)
    .order("date", { ascending: true });

  if (fivesError) throw fivesError;

  // Enrich each five with additional details
  const fivesWithDetails = await Promise.all(
    (fives as Five[]).map((five) => enrichFive(five, userId))
  );

  return fivesWithDetails;
}

export async function fetchFiveByShareCode(shareCode: string, userId: string) {
  const { data: five, error } = await supabase
    .from("fives")
    .select("*")
    .eq("share_code", shareCode.toUpperCase())
    .single();

  if (error) throw error;
  if (!five) return null;
  return enrichFive(five as Five, userId);
}

export async function fetchFiveById(fiveId: string, userId: string) {
  const { data: five, error } = await supabase
    .from("fives")
    .select("*")
    .eq("id", fiveId)
    .single();

  if (error) throw error;
  if (!five) return null;
  return enrichFive(five as Five, userId);
}

export async function createFive(payload: FiveInsert) {
  const { data: five, error } = await supabase
    .from("fives")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return five as Five;
}

export async function joinFive(fiveId: string, userId: string) {
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("*")
    .eq("id", fiveId)
    .single();
  if (fiveError) throw fiveError;

  // Count both registered and guest participants
  const [participantCount, guestCount] = await Promise.all([
    countParticipants(fiveId),
    countGuestParticipants(fiveId),
  ]);
  const totalActiveCount = participantCount + guestCount;
  const isFull = totalActiveCount >= (five as Five).max_players;

  // If the match is full, join as substitute; otherwise, join as regular player
  const { error: joinError } = await supabase
    .from("five_participants")
    .insert({
      five_id: fiveId,
      user_id: userId,
      is_substitute: isFull,
    });
  if (joinError) throw joinError;

  return true;
}

export async function leaveFive(fiveId: string, userId: string) {
  const { error } = await supabase
    .from("five_participants")
    .delete()
    .eq("five_id", fiveId)
    .eq("user_id", userId);

  if (error) throw error;
  return true;
}

export async function deleteFive(fiveId: string, userId: string) {
  const { data: five } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", fiveId)
    .single();

  if (!five || five.created_by !== userId) {
    throw new Error("Only the creator can delete this five");
  }

  const { error } = await supabase.from("fives").delete().eq("id", fiveId);

  if (error) throw error;
  return true;
}

export async function updateFive(
  fiveId: string,
  data: { title: string; location: string; date: string; maxPlayers: number; durationMinutes: number },
  userId: string
) {
  const { data: five } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", fiveId)
    .single();

  if (!five || five.created_by !== userId) {
    throw new Error("Only the creator can update this five");
  }

  const { data: updated, error } = await supabase
    .from("fives")
    .update({
      title: data.title,
      location: data.location,
      date: data.date,
      max_players: data.maxPlayers,
      duration_minutes: data.durationMinutes,
    })
    .eq("id", fiveId)
    .select()
    .single();

  if (error) throw error;
  return updated as Five;
}

export async function joinFiveByShareCode(shareCode: string, userId: string) {
  // Find the five with the given share code
  const { data: five, error } = await supabase
    .from("fives")
    .select("*")
    .eq("share_code", shareCode.toUpperCase())
    .single();

  if (error || !five) {
    return "notFound";
  }

  // Check if the user is already a participant
  const existingParticipation = await getParticipation(five.id, userId);
  if (existingParticipation) {
    return "already";
  }

  // Count both registered and guest participants
  const [participantCount, guestCount] = await Promise.all([
    countParticipants(five.id),
    countGuestParticipants(five.id),
  ]);
  const totalActiveCount = participantCount + guestCount;
  const isFull = totalActiveCount >= (five as Five).max_players;

  // Join as substitute if full
  const { error: joinError } = await supabase.from("five_participants").insert({
    five_id: five.id,
    user_id: userId,
    is_substitute: isFull,
  });

  if (joinError) throw joinError;

  return isFull ? "joinedAsSub" : "joined";
}

export async function removeParticipant(fiveId: string, participantUserId: string, requesterId: string) {
  // Verify requester is the creator
  const { data: five } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", fiveId)
    .single();

  if (!five || five.created_by !== requesterId) {
    throw new Error("Only the creator can remove participants");
  }

  const { error } = await supabase
    .from("five_participants")
    .delete()
    .eq("five_id", fiveId)
    .eq("user_id", participantUserId);

  if (error) throw error;
  return true;
}

export async function fetchGuestParticipants(fiveId: string) {
  const { data, error } = await supabase
    .from("guest_participants")
    .select("*")
    .eq("five_id", fiveId)
    .order("is_substitute", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as GuestParticipant[]) || [];
}

export async function addGuestParticipant(
  fiveId: string,
  firstName: string,
  lastName: string | null,
  requesterId: string
) {
  // Verify requester is the creator
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("*")
    .eq("id", fiveId)
    .single();

  if (fiveError) throw fiveError;
  if (!five || five.created_by !== requesterId) {
    throw new Error("Only the creator can add guest participants");
  }

  // Count both registered and guest participants
  const [participantCount, guestCount] = await Promise.all([
    countParticipants(fiveId),
    countGuestParticipants(fiveId),
  ]);
  const totalActiveCount = participantCount + guestCount;
  const isFull = totalActiveCount >= (five as Five).max_players;

  // Insert guest
  const { error: insertError } = await supabase.from("guest_participants").insert({
    five_id: fiveId,
    first_name: firstName,
    last_name: lastName,
    is_substitute: isFull,
  });

  if (insertError) throw insertError;
  return true;
}

export async function removeGuestParticipant(guestId: string, requesterId: string) {
  // Get the guest's five_id to check if requester is creator
  const { data: guest } = await supabase
    .from("guest_participants")
    .select("five_id")
    .eq("id", guestId)
    .single();

  if (!guest) {
    throw new Error("Guest participant not found");
  }

  const { data: five } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", guest.five_id)
    .single();

  if (!five || five.created_by !== requesterId) {
    throw new Error("Only the creator can remove guest participants");
  }

  const { error } = await supabase
    .from("guest_participants")
    .delete()
    .eq("id", guestId);

  if (error) throw error;
  return true;
}

export async function moveParticipantToSubstitute(fiveId: string, participantUserId: string, requesterId: string) {
  // Verify requester is the creator
  const { data: five } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", fiveId)
    .single();

  if (!five || five.created_by !== requesterId) {
    throw new Error("Only the creator can move participants");
  }

  const { error } = await supabase
    .from("five_participants")
    .update({ is_substitute: true })
    .eq("five_id", fiveId)
    .eq("user_id", participantUserId);

  if (error) throw error;
  return true;
}

export async function moveSubstituteToParticipant(fiveId: string, participantUserId: string, requesterId: string) {
  // Verify requester is the creator
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("*")
    .eq("id", fiveId)
    .single();

  if (fiveError) throw fiveError;
  if (!five || five.created_by !== requesterId) {
    throw new Error("Only the creator can move participants");
  }

  // Check if moving this substitute would exceed max_players
  const [participantCount, guestCount] = await Promise.all([
    countParticipants(fiveId),
    countGuestParticipants(fiveId),
  ]);
  const totalActiveCount = participantCount + guestCount;

  if (totalActiveCount >= (five as Five).max_players) {
    throw new Error("Cannot promote substitute: event is full");
  }

  const { error } = await supabase
    .from("five_participants")
    .update({ is_substitute: false })
    .eq("five_id", fiveId)
    .eq("user_id", participantUserId);

  if (error) throw error;
  return true;
}

export async function moveGuestToSubstitute(guestId: string, requesterId: string) {
  const { data: guest } = await supabase
    .from("guest_participants")
    .select("five_id")
    .eq("id", guestId)
    .single();

  if (!guest) throw new Error("Guest not found");

  const { data: five } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", guest.five_id)
    .single();

  if (!five || five.created_by !== requesterId) {
    throw new Error("Only the creator can move participants");
  }

  const { error } = await supabase
    .from("guest_participants")
    .update({ is_substitute: true })
    .eq("id", guestId);

  if (error) throw error;
  return true;
}

export async function moveGuestSubstituteToParticipant(guestId: string, requesterId: string) {
  const { data: guest } = await supabase
    .from("guest_participants")
    .select("five_id")
    .eq("id", guestId)
    .single();

  if (!guest) throw new Error("Guest not found");

  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("*")
    .eq("id", guest.five_id)
    .single();

  if (fiveError) throw fiveError;
  if (!five || five.created_by !== requesterId) {
    throw new Error("Only the creator can move participants");
  }

  // Check if moving this substitute would exceed max_players
  const [participantCount, guestCount] = await Promise.all([
    countParticipants(guest.five_id),
    countGuestParticipants(guest.five_id),
  ]);
  const totalActiveCount = participantCount + guestCount;

  if (totalActiveCount >= (five as Five).max_players) {
    throw new Error("Cannot promote substitute: event is full");
  }

  const { error } = await supabase
    .from("guest_participants")
    .update({ is_substitute: false })
    .eq("id", guestId);

  if (error) throw error;
  return true;
}
