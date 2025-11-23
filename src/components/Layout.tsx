import { UserButton, useUser } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from '../stores/useUserStore';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { syncUser } = useUserStore();
  const location = useLocation();

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">MatchUp</span>
            </div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-slate-900/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-around px-4 py-3">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 ${
              isActive('/') ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs font-medium">Accueil</span>
          </Link>

          <Link
            to="/fives"
            className={`flex flex-col items-center gap-1 ${
              isActive('/fives') ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-medium">Matchs</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
