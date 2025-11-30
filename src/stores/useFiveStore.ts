import { create } from "zustand";
import type { Five, FiveWithDetails } from "../types/database";
import {
  createFive as svcCreateFive,
  deleteFive as svcDeleteFive,
  fetchFiveByShareCode as svcFetchFiveByShareCode,
  fetchFiveParticipants as svcFetchFiveParticipants,
  fetchFivesForUser,
  joinFive as svcJoinFive,
  updateFive as svcUpdateFive,
  leaveFive as svcLeaveFive,
} from "../services/fiveService";

interface FiveParticipantWithUser {
  id: string;
  user_id: string;
  joined_at: string;
  is_substitute: boolean;
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
  ) => Promise<"joined" | "joinedAsSub" | "already" | "notFound" | "error">;
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
      const participants = await svcFetchFiveParticipants(fiveId);
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
      const fivesWithDetails = await fetchFivesForUser(userId);
      set({ fives: fivesWithDetails, loading: false });
    } catch (error) {
      console.error("Error fetching fives:", error);
      set({ loading: false });
    }
  },

  fetchFiveByShareCode: async (shareCode, userId) => {
    try {
      return await svcFetchFiveByShareCode(shareCode, userId);
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
      const five = await svcCreateFive({
        group_id: null,
        title,
        location,
        date,
        max_players: maxPlayers,
        duration_minutes: durationMinutes,
        created_by: userId,
      } as Five);

      await svcJoinFive(five.id, userId);
      await get().fetchMyFives(userId);

      return { five, shareCode: (five as Five).share_code };
    } catch (error) {
      console.error("Error creating five:", error);
      return null;
    }
  },

  updateFive: async (fiveId, payload, userId) => {
    try {
      const updated = await svcUpdateFive(
        fiveId,
        {
          title: payload.title,
          location: payload.location,
          date: payload.date,
          max_players: payload.maxPlayers,
          duration_minutes: payload.durationMinutes,
        } as Partial<Five>,
        userId
      );

      await get().fetchMyFives(userId);

      if (!updated) return null;
      return await svcFetchFiveByShareCode(updated.share_code, userId);
    } catch (error) {
      console.error("Error updating five:", error);
      return null;
    }
  },

  joinFive: async (fiveId, userId) => {
    try {
      await svcJoinFive(fiveId, userId);
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

      const isFull = five.isFull;
      const joined = await get().joinFive(five.id, userId);

      if (!joined) return "error";

      // Return different status based on whether they joined as substitute
      return isFull ? "joinedAsSub" : "joined";
    } catch (error) {
      console.error("Error joining five by share code:", error);
      return "error";
    }
  },

  leaveFive: async (fiveId, userId) => {
    try {
      await svcLeaveFive(fiveId, userId);
      await get().fetchMyFives(userId);

      return true;
    } catch (error) {
      console.error("Error leaving five:", error);
      return false;
    }
  },

  deleteFive: async (fiveId, userId) => {
    try {
      await svcDeleteFive(fiveId, userId);
      await get().fetchMyFives(userId);

      return true;
    } catch (error) {
      console.error("Error deleting five:", error);
      return false;
    }
  },

  setCurrentFive: (five) => set({ currentFive: five }),
}));
