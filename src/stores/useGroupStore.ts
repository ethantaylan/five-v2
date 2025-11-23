import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Group, GroupWithMembers } from "../types/database";

interface GroupStore {
  groups: GroupWithMembers[];
  currentGroup: GroupWithMembers | null;
  loading: boolean;
  fetchGroups: (userId: string) => Promise<void>;
  fetchPublicGroups: () => Promise<void>;
  createGroup: (
    name: string,
    description: string,
    isPublic: boolean,
    userId: string
  ) => Promise<Group | null>;
  joinGroup: (
    groupId: string,
    userId: string,
    inviteCode?: string
  ) => Promise<boolean>;
  leaveGroup: (groupId: string, userId: string) => Promise<boolean>;
  setCurrentGroup: (group: GroupWithMembers | null) => void;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  currentGroup: null,
  loading: false,

  fetchGroups: async (userId) => {
    set({ loading: true });
    try {
      // Fetch groups where user is a member
      const { data: memberGroups, error: memberError } = await supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", userId);

      if (memberError) throw memberError;

      const groupIds = (memberGroups || []).map((m: { group_id: string; role: string }) => m.group_id);

      if (groupIds.length === 0) {
        set({ groups: [], loading: false });
        return;
      }

      const { data: groups, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .in("id", groupIds);

      if (groupsError) throw groupsError;

      // Add member count and user role
      const groupsWithDetails = await Promise.all(
        (groups || []).map(async (group) => {
          const { count } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id);

          const userMember = memberGroups?.find((m) => m.group_id === group.id);

          return {
            ...group,
            memberCount: count || 0,
            isUserMember: true,
            userRole: userMember?.role,
          };
        })
      );

      set({ groups: groupsWithDetails, loading: false });
    } catch (error) {
      console.error("Error fetching groups:", error);
      set({ loading: false });
    }
  },

  fetchPublicGroups: async () => {
    set({ loading: true });
    try {
      const { data: groups, error } = await supabase
        .from("groups")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Add member count
      const groupsWithDetails = await Promise.all(
        (groups || []).map(async (group) => {
          const { count } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id);

          return {
            ...group,
            memberCount: count || 0,
            isUserMember: false,
          };
        })
      );

      set({ groups: groupsWithDetails, loading: false });
    } catch (error) {
      console.error("Error fetching public groups:", error);
      set({ loading: false });
    }
  },

  createGroup: async (name, description, isPublic, userId) => {
    try {
      // Generate 4-digit PIN code for private groups
      const inviteCode = isPublic ? null : Math.floor(1000 + Math.random() * 9000).toString();

      const { data: group, error } = await supabase
        .from("groups")
        .insert({
          name,
          description,
          is_public: isPublic,
          created_by: userId,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (error) throw error;
      if (!group) throw new Error("Failed to create group");

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: userId,
          role: "admin",
        });

      // Ignore duplicate key errors (user already added by trigger or other mechanism)
      if (memberError && memberError.code !== '23505') {
        throw memberError;
      }

      // Refresh groups
      await get().fetchGroups(userId);

      return group;
    } catch (error) {
      console.error("Error creating group:", error);
      return null;
    }
  },

  joinGroup: async (groupId, userId, inviteCode) => {
    try {
      // Check if group exists and if it's private, validate invite code
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;

      if (!group.is_public && group.invite_code !== inviteCode) {
        throw new Error("Invalid invite code");
      }

      // Join group
      const { error: joinError } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: userId,
        role: "member",
      });

      if (joinError) throw joinError;

      // Refresh groups
      await get().fetchGroups(userId);

      return true;
    } catch (error) {
      console.error("Error joining group:", error);
      return false;
    }
  },

  leaveGroup: async (groupId, userId) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;

      // Refresh groups
      await get().fetchGroups(userId);

      return true;
    } catch (error) {
      console.error("Error leaving group:", error);
      return false;
    }
  },

  setCurrentGroup: (group) => set({ currentGroup: group }),
}));
