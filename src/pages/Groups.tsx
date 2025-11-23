import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Layout } from "../components/Layout";
import { supabase } from "../lib/supabase";
import { useGroupStore } from "../stores/useGroupStore";
import { useUserStore } from "../stores/useUserStore";

export function Groups() {
  const navigate = useNavigate();
  const {
    groups,
    loading,
    fetchGroups,
    fetchPublicGroups,
    createGroup,
    joinGroup,
  } = useGroupStore();
  const { user } = useUserStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [view, setView] = useState<"my" | "public">("my");
  const [isCreating, setIsCreating] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [newGroupId, setNewGroupId] = useState("");

  useEffect(() => {
    if (user) {
      if (view === "my") {
        fetchGroups(user.id);
      } else {
        fetchPublicGroups();
      }
    }
  }, [user, view, fetchGroups, fetchPublicGroups]);

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || isCreating) return;

    setIsCreating(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const isPublic = formData.get("isPublic") === "on";

      const group = await createGroup(name, description, isPublic, user.id);
      if (group) {
        toast.success("Groupe créé avec succès !");
        setShowCreateModal(false);

        // If private group, show the invite code modal
        if (!isPublic && group.invite_code) {
          setNewGroupCode(group.invite_code);
          setNewGroupId(group.id);
          setShowSuccessModal(true);
        } else {
          // If public, navigate directly
          navigate(`/fives?groupId=${group.id}`);
        }
      } else {
        toast.error("Erreur lors de la création du groupe");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async (groupId: string, code?: string) => {
    if (!user) return;
    const success = await joinGroup(groupId, user.id, code);
    if (success) {
      toast.success("Vous avez rejoint le groupe !");
      setShowJoinModal(false);
      navigate(`/fives?groupId=${groupId}`);
    } else {
      toast.error("Erreur lors de la tentative de rejoindre le groupe");
    }
  };

  const handleJoinWithCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;

    // Extract group ID from invite code if needed
    // For now, we'll need to find the group by invite code
    const { data: group } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", inviteCode.trim())
      .single();

    if (group) {
      await handleJoinGroup(group.id, inviteCode.trim());
      setInviteCode("");
    } else {
      toast.error("Code d'invitation invalide");
    }
  };

  return (
    <Layout>
      <div className="pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Groupes</h1>
          <p className="text-sm text-slate-400">
            Rejoignez ou créez un groupe pour organiser vos fives
          </p>
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex gap-2 rounded-lg bg-slate-900/50 p-1">
          <button
            onClick={() => setView("my")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === "my"
                ? "bg-red-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Mes groupes
          </button>
          <button
            onClick={() => setView("public")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === "public"
                ? "bg-red-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Publics
          </button>
        </div>

        {/* Join with Code Button */}
        <motion.button
          onClick={() => setShowJoinModal(true)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-slate-900/50 px-4 py-3 text-sm font-medium text-white hover:bg-slate-900/70"
          whileHover={{ scale: 1.02, backgroundColor: "rgba(15, 23, 42, 0.7)" }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-2">
            <motion.svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              whileHover={{ rotate: 15 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </motion.svg>
            Rejoindre avec un code
          </div>
        </motion.button>

        {/* Groups List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-500"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-slate-900/30 p-8 text-center">
            <p className="text-slate-400">
              {view === "my"
                ? "Vous ne faites partie d'aucun groupe"
                : "Aucun groupe public disponible"}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-lg bg-red-500 px-6 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Créer un groupe
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/fives?groupId=${group.id}`)}
                className="cursor-pointer rounded-lg border border-white/10 bg-slate-900/50 p-4 transition-colors hover:border-red-500/50 hover:bg-slate-900/70"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{group.name}</h3>
                      {!group.is_public && (
                        <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
                          Privé
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="mt-1 text-sm text-slate-400">
                        {group.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <span>{group.memberCount} membres</span>
                      {group.userRole === "admin" && (
                        <span className="text-red-400">Admin</span>
                      )}
                    </div>
                    {group.userRole === "admin" &&
                      !group.is_public &&
                      group.invite_code && (
                        <div className="mt-2 flex items-center gap-2 rounded bg-slate-800/50 px-3 py-2">
                          <span className="text-xs text-slate-400">PIN:</span>
                          <code className="text-base font-bold tracking-wider text-yellow-400">
                            {group.invite_code}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(
                                group.invite_code || ""
                              );
                              toast.success("Code copié !");
                            }}
                            className="ml-auto text-slate-400 hover:text-white"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                  </div>
                  {view === "public" && !group.isUserMember && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinGroup(group.id);
                      }}
                      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                    >
                      Rejoindre
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/50 hover:bg-red-600"
        >
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
        </button>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">
                Créer un groupe
              </h2>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-400">
                    Nom du groupe
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-400">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isPublic"
                    id="isPublic"
                    className="h-4 w-4 rounded border-white/10 bg-slate-800 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="isPublic" className="text-sm text-slate-400">
                    Groupe public
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? "Création..." : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join with Code Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">
                Rejoindre un groupe privé
              </h2>
              <form onSubmit={handleJoinWithCode} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-400">
                    Code d'invitation
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Code à 4 chiffres"
                    required
                    maxLength={4}
                    pattern="[0-9]{4}"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-center text-2xl font-bold tracking-widest text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Demandez le code d'invitation à l'administrateur du groupe
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinModal(false);
                      setInviteCode("");
                    }}
                    className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                  >
                    Rejoindre
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Modal - Show Invite Code */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                  <svg
                    className="h-8 w-8 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-xl font-bold text-white">
                  Groupe créé avec succès !
                </h2>
                <p className="text-sm text-slate-400">
                  Voici le code d'invitation pour votre groupe privé
                </p>
              </div>

              <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6">
                <p className="mb-2 text-center text-xs font-medium text-yellow-400">
                  CODE D'INVITATION
                </p>
                <div className="mb-4 text-center">
                  <code className="text-4xl font-bold tracking-widest text-yellow-400">
                    {newGroupCode}
                  </code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newGroupCode);
                    toast.success("Code copié !");
                  }}
                  className="w-full rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-4 py-2 text-sm font-medium text-yellow-400 hover:bg-yellow-500/30"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copier le code
                  </div>
                </button>
              </div>

              <p className="mb-4 text-center text-xs text-slate-500">
                Partagez ce code avec les personnes que vous souhaitez inviter
              </p>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(`/fives?groupId=${newGroupId}`);
                }}
                className="w-full rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white hover:bg-red-600"
              >
                Continuer vers le groupe
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
