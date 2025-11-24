import { UserButton, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useUserStore } from '../stores/useUserStore';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { syncUser } = useUserStore();

  useEffect(() => {
    if (user) {
      syncUser(
        user.id,
        user.primaryEmailAddress?.emailAddress || '',
        user.firstName || undefined,
        user.lastName || undefined,
        user.imageUrl || undefined
      );
    }
  }, [user, syncUser]);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(124,58,237,0.08),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.06),transparent_30%)]">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/strive-logo.svg"
                alt="Stryver"
                className="h-10 w-10 rounded-xl bg-slate-900 object-contain"
                draggable={false}
              />
              <span className="text-xl font-bold text-white">Stryver</span>
            </div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

    </div>
  );
}
