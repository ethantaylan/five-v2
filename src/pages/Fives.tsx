import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useFiveStore } from '../stores/useFiveStore';
import { useUserStore } from '../stores/useUserStore';
import { Layout } from '../components/Layout';

export function Fives() {
  const { fives, loading, fetchMyFives, createFive, joinFive, leaveFive, deleteFive, fetchFiveParticipants, participants, joinFiveByShareCode } = useFiveStore();
  const { user } = useUserStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [fiveToLeave, setFiveToLeave] = useState<typeof fives[0] | null>(null);
  const [fiveToDelete, setFiveToDelete] = useState<typeof fives[0] | null>(null);
  const [fiveToShare, setFiveToShare] = useState<typeof fives[0] | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFive, setSelectedFive] = useState<typeof fives[0] | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyFives(user.id);
    }
  }, [user, fetchMyFives]);

  const handleCreateFive = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const date = formData.get('date') as string;
    const maxPlayers = parseInt(formData.get('maxPlayers') as string) || 10;

    const result = await createFive(
      title,
      description,
      location,
      date,
      maxPlayers,
      user.id
    );

    if (result) {
      toast.success('Match créé avec succès !');
      setShowCreateModal(false);
      // Show share code
      setFiveToShare({ ...result.five, share_code: result.shareCode } as any);
      setShowShareModal(true);
    } else {
      toast.error('Erreur lors de la création du match');
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim() || isJoining) return;

    setIsJoining(true);
    try {
      const success = await joinFiveByShareCode(joinCode.trim().toUpperCase(), user.id);
      if (success) {
        toast.success('Vous avez rejoint le match !');
        setShowJoinModal(false);
        setJoinCode('');
      } else {
        toast.error('Code invalide ou match complet');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinFive = async (fiveId: string) => {
    if (!user) return;
    const success = await joinFive(fiveId, user.id);
    if (success) {
      toast.success('Vous avez rejoint le match !');
    } else {
      toast.error('Erreur lors de la tentative de rejoindre le match');
    }
  };

  const handleLeaveFive = async () => {
    if (!user || !fiveToLeave || isLeaving) return;

    setIsLeaving(true);
    try {
      const success = await leaveFive(fiveToLeave.id, user.id);
      if (success) {
        toast.info('Vous avez quitté le match');
        setShowLeaveModal(false);
        setFiveToLeave(null);
        if (showDetailsModal) {
          setShowDetailsModal(false);
        }
      } else {
        toast.error('Erreur lors de la tentative de quitter le match');
      }
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteFive = async () => {
    if (!user || !fiveToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      const success = await deleteFive(fiveToDelete.id, user.id);
      if (success) {
        toast.success('Match supprimé');
        setShowDeleteModal(false);
        setFiveToDelete(null);
        if (showDetailsModal) {
          setShowDetailsModal(false);
        }
      } else {
        toast.error('Erreur lors de la suppression du match');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowDetails = async (five: typeof fives[0]) => {
    setSelectedFive(five);
    setShowDetailsModal(true);
    await fetchFiveParticipants(five.id);
  };

  const handleCopyShareCode = (shareCode: string) => {
    navigator.clipboard.writeText(shareCode);
    toast.success('Code copié !');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const isFivePast = (dateString: string) => {
    const fiveDate = new Date(dateString);
    const now = new Date();
    return fiveDate < now;
  };

  // Sort fives: upcoming first, then past fives
  const sortedFives = [...fives].sort((a, b) => {
    const aIsPast = isFivePast(a.date);
    const bIsPast = isFivePast(b.date);

    if (aIsPast && !bIsPast) return 1;
    if (!aIsPast && bIsPast) return -1;

    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <Layout>
      <div className="pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Mes Matchs</h1>
          <p className="text-sm text-slate-400">Créez et gérez vos matchs</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white hover:bg-red-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer un match
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900/50 px-4 py-3 text-sm font-medium text-white hover:bg-slate-900/70"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Rejoindre par code
          </button>
        </div>

        {/* Fives List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-500"></div>
          </div>
        ) : fives.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-slate-900/30 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mb-2 font-semibold text-white">Aucun match</p>
            <p className="text-sm text-slate-400">Créez votre premier match ou rejoignez-en un avec un code</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedFives.map((five) => {
              const isPast = isFivePast(five.date);
              return (
              <div
                key={five.id}
                onClick={() => handleShowDetails(five)}
                className={`cursor-pointer rounded-lg border border-white/10 p-4 transition-colors ${
                  isPast
                    ? 'bg-slate-900/30 opacity-60'
                    : 'bg-slate-900/50 hover:border-red-500/50 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{five.title}</h3>
                      {five.isCreator && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                          Créateur
                        </span>
                      )}
                      {isPast && (
                        <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">
                          Terminé
                        </span>
                      )}
                    </div>
                    {five.description && (
                      <p className="mt-1 text-sm text-slate-400">{five.description}</p>
                    )}
                    <div className="mt-3 space-y-1 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatDate(five.date)}</span>
                      </div>
                      {five.location && (
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>{five.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span className={five.isFull ? 'text-red-400' : ''}>
                          {five.participantCount}/{five.max_players} joueurs
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!isPast && five.isCreator && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiveToShare(five);
                          setShowShareModal(true);
                        }}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Partager
                      </button>
                    )}
                    {isPast ? (
                      <button
                        disabled
                        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-500 cursor-not-allowed"
                      >
                        Terminé
                      </button>
                    ) : five.isUserParticipant ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiveToLeave(five);
                          setShowLeaveModal(true);
                        }}
                        className="rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
                      >
                        Se retirer
                      </button>
                    ) : five.isFull ? (
                      <button
                        disabled
                        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-500"
                      >
                        Complet
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinFive(five.id);
                        }}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                      >
                        Rejoindre
                      </button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Créer un match</h2>
              <form onSubmit={handleCreateFive} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-400">Titre</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="Match du samedi"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-400">Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="Match entre amis..."
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-400">Lieu</label>
                  <input
                    type="text"
                    name="location"
                    required
                    placeholder="Salle de sport..."
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-400">Date et heure</label>
                  <input
                    type="datetime-local"
                    name="date"
                    required
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-400">Nombre de joueurs max</label>
                  <input
                    type="number"
                    name="maxPlayers"
                    defaultValue={10}
                    min={2}
                    max={20}
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
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
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join by Code Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Rejoindre un match</h2>
              <form onSubmit={handleJoinByCode} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-400">Code du match</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Entrez le code à 8 caractères"
                    maxLength={8}
                    required
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-center text-2xl font-mono uppercase tracking-widest text-white focus:border-red-500 focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Demandez le code au créateur du match
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinModal(false);
                      setJoinCode('');
                    }}
                    disabled={isJoining}
                    className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isJoining || joinCode.length !== 8}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isJoining ? 'Rejoindre...' : 'Rejoindre'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && fiveToShare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6">
              <div className="mb-4 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                  <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="mb-2 text-xl font-bold text-white">Match créé !</h2>
                <p className="text-sm text-slate-400">Partagez ce code avec vos amis</p>
              </div>

              <div className="mb-6">
                <div className="mb-2 text-center">
                  <div className="mx-auto inline-block rounded-lg border-2 border-dashed border-red-500/50 bg-red-500/10 px-8 py-4">
                    <p className="text-4xl font-mono font-bold tracking-widest text-red-400">
                      {fiveToShare.share_code}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyShareCode(fiveToShare.share_code)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Copier le code
                </button>
              </div>

              <div className="space-y-2 rounded-lg border border-white/10 bg-slate-800/50 p-4">
                <p className="text-sm font-semibold text-white">{fiveToShare.title}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(fiveToShare.date)}</span>
                </div>
                {fiveToShare.location && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{fiveToShare.location}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowShareModal(false);
                  setFiveToShare(null);
                }}
                className="mt-6 w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedFive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedFive.title}</h2>
                    {selectedFive.isCreator && (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                        Créateur
                      </span>
                    )}
                    {isFivePast(selectedFive.date) && (
                      <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">
                        Terminé
                      </span>
                    )}
                  </div>
                  {selectedFive.description && (
                    <p className="mt-1 text-sm text-slate-400">{selectedFive.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(selectedFive.date)}</span>
                </div>
                {selectedFive.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{selectedFive.location}</span>
                  </div>
                )}
                {selectedFive.isCreator && (
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span className="font-mono font-semibold text-red-400">{selectedFive.share_code}</span>
                    </div>
                    <button
                      onClick={() => handleCopyShareCode(selectedFive.share_code)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Copier
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-white">
                    Participants ({selectedFive.participantCount}/{selectedFive.max_players})
                  </h3>
                  {selectedFive.isFull && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                      Complet
                    </span>
                  )}
                </div>

                {participants.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">
                    Aucun participant pour le moment
                  </p>
                ) : (
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {participant.user.first_name && participant.user.last_name
                              ? `${participant.user.first_name} ${participant.user.last_name}`
                              : participant.user.email}
                          </p>
                          <p className="text-xs text-slate-500">
                            Rejoint le {new Date(participant.joined_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-2">
                {isFivePast(selectedFive.date) ? (
                  <button
                    disabled
                    className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-500 cursor-not-allowed"
                  >
                    Ce match est terminé
                  </button>
                ) : (
                  <>
                    {selectedFive.isCreator ? (
                      <>
                        <button
                          onClick={() => {
                            setFiveToShare(selectedFive);
                            setShowShareModal(true);
                          }}
                          className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                        >
                          Partager le code
                        </button>
                        <button
                          onClick={() => {
                            setFiveToDelete(selectedFive);
                            setShowDeleteModal(true);
                          }}
                          className="w-full rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
                        >
                          Supprimer le match
                        </button>
                      </>
                    ) : selectedFive.isUserParticipant ? (
                      <button
                        onClick={() => {
                          setFiveToLeave(selectedFive);
                          setShowLeaveModal(true);
                        }}
                        className="w-full rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
                      >
                        Se retirer du match
                      </button>
                    ) : selectedFive.isFull ? (
                      <button
                        disabled
                        className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-500"
                      >
                        Complet
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleJoinFive(selectedFive.id);
                          setShowDetailsModal(false);
                        }}
                        className="w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                      >
                        Rejoindre le match
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leave Confirmation Modal */}
        {showLeaveModal && fiveToLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
                  <svg
                    className="h-8 w-8 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-xl font-bold text-white">
                  Se retirer du match ?
                </h2>
                <p className="text-sm text-slate-400">
                  Vous êtes sur le point de vous retirer de "{fiveToLeave.title}".
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Vous pourrez rejoindre à nouveau ce match tant qu'il n'est pas complet.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowLeaveModal(false);
                    setFiveToLeave(null);
                  }}
                  disabled={isLeaving}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleLeaveFive}
                  disabled={isLeaving}
                  className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLeaving ? "Retrait..." : "Me retirer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && fiveToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                  <svg
                    className="h-8 w-8 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-xl font-bold text-white">
                  Supprimer le match ?
                </h2>
                <p className="text-sm text-slate-400">
                  Vous êtes sur le point de supprimer "{fiveToDelete.title}".
                </p>
                <p className="mt-2 text-sm text-red-400">
                  Cette action est irréversible. Tous les participants seront retirés.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setFiveToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteFive}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
