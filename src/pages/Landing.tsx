import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export function Landing() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                  />
                </svg>
              </div>
              <span className="text-xl font-semibold text-white">MatchUp</span>
            </div>

            {/* Auth Buttons */}
            {isSignedIn ? (
              <motion.button
                onClick={() => navigate("/fives")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-lg bg-red-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-600"
              >
                Dashboard
              </motion.button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/sign-in")}
                  className="text-sm font-medium text-slate-400 hover:text-white"
                >
                  Se connecter
                </button>
                <motion.button
                  onClick={() => navigate("/sign-up")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-lg bg-red-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-600"
                >
                  S'inscrire
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-4xl px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-6 text-6xl font-bold leading-tight text-white md:text-7xl">
            Organisez vos matchs{" "}
            <span className="text-red-500">en un clic</span>
          </h1>

          <p className="mb-12 text-xl text-slate-400 md:text-2xl">
            Football 5c5 · Padel 2c2 · Partage simple
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <motion.button
              onClick={() => navigate("/sign-up")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full rounded-lg bg-red-500 px-8 py-4 text-lg font-medium text-white hover:bg-red-600 sm:w-auto"
            >
              Créer un match
            </motion.button>
            <button
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="w-full rounded-lg border border-white/10 px-8 py-4 text-lg font-medium text-white hover:bg-white/5 sm:w-auto"
            >
              En savoir plus
            </button>
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <section id="features" className="border-t border-white/5 bg-slate-950 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-3">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Création rapide
              </h3>
              <p className="text-sm text-slate-400">
                Créez un match en 30 secondes. Date, lieu, nombre de joueurs.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Partage instantané
              </h3>
              <p className="text-sm text-slate-400">
                Un code unique par match. Partagez-le à vos amis, c'est tout.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Gestion simple
              </h3>
              <p className="text-sm text-slate-400">
                Suivez les participants en temps réel. Limite automatique.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-16 text-center text-3xl font-bold text-white">
            Comment ça marche ?
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                1
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-white">
                  Créez votre match
                </h3>
                <p className="text-slate-400">
                  Titre, date, lieu, nombre de joueurs. Vous recevez un code unique.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex gap-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                2
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-white">
                  Partagez le code
                </h3>
                <p className="text-slate-400">
                  Envoyez le code à vos amis par WhatsApp, SMS ou autre.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                3
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-white">
                  Jouez !
                </h3>
                <p className="text-slate-400">
                  Tout le monde s'inscrit, vous voyez qui participe. C'est prêt.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-4xl font-bold text-white">
              Prêt à organiser votre match ?
            </h2>
            <p className="mb-8 text-lg text-slate-400">
              Gratuit. Sans engagement. En 30 secondes.
            </p>
            <motion.button
              onClick={() => navigate("/sign-up")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-red-500 px-8 py-4 text-lg font-medium text-white hover:bg-red-600"
            >
              Commencer maintenant
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                  />
                </svg>
              </div>
              <span className="font-semibold text-white">MatchUp</span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} MatchUp. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
