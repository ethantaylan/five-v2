import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Five, FiveParticipant, FiveWithDetails } from "../types/database";

interface FiveParticipantWithUser {
  id: string;
  user_id: string;
  joined_at: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface FiveStore {
  fives: FiveWithDetails[];
  currentFive: FiveWithDetails | null;
  participants: FiveParticipantWithUser[];
  loading: boolean;
  fetchMyFives: (userId: string) => Promise<void>;
  fetchFiveByShareCode: (shareCode: string, userId: string) => Promise<FiveWithDetails | null>;
  fetchFiveParticipants: (fiveId: string) => Promise<void>;
  createFive: (
    title: string,
    location: string,
    date: string,
    maxPlayers: number,
    durationMinutes: number,
    userId: string
  ) => Promise<{ five: any; shareCode: string } | null>;
  updateFive: (
    fiveId: string,
    payload: {
      title: string;
      location: string;
      date: string;
      maxPlayers: number;
      durationMinutes: number;
    },
    userId: string
  ) => Promise<FiveWithDetails | null>;
  joinFive: (fiveId: string, userId: string) => Promise<boolean>;
  joinFiveByShareCode: (
    shareCode: string,
    userId: string
  ) => Promise<"joined" | "already" | "full" | "notFound" | "error">;
  leaveFive: (fiveId: string, userId: string) => Promise<boolean>;
  deleteFive: (fiveId: string, userId: string) => Promise<boolean>;
  setCurrentFive: (five: FiveWithDetails | null) => void;
}

export const useFiveStore = create<FiveStore>((set, get) => ({
  fives: [],
  currentFive: null,
  participants: [],
  loading: false,

  fetchFiveParticipants: async (fiveId) => {
    try {
      const { data: participants, error } = await supabase
        .from("five_participants")
        .select(`
          id,
          user_id,
          joined_at,
          user:users (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("five_id", fiveId)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      set({ participants: (participants as unknown as FiveParticipantWithUser[]) || [] });
    } catch (error) {
      console.error("Error fetching five participants:", error);
      set({ participants: [] });
    }
  },

  // Fetch all fives the user created or joined
  fetchMyFives: async (userId) => {
    set({ loading: true });
    try {
      // Get fives created by user
      const { data: createdFives, error: createdError } = await supabase
        .from("fives")
        .select("*")
        .eq("created_by", userId)
        .order("date", { ascending: true });

      if (createdError) throw createdError;

      // Get fives user has joined
      const { data: joinedFivesData, error: joinedError } = await supabase
        .from("five_participants")
        .select(`
          five:fives (*)
        `)
        .eq("user_id", userId);

      if (joinedError) throw joinedError;

      const joinedFivesRaw = joinedFivesData as unknown as ({ five: Five | null } & FiveParticipant)[] | null;
      const joinedFives =
        joinedFivesRaw?.map((item) => item.five).filter((f): f is Five => Boolean(f)) || [];

      // Combine and remove duplicates
      const allFivesMap = new Map();
      [...(createdFives || []), ...joinedFives].forEach(five => {
        if (five) allFivesMap.set(five.id, five);
      });
      const allFives = Array.from(allFivesMap.values());

      // Add participant count and user participation status
      const fivesWithDetails = await Promise.all(
        allFives.map(async (five) => {
          const { count } = await supabase
            .from("five_participants")
            .select("*", { count: "exact", head: true })
            .eq("five_id", five.id);

          const { data: participation } = await supabase
            .from("five_participants")
            .select("*")
            .eq("five_id", five.id)
            .eq("user_id", userId)
            .maybeSingle();

          return {
            ...five,
            participantCount: count || 0,
            isUserParticipant: !!participation,
            isFull: (count || 0) >= five.max_players,
            isCreator: five.created_by === userId,
          };
        })
      );

      set({ fives: fivesWithDetails, loading: false });
    } catch (error) {
      console.error("Error fetching fives:", error);
      set({ loading: false });
    }
  },

  fetchFiveByShareCode: async (shareCode, userId) => {
    try {
      const { data: five, error } = await supabase
        .from("fives")
        .select("*")
        .eq("share_code", shareCode.toUpperCase())
        .single();

      if (error) throw error;
      if (!five) return null;

      // Add participant details
      const { count } = await supabase
        .from("five_participants")
        .select("*", { count: "exact", head: true })
        .eq("five_id", five.id);

      const { data: participation } = await supabase
        .from("five_participants")
        .select("*")
        .eq("five_id", five.id)
        .eq("user_id", userId)
        .maybeSingle();

      return {
        ...five,
        participantCount: count || 0,
        isUserParticipant: !!participation,
        isFull: (count || 0) >= five.max_players,
        isCreator: five.created_by === userId,
      };
    } catch (error) {
      console.error("Error fetching five by share code:", error);
      return null;
    }
  },

  createFive: async (
    title,
    location,
    date,
    maxPlayers,
    durationMinutes,
    userId
  ) => {
    try {
      const { data: five, error } = await supabase
        .from("fives")
        .insert({
          group_id: null, // No group needed
          title,
          location,
          date,
          max_players: maxPlayers,
          duration_minutes: durationMinutes,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically join the creator to the five
      await supabase
        .from("five_participants")
        .insert({
          five_id: five.id,
          user_id: userId,
        });

      // Refresh fives
      await get().fetchMyFives(userId);

      return { five, shareCode: five.share_code };
    } catch (error) {
      console.error("Error creating five:", error);
      return null;
    }
  },

  updateFive: async (fiveId, payload, userId) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("fives")
        .select("created_by")
        .eq("id", fiveId)
        .single();

      if (fetchError) throw fetchError;
      if (!existing) throw new Error("Match introuvable");
      if (existing.created_by !== userId) throw new Error("Non autorisé");

      const { data: updated, error: updateError } = await supabase
        .from("fives")
        .update({
          title: payload.title,
          location: payload.location,
          date: payload.date,
          max_players: payload.maxPlayers,
          duration_minutes: payload.durationMinutes,
        })
        .eq("id", fiveId)
        .select()
        .single();

      if (updateError) throw updateError;

      await get().fetchMyFives(userId);

      if (!updated) return null;

      // Rebuild details for return
      const { count } = await supabase
        .from("five_participants")
        .select("*", { count: "exact", head: true })
        .eq("five_id", fiveId);

      const { data: participation } = await supabase
        .from("five_participants")
        .select("*")
        .eq("five_id", fiveId)
        .eq("user_id", userId)
        .maybeSingle();

      return {
        ...updated,
        participantCount: count || 0,
        isUserParticipant: !!participation,
        isFull: (count || 0) >= updated.max_players,
        isCreator: updated.created_by === userId,
      };
    } catch (error) {
      console.error("Error updating five:", error);
      return null;
    }
  },

  joinFive: async (fiveId, userId) => {
    try {
      // Check if five is full
      const { data: five, error: fiveError } = await supabase
        .from("fives")
        .select("*")
        .eq("id", fiveId)
        .single();

      if (fiveError) throw fiveError;

      const { count } = await supabase
        .from("five_participants")
        .select("*", { count: "exact", head: true })
        .eq("five_id", fiveId);

      if ((count || 0) >= five.max_players) {
        throw new Error("Five is full");
      }

      // Join five
      const { error: joinError } = await supabase
        .from("five_participants")
        .insert({
          five_id: fiveId,
          user_id: userId,
        });

      if (joinError) throw joinError;

      // Refresh fives
      await get().fetchMyFives(userId);

      return true;
    } catch (error) {
      console.error("Error joining five:", error);
      return false;
    }
  },

  joinFiveByShareCode: async (shareCode, userId) => {
    try {
      const five = await get().fetchFiveByShareCode(shareCode, userId);
      if (!five) {
        return "notFound";
      }

      if (five.isUserParticipant) {
        return "already";
      }

      if (five.isFull) {
        return "full";
      }

      const joined = await get().joinFive(five.id, userId);
      return joined ? "joined" : "error";
    } catch (error) {
      console.error("Error joining five by share code:", error);
      return "error";
    }
  },

  leaveFive: async (fiveId, userId) => {
    try {
      const { error } = await supabase
        .from("five_participants")
        .delete()
        .eq("five_id", fiveId)
        .eq("user_id", userId);

      if (error) throw error;

      // Refresh fives
      await get().fetchMyFives(userId);

      return true;
    } catch (error) {
      console.error("Error leaving five:", error);
      return false;
    }
  },

  deleteFive: async (fiveId, userId) => {
    try {
      // Verify user is the creator
      const { data: five, error: fiveError } = await supabase
        .from("fives")
        .select("created_by")
        .eq("id", fiveId)
        .single();

      if (fiveError) throw fiveError;
      if (!five) throw new Error("Five not found");

      if (five.created_by !== userId) {
        throw new Error("Only the creator can delete this match");
      }

      // Delete the five (cascade will handle participants)
      const { error: deleteError } = await supabase
        .from("fives")
        .delete()
        .eq("id", fiveId);

      if (deleteError) throw deleteError;

      // Refresh fives
      await get().fetchMyFives(userId);

      return true;
    } catch (error) {
      console.error("Error deleting five:", error);
      return false;
    }
  },

  setCurrentFive: (five) => set({ currentFive: five }),
}));
