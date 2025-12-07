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
  const { data: createdFives, error: createdError } = await supabase
    .from("fives")
    .select("*")
    .eq("created_by", userId)
    .order("date", { ascending: true });
  if (createdError) throw createdError;

  const { data: joinedFivesData, error: joinedError } = await supabase
    .from("five_participants")
    .select(`
      five:fives (*)
    `)
    .eq("user_id", userId);
  if (joinedError) throw joinedError;

  const joinedFivesTyped =
    joinedFivesData as unknown as ({ five: Five | null } & FiveParticipant)[] | null;
  const joinedFives =
    joinedFivesTyped?.map((item) => item.five).filter((f): f is Five => Boolean(f)) || [];

  const allFivesMap = new Map<string, Five>();
  [...(createdFives || []), ...joinedFives].forEach((five) => {
    if (five) allFivesMap.set(five.id, five);
  });

  const allFives = Array.from(allFivesMap.values());
  const fivesWithDetails = await Promise.all(allFives.map((five) => enrichFive(five, userId)));
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

export async function updateFive(fiveId: string, payload: Partial<Five>, userId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", fiveId)
    .single();
  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Match introuvable");
  if ((existing as Five).created_by !== userId) throw new Error("Non autorisé");

  const { data: updated, error: updateError } = await supabase
    .from("fives")
    .update(payload)
    .eq("id", fiveId)
    .select()
    .single();
  if (updateError) throw updateError;
  return updated as Five;
}

async function promoteFirstSubstitute(fiveId: string) {
  // Get the Five details to check max_players
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("max_players")
    .eq("id", fiveId)
    .single();
  if (fiveError) throw fiveError;

  // Count current active participants (non-substitutes)
  const [participantCount, guestCount] = await Promise.all([
    countParticipants(fiveId),
    countGuestParticipants(fiveId),
  ]);
  const totalActiveCount = participantCount + guestCount;

  // Only promote if there's space available
  if (totalActiveCount >= (five as Five).max_players) {
    return; // Still full, no promotion needed
  }

  // Find the oldest substitute (user or guest, whichever joined first)
  const { data: userSubstitutes } = await supabase
    .from("five_participants")
    .select("id, user_id, joined_at")
    .eq("five_id", fiveId)
    .eq("is_substitute", true)
    .order("joined_at", { ascending: true })
    .limit(1);

  const { data: guestSubstitutes } = await supabase
    .from("guest_participants")
    .select("id, added_at")
    .eq("five_id", fiveId)
    .eq("is_substitute", true)
    .order("added_at", { ascending: true })
    .limit(1);

  // Determine which substitute to promote (oldest one)
  let promoteUser = false;
  let promoteGuest = false;

  if (userSubstitutes && userSubstitutes.length > 0 && guestSubstitutes && guestSubstitutes.length > 0) {
    const userTime = new Date(userSubstitutes[0].joined_at).getTime();
    const guestTime = new Date(guestSubstitutes[0].added_at).getTime();
    promoteUser = userTime <= guestTime;
    promoteGuest = userTime > guestTime;
  } else if (userSubstitutes && userSubstitutes.length > 0) {
    promoteUser = true;
  } else if (guestSubstitutes && guestSubstitutes.length > 0) {
    promoteGuest = true;
  }

  // Promote the substitute
  if (promoteUser && userSubstitutes && userSubstitutes.length > 0) {
    await supabase
      .from("five_participants")
      .update({ is_substitute: false })
      .eq("id", userSubstitutes[0].id);
  } else if (promoteGuest && guestSubstitutes && guestSubstitutes.length > 0) {
    await supabase
      .from("guest_participants")
      .update({ is_substitute: false })
      .eq("id", guestSubstitutes[0].id);
  }
}

export async function leaveFive(fiveId: string, userId: string) {
  // Check if the leaving user is a substitute or regular participant
  const { data: participant } = await supabase
    .from("five_participants")
    .select("is_substitute")
    .eq("five_id", fiveId)
    .eq("user_id", userId)
    .single();

  const { error } = await supabase
    .from("five_participants")
    .delete()
    .eq("five_id", fiveId)
    .eq("user_id", userId);
  if (error) throw error;

  // If the leaving participant was not a substitute, promote the first substitute
  if (participant && !participant.is_substitute) {
    await promoteFirstSubstitute(fiveId);
  }

  return true;
}

