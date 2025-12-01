import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export function Landing() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info('L\'application est déjà installée ou non disponible pour l\'installation');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success('Application installée avec succès !');
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">Football Five</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/sign-in')}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Connexion
              </button>
              <button
                onClick={() => navigate('/sign-up')}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                S'inscrire
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-radial from-red-500/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Organisez vos matchs de <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">football</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400 sm:text-xl">
            La plateforme ultime pour créer, gérer et rejoindre des matchs de football entre amis. Simple, rapide et efficace.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate('/sign-up')}
              className="group relative overflow-hidden rounded-lg bg-red-500 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-red-500/30 transition-all hover:bg-red-600 hover:shadow-red-500/40"
            >
              <span className="relative z-10">Commencer gratuitement</span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-red-600 to-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="group flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/50 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:border-red-500/50 hover:bg-slate-900"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Installer l'application
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">Pourquoi Football Five ?</h2>
            <p className="text-lg text-slate-400">Tout ce dont vous avez besoin pour organiser vos matchs</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-white/5 bg-slate-900/30 p-8 backdrop-blur-sm transition-all hover:border-red-500/20 hover:bg-slate-900/50">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Création facile</h3>
              <p className="text-slate-400">Créez un match en quelques secondes. Choisissez la date, le lieu et le nombre de joueurs.</p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-white/5 bg-slate-900/30 p-8 backdrop-blur-sm transition-all hover:border-red-500/20 hover:bg-slate-900/50">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Partage instantané</h3>
              <p className="text-slate-400">Partagez le lien du match avec vos amis via WhatsApp, SMS ou tout autre moyen.</p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-white/5 bg-slate-900/30 p-8 backdrop-blur-sm transition-all hover:border-red-500/20 hover:bg-slate-900/50">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Gestion des joueurs</h3>
              <p className="text-slate-400">Suivez en temps réel qui participe. Gérez les remplaçants et les annulations.</p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border border-white/5 bg-slate-900/30 p-8 backdrop-blur-sm transition-all hover:border-red-500/20 hover:bg-slate-900/50">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Calendrier intégré</h3>
              <p className="text-slate-400">Ajoutez automatiquement vos matchs à votre calendrier mobile en un clic.</p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-2xl border border-white/5 bg-slate-900/30 p-8 backdrop-blur-sm transition-all hover:border-red-500/20 hover:bg-slate-900/50">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Application mobile</h3>
              <p className="text-slate-400">Installez l'app sur votre téléphone et accédez à vos matchs hors ligne.</p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-2xl border border-white/5 bg-slate-900/30 p-8 backdrop-blur-sm transition-all hover:border-red-500/20 hover:bg-slate-900/50">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Sécurisé et privé</h3>
              <p className="text-slate-400">Vos données sont protégées. Contrôlez qui peut voir et rejoindre vos matchs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">Comment ça marche ?</h2>
            <p className="text-lg text-slate-400">En 3 étapes simples</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-2xl font-bold text-white shadow-lg shadow-red-500/30">
                1
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Créez votre match</h3>
              <p className="text-slate-400">Définissez la date, l'heure, le lieu et le nombre de joueurs souhaités.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-2xl font-bold text-white shadow-lg shadow-red-500/30">
                2
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Invitez vos amis</h3>
              <p className="text-slate-400">Partagez le lien unique du match avec votre groupe WhatsApp ou SMS.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-2xl font-bold text-white shadow-lg shadow-red-500/30">
                3
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Jouez !</h3>
              <p className="text-slate-400">Suivez les confirmations en temps réel et retrouvez-vous sur le terrain.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-12 text-center backdrop-blur-sm">
          <h2 className="mb-4 text-4xl font-bold text-white">Prêt à jouer ?</h2>
          <p className="mb-8 text-lg text-slate-400">
            Rejoignez des milliers de joueurs qui organisent leurs matchs avec Football Five
          </p>
          <button
            onClick={() => navigate('/sign-up')}
            className="rounded-lg bg-red-500 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-red-500/30 transition-all hover:bg-red-600 hover:shadow-red-500/40"
          >
            Créer mon premier match
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-900/50 px-4 py-8 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl text-center text-sm text-slate-500">
          <p>&copy; 2024 Football Five. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
