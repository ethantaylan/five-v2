import { useEffect, useRef, useState } from 'react';
import { useMessageStore } from '../stores/useMessageStore';
import { useUserStore } from '../stores/useUserStore';

interface FiveChatProps {
  fiveId: string;
  isCreator: boolean;
}

export function FiveChat({ fiveId, isCreator }: FiveChatProps) {
  const { user } = useUserStore();
  const { messages, loading, fetchMessages, sendMessage, deleteMessage, subscribeToMessages, clearMessages } = useMessageStore();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (fiveId && user) {
      fetchMessages(fiveId);
      const unsubscribe = subscribeToMessages(fiveId);

      return () => {
        unsubscribe();
        clearMessages();
      };
    }
  }, [fiveId, user, fetchMessages, subscribeToMessages, clearMessages]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    const success = await sendMessage(fiveId, user.id, newMessage);
    if (success) {
      setNewMessage('');
      inputRef.current?.focus();
    }
    setIsSending(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    await deleteMessage(messageId, user.id);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderMessageContent = (text: string) => {
    // Regex pour détecter les URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80 transition-opacity"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getUserDisplayName = (message: any) => {
    const firstName = message.user?.first_name || '';
    const lastName = message.user?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || message.user?.email?.split('@')[0] || 'Utilisateur';
  };

  const getUserInitials = (message: any) => {
    const firstName = message.user?.first_name || '';
    const lastName = message.user?.last_name || '';
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-primary border-t-red-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border-primary px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="font-semibold text-text-primary">Discussion</h3>
          <span className="ml-auto text-xs text-text-tertiary">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="mb-1 text-sm font-medium text-text-primary">Aucun message</p>
            <p className="text-xs text-text-tertiary">Soyez le premier à envoyer un message !</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = user?.id === message.user_id;
            const displayName = getUserDisplayName(message);
            const initials = getUserInitials(message);

            return (
              <div
                key={message.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.user?.avatar_url ? (
                    <img
                      src={message.user.avatar_url}
                      alt={displayName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      isOwn
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {initials}
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className={`group relative max-w-[calc(75%-2.5rem)] ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <p className="mb-1 px-3 text-xs font-medium text-text-tertiary">
                      {displayName}
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-red-500 text-white'
                        : 'bg-bg-secondary border border-border-primary text-text-primary'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {renderMessageContent(message.message)}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-2 px-3">
                    <p className="text-[10px] text-text-tertiary">
                      {formatMessageTime(message.created_at)}
                    </p>
                    {(isOwn || isCreator) && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-red-400"
                        title="Supprimer"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border-primary p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Écrivez un message..."
            rows={1}
            disabled={isSending}
            className="flex-1 resize-none rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-red-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        <p className="mt-2 text-[10px] text-text-tertiary">Appuyez sur Entrée pour envoyer</p>
      </div>
    </div>
  );
}