export async function removeParticipant(fiveId: string, participantUserId: string, requesterId: string) {
  // Verify that the requester is the creator
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", fiveId)
    .single();
  if (fiveError) throw fiveError;
  if (!five) throw new Error("Five not found");
  if ((five as Five).created_by !== requesterId) throw new Error("Only the creator can remove participants");

  // Check if the participant being removed is a substitute or regular participant
  const { data: participant } = await supabase
    .from("five_participants")
    .select("is_substitute")
    .eq("five_id", fiveId)
    .eq("user_id", participantUserId)
    .single();

  // Remove the participant
  const { error } = await supabase
    .from("five_participants")
    .delete()
    .eq("five_id", fiveId)
    .eq("user_id", participantUserId);
  if (error) throw error;

  // If the removed participant was not a substitute, promote the first substitute
  if (participant && !participant.is_substitute) {
    await promoteFirstSubstitute(fiveId);
  }

  return true;
}

export async function deleteFive(fiveId: string, userId: string) {
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", fiveId)
    .single();
  if (fiveError) throw fiveError;
  if (!five) throw new Error("Five not found");
  if ((five as Five).created_by !== userId) throw new Error("Only the creator can delete this match");

  const { error: deleteError } = await supabase.from("fives").delete().eq("id", fiveId);
  if (deleteError) throw deleteError;
  return true;
}

// Guest Participants Functions

export async function fetchGuestParticipants(fiveId: string) {
  const { data, error } = await supabase
    .from("guest_participants")
    .select("*")
    .eq("five_id", fiveId)
    .order("is_substitute", { ascending: true })
    .order("added_at", { ascending: true });

  if (error) throw error;
  return (data as GuestParticipant[]) || [];
}

