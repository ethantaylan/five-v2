import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { FiveWithDetails } from "../types/database";

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
  fetchFivesByGroup: (groupId: string, userId: string) => Promise<void>;
  fetchFiveParticipants: (fiveId: string) => Promise<void>;
  createFive: (
    groupId: string,
    title: string,
    description: string,
    location: string,
    date: string,
    maxPlayers: number,
    userId: string
  ) => Promise<Five | null>;
  joinFive: (fiveId: string, userId: string) => Promise<boolean>;
  leaveFive: (fiveId: string, userId: string) => Promise<boolean>;
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

      set({ participants: participants || [] });
    } catch (error) {
      console.error("Error fetching five participants:", error);
      set({ participants: [] });
    }
  },

  fetchFivesByGroup: async (groupId, userId) => {
    set({ loading: true });
    try {
      const { data: fives, error } = await supabase
        .from("fives")
        .select("*")
        .eq("group_id", groupId)
        .order("date", { ascending: true });

      if (error) throw error;

      // Add participant count and user participation status
      const fivesWithDetails = await Promise.all(
        (fives || []).map(async (five) => {
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
          };
        })
      );

      set({ fives: fivesWithDetails, loading: false });
    } catch (error) {
      console.error("Error fetching fives:", error);
      set({ loading: false });
    }
  },

  createFive: async (
    groupId,
    title,
    description,
    location,
    date,
    maxPlayers,
    userId
  ) => {
    try {
      const { data: five, error } = await supabase
        .from("fives")
        .insert({
          group_id: groupId,
          title,
          description,
          location,
          date,
          max_players: maxPlayers,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh fives
      await get().fetchFivesByGroup(groupId, userId);

      return five;
    } catch (error) {
      console.error("Error creating five:", error);
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
      await get().fetchFivesByGroup(five.group_id, userId);

      return true;
    } catch (error) {
      console.error("Error joining five:", error);
      return false;
    }
  },

  leaveFive: async (fiveId, userId) => {
    try {
      const { data: five } = await supabase
        .from("fives")
        .select("group_id")
        .eq("id", fiveId)
        .single();

      const { error } = await supabase
        .from("five_participants")
        .delete()
        .eq("five_id", fiveId)
        .eq("user_id", userId);

      if (error) throw error;

      // Refresh fives
      if (five) {
        await get().fetchFivesByGroup(five.group_id, userId);
      }

      return true;
    } catch (error) {
      console.error("Error leaving five:", error);
      return false;
    }
  },

  setCurrentFive: (five) => set({ currentFive: five }),
}));
