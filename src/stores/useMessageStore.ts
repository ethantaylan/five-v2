import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  five_id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url?: string | null;
  };
}

interface MessageStore {
  messages: Message[];
  loading: boolean;
  error: string | null;
  fetchMessages: (fiveId: string) => Promise<void>;
  sendMessage: (fiveId: string, userId: string, message: string) => Promise<boolean>;
  deleteMessage: (messageId: string, userId: string) => Promise<boolean>;
  subscribeToMessages: (fiveId: string) => () => void;
  clearMessages: () => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  loading: false,
  error: null,

  fetchMessages: async (fiveId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:users (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('five_id', fiveId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ messages: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      set({ error: error.message, loading: false });
    }
  },

  sendMessage: async (fiveId: string, userId: string, message: string) => {
    if (!message.trim()) return false;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          five_id: fiveId,
          user_id: userId,
          message: message.trim(),
        })
        .select(`
          *,
          user:users (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Add the new message to the store
      set((state) => ({
        messages: [...state.messages, data],
      }));

      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      set({ error: error.message });
      return false;
    }
  },

  deleteMessage: async (messageId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', userId);

      if (error) throw error;

      // Remove the message from the store
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== messageId),
      }));

      return true;
    } catch (error: any) {
      console.error('Error deleting message:', error);
      set({ error: error.message });
      return false;
    }
  },

  subscribeToMessages: (fiveId: string) => {
    const channel = supabase
      .channel(`messages:${fiveId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `five_id=eq.${fiveId}`,
        },
        async (payload) => {
          // Fetch the full message with user data
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              user:users (
                id,
                first_name,
                last_name,
                email,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            set((state) => {
              // Check if message already exists
              const exists = state.messages.some((msg) => msg.id === data.id);
              if (exists) return state;

              return {
                messages: [...state.messages, data],
              };
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `five_id=eq.${fiveId}`,
        },
        (payload) => {
          set((state) => ({
            messages: state.messages.filter((msg) => msg.id !== payload.old.id),
          }));
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  clearMessages: () => {
    set({ messages: [], error: null });
  },
}));
