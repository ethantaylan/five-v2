import { UserButton, useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUserStore } from '../stores/useUserStore';
import { useSettingsStore } from '../stores/useSettingsStore';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { syncUser } = useUserStore();
  const { theme, setTheme } = useSettingsStore();
  const [openMenu, setOpenMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const canonicalUrl = `${window.location.origin}${location.pathname}${location.search}`;
    const setMeta = (attribute: 'name' | 'property', value: string, content: string) => {
      let meta = document.head.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, value);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    setMeta('property', 'og:url', canonicalUrl);
    setMeta('name', 'twitter:url', canonicalUrl);
    document.title = 'Stryver | Organisez vos événements sportifs';
  }, [location]);

  const gradient =
    theme === 'dark'
      ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(124,58,237,0.08),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.06),transparent_30%)]'
      : '';

  return (
    <div className={`min-h-screen bg-bg-primary text-text-primary transition-colors duration-300 ${gradient}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-bg-card focus:px-4 focus:py-2 focus:text-text-primary"
      >
        Passer au contenu principal
      </a>
      {/* Header */}
      <header className="border-b border-border-primary bg-bg-card/70 text-text-primary backdrop-blur-sm transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between" role="presentation">
            <nav aria-label="Navigation principale" className="flex items-center gap-2">
              <a href="/fives" className="flex items-center gap-2" aria-label="Retour à l'accueil Stryver">
                <img
                  src="/strive-logo.svg"
                  alt="Logo Stryver"
                  className="h-10 w-10 rounded-xl bg-slate-900 object-contain"
                  draggable={false}
                />
                <span className="text-xl font-bold text-text-primary">Stryver</span>
              </a>
              <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400 border border-red-500/30">
                Beta
              </span>
            </nav>
            <div className="flex items-center gap-3" aria-label="Actions utilisateur">
              <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-card px-3 py-2" aria-live="polite">
                <svg className="h-4 w-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <time
                  className="text-sm font-mono font-medium text-text-primary tabular-nums"
                  dateTime={currentTime.toISOString()}
                  aria-label="Heure actuelle"
                >
                  {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </time>
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenMenu((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-primary bg-bg-card text-text-primary hover:border-border-hover hover:bg-bg-hover transition-all duration-200"
                  aria-label="Paramètres d'apparence"
                  aria-expanded={openMenu}
                  aria-haspopup="menu"
                  aria-controls="theme-menu"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {openMenu && (
                  <div
                    id="theme-menu"
                    role="menu"
                    aria-label="Choisir un thème"
                    className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border-primary bg-bg-modal shadow-lg backdrop-blur-sm p-2 transition-all duration-200"
                  >
                    <div className="mb-2 px-2 text-xs font-semibold uppercase text-text-tertiary" role="presentation">
                      Apparence
                    </div>
                    <button
                      onClick={() => {
                        setTheme('light');
                        setOpenMenu(false);
                      }}
                      role="menuitemradio"
                      aria-checked={theme === 'light'}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        theme === 'light'
                          ? 'bg-red-500/10 text-red-500 font-medium'
                          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                      }`}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="flex-1 text-left">Clair</span>
                      {theme === 'light' && (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setTheme('dark');
                        setOpenMenu(false);
                      }}
                      role="menuitemradio"
                      aria-checked={theme === 'dark'}
                      className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        theme === 'dark'
                          ? 'bg-red-500/10 text-red-500 font-medium'
                          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                      }`}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span className="flex-1 text-left">Sombre</span>
                      {theme === 'dark' && (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <div className="my-2 h-px bg-border-primary" role="presentation"></div>
                  </div>
                )}
              </div>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>

    </div>
  );
}
