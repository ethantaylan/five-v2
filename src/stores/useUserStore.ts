import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { User } from "../types/database";

interface UserStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  syncUser: (
    clerkId: string,
    email: string,
    firstName?: string,
    lastName?: string,
    avatarUrl?: string
  ) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
  syncUser: async (clerkId, email, firstName, lastName, avatarUrl) => {
    set({ loading: true });
    try {
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", clerkId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            email,
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
          })
          .eq("clerk_id", clerkId)
          .select()
          .single();

        if (updateError) throw updateError;
        set({ user: updatedUser, loading: false });
      } else {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            clerk_id: clerkId,
            email,
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        set({ user: newUser, loading: false });
      }
    } catch (error) {
      console.error("Error syncing user:", error);
      set({ loading: false });
    }
  },
}));