export async function addGuestParticipant(
  fiveId: string,
  firstName: string,
  lastName: string | null,
  addedBy: string
) {
  // Verify that the requester is the creator
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("created_by, max_players")
    .eq("id", fiveId)
    .single();
  if (fiveError) throw fiveError;
  if (!five) throw new Error("Match introuvable");
  if ((five as Five).created_by !== addedBy) throw new Error("Seul le créateur peut ajouter des participants invités");

  // Check if the match is full
  const [participantCount, guestCount] = await Promise.all([
    countParticipants(fiveId),
    countGuestParticipants(fiveId),
  ]);
  const totalActiveCount = participantCount + guestCount;
  const isFull = totalActiveCount >= (five as Five).max_players;

  // Add guest participant
  const { data: guest, error: insertError } = await supabase
    .from("guest_participants")
    .insert({
      five_id: fiveId,
      first_name: firstName,
      last_name: lastName || null,
      is_substitute: isFull,
      added_by: addedBy,
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return guest as GuestParticipant;
}

export async function removeGuestParticipant(guestId: string, requesterId: string) {
  // Get the guest participant to find the five_id and check if they're a substitute
  const { data: guest, error: guestError } = await supabase
    .from("guest_participants")
    .select("five_id, is_substitute")
    .eq("id", guestId)
    .single();
  if (guestError) throw guestError;
  if (!guest) throw new Error("Participant invité introuvable");

  const fiveId = (guest as GuestParticipant).five_id;
  const isSubstitute = (guest as GuestParticipant).is_substitute;

  // Verify that the requester is the creator
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", fiveId)
    .single();
  if (fiveError) throw fiveError;
  if (!five) throw new Error("Match introuvable");
  if ((five as Five).created_by !== requesterId) throw new Error("Seul le créateur peut retirer des participants invités");

  // Remove the guest participant
  const { error: deleteError } = await supabase
    .from("guest_participants")
    .delete()
    .eq("id", guestId);
  if (deleteError) throw deleteError;

  // If the removed guest was not a substitute, promote the first substitute
  if (!isSubstitute) {
    await promoteFirstSubstitute(fiveId);
  }

  return true;
}

// Move a participant to substitute
export async function moveParticipantToSubstitute(fiveId: string, participantUserId: string, requesterId: string) {
  // Verify that the requester is the creator
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", fiveId)
    .single();
  if (fiveError) throw fiveError;
  if (!five) throw new Error("Match introuvable");
  if ((five as Five).created_by !== requesterId) throw new Error("Seul le créateur peut gérer les participants");

  // Update the participant to be a substitute
  const { error } = await supabase
    .from("five_participants")
    .update({ is_substitute: true })
    .eq("five_id", fiveId)
    .eq("user_id", participantUserId);
  if (error) throw error;

  return true;
}

// Move a substitute to regular participant
export async function moveSubstituteToParticipant(fiveId: string, participantUserId: string, requesterId: string) {
  // Verify that the requester is the creator
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("created_by, max_players")
    .eq("id", fiveId)
    .single();
  if (fiveError) throw fiveError;
  if (!five) throw new Error("Match introuvable");
  if ((five as Five).created_by !== requesterId) throw new Error("Seul le créateur peut gérer les participants");

  // Check if there's space available
  const [participantCount, guestCount] = await Promise.all([
    countParticipants(fiveId),
    countGuestParticipants(fiveId),
  ]);
  const totalActiveCount = participantCount + guestCount;

  if (totalActiveCount >= (five as Five).max_players) {
    throw new Error("Le match est complet. Impossible de promouvoir ce remplaçant.");
  }

  // Update the participant to be a regular participant
  const { error } = await supabase
    .from("five_participants")
    .update({ is_substitute: false })
    .eq("five_id", fiveId)
    .eq("user_id", participantUserId);
  if (error) throw error;

  return true;
}

// Move a guest participant to substitute
export async function moveGuestToSubstitute(guestId: string, requesterId: string) {
  // Get the guest participant
  const { data: guest, error: guestError } = await supabase
    .from("guest_participants")
    .select("five_id")
    .eq("id", guestId)
    .single();
  if (guestError) throw guestError;
  if (!guest) throw new Error("Participant invité introuvable");

  const fiveId = (guest as GuestParticipant).five_id;

  // Verify that the requester is the creator
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("created_by")
    .eq("id", fiveId)
    .single();
  if (fiveError) throw fiveError;
  if (!five) throw new Error("Match introuvable");
  if ((five as Five).created_by !== requesterId) throw new Error("Seul le créateur peut gérer les participants");

  // Update the guest to be a substitute
  const { error } = await supabase
    .from("guest_participants")
    .update({ is_substitute: true })
    .eq("id", guestId);
  if (error) throw error;

  return true;
}

// Move a guest substitute to regular participant
export async function moveGuestSubstituteToParticipant(guestId: string, requesterId: string) {
  // Get the guest participant
  const { data: guest, error: guestError } = await supabase
    .from("guest_participants")
    .select("five_id")
    .eq("id", guestId)
    .single();
  if (guestError) throw guestError;
  if (!guest) throw new Error("Participant invité introuvable");

  const fiveId = (guest as GuestParticipant).five_id;

  // Verify that the requester is the creator
  const { data: five, error: fiveError } = await supabase
    .from("fives")
    .select("created_by, max_players")
    .eq("id", fiveId)
    .single();
  if (fiveError) throw fiveError;
  if (!five) throw new Error("Match introuvable");
  if ((five as Five).created_by !== requesterId) throw new Error("Seul le créateur peut gérer les participants");

  // Check if there's space available
  const [participantCount, guestCount] = await Promise.all([
    countParticipants(fiveId),
    countGuestParticipants(fiveId),
  ]);
  const totalActiveCount = participantCount + guestCount;

  if (totalActiveCount >= (five as Five).max_players) {
    throw new Error("Le match est complet. Impossible de promouvoir ce remplaçant.");
  }

  // Update the guest to be a regular participant
  const { error } = await supabase
    .from("guest_participants")
    .update({ is_substitute: false })
    .eq("id", guestId);
  if (error) throw error;

  return true;
}
