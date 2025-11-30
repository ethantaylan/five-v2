import { supabase } from "../lib/supabase";
import type { Five, FiveParticipant, FiveWithDetails } from "../types/database";

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
  const [participantCount, substituteCount, participation] = await Promise.all([
    countParticipants(five.id),
    countSubstitutes(five.id),
    getParticipation(five.id, userId),
  ]);

  return {
    ...five,
    participantCount,
    substituteCount,
    isUserParticipant: !!participation,
    isUserSubstitute: participation?.is_substitute || false,
    isFull: participantCount >= five.max_players,
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

  const currentCount = await countParticipants(fiveId);
  const isFull = currentCount >= (five as Five).max_players;

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
