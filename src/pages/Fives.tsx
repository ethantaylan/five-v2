import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFiveStore } from '../stores/useFiveStore';
import { useUserStore } from '../stores/useUserStore';
import { Layout } from '../components/Layout';
import { buildShareLink, convertLocalDateTimeToUTC, formatDate, formatDateForInput, formatDuration } from '../utils/format';

export function Fives() {
  const {
    fives,
    loading,
    fetchMyFives,
    createFive,
    updateFive,
    joinFive,
    leaveFive,
    deleteFive,
    fetchFiveParticipants,
    participants,
    joinFiveByShareCode,
    removeParticipant,
  } = useFiveStore();
  const { user } = useUserStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveParticipantModal, setShowRemoveParticipantModal] = useState(false);
  const [fiveToLeave, setFiveToLeave] = useState<typeof fives[0] | null>(null);
  const [fiveToDelete, setFiveToDelete] = useState<typeof fives[0] | null>(null);
  const [fiveToShare, setFiveToShare] = useState<typeof fives[0] | null>(null);
  const [fiveToEdit, setFiveToEdit] = useState<typeof fives[0] | null>(null);
  const [participantToRemove, setParticipantToRemove] = useState<typeof participants[0] | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingParticipant, setIsRemovingParticipant] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFive, setSelectedFive] = useState<typeof fives[0] | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [createDuration, setCreateDuration] = useState(60);
  const [editDuration, setEditDuration] = useState(60);
  const [formMaxPlayers, setFormMaxPlayers] = useState(10);
  const [filter, setFilter] = useState<'active' | 'past'>('active');
  const lastAutoJoinCode = useRef<string | null>(null);

  useEffect(() => {
    if (fiveToEdit) {
      setEditDuration(fiveToEdit.duration_minutes || 60);
      setFormMaxPlayers(fiveToEdit.max_players);
    }
  }, [fiveToEdit]);

  useEffect(() => {
    if (user) {
      fetchMyFives(user.id);
    } else if (user === null) {
      // User is not authenticated, stop loading
      // Note: user store returns null when no user is logged in
    }
  }, [user, fetchMyFives]);

  const handleCreateFive = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || isCreating) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const location = formData.get('location') as string;
    const datePart = formData.get('date') as string;
    const timePart = formData.get('time') as string;
    const localDateTime = `${datePart}T${timePart}`;
    const date = convertLocalDateTimeToUTC(localDateTime);
    const maxPlayers = formMaxPlayers;

    setIsCreating(true);
    const result = await createFive(
      title,
      location,
      date,
      maxPlayers,
      createDuration,
      user.id
    );

    if (result) {
      toast.success('Match créé avec succès !');
      setShowCreateModal(false);
      setCreateDuration(60);
      // Show share code
      setFiveToShare({ ...result.five, share_code: result.shareCode } as any);
      setShowShareModal(true);
    } else {
      toast.error('Erreur lors de la création du match');
    }
    setIsCreating(false);
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim() || isJoining) return;

    setIsJoining(true);
    try {
      const status = await joinFiveByShareCode(joinCode.trim().toUpperCase(), user.id);
      if (status === 'joined') {
        toast.success('Vous avez rejoint le match !');
        setShowJoinModal(false);
        setJoinCode('');
      } else if (status === 'joinedAsSub') {
        toast.success('Vous avez rejoint la liste d\'attente en tant que remplaçant !');
        setShowJoinModal(false);
        setJoinCode('');
      } else if (status === 'already') {
        toast.info('Vous êtes déjà inscrit à ce match');
        setShowJoinModal(false);
        setJoinCode('');
      } else if (status === 'notFound') {
        toast.error('Code invalide');
      } else {
        toast.error('Erreur lors de la tentative de rejoindre le match');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinFive = async (fiveId: string) => {
    if (!user) return;
    const five = fives.find(f => f.id === fiveId);
    const isFull = five?.isFull || false;
    const success = await joinFive(fiveId, user.id);
    if (success) {
      if (isFull) {
        toast.success('Vous avez rejoint la liste d\'attente en tant que remplaçant !');
      } else {
        toast.success('Vous avez rejoint le match !');
      }
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

  const handleRemoveParticipant = async () => {
    if (!user || !participantToRemove || !selectedFive || isRemovingParticipant) return;

    setIsRemovingParticipant(true);
    try {
      const success = await removeParticipant(selectedFive.id, participantToRemove.user_id, user.id);
      if (success) {
        toast.success('Participant retiré du match');
        setShowRemoveParticipantModal(false);
        setParticipantToRemove(null);
      } else {
        toast.error('Erreur lors du retrait du participant');
      }
    } finally {
      setIsRemovingParticipant(false);
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

  const handleCopyShareLink = (shareCode: string) => {
    navigator.clipboard.writeText(buildShareLink(shareCode));
    toast.success('Lien copié !');
  };

  const handleEditFive = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !fiveToEdit || isUpdating) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const location = formData.get('location') as string;
    const datePart = formData.get('date') as string;
    const timePart = formData.get('time') as string;
    const localDateTime = `${datePart}T${timePart}`;
    const date = convertLocalDateTimeToUTC(localDateTime);
    const maxPlayers = formMaxPlayers;

    setIsUpdating(true);
    try {
      const updated = await updateFive(
        fiveToEdit.id,
        {
          title,
          location,
          date,
          maxPlayers,
          durationMinutes: editDuration,
        },
        user.id
      );

      if (updated) {
        toast.success('Match mis à jour');
        setShowEditModal(false);
        setFiveToEdit(null);
        setSelectedFive((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
      } else {
        toast.error("Erreur lors de la mise à jour du match");
      }
    } finally {
      setIsUpdating(false);
    }
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

    // Primary sort by match date
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;

    // Secondary sort by creation date to maintain stable order
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const filteredFives = sortedFives.filter((five) => {
    const past = isFivePast(five.date);
    return filter === 'past' ? past : !past;
  });

  // Auto-join when arriving with a share link (?shareCode=XXXXXX)
  useEffect(() => {
    if (!user) return;
    const shareCodeParam = searchParams.get('shareCode');
    if (!shareCodeParam) return;

    const normalizedCode = shareCodeParam.toUpperCase();
    if (lastAutoJoinCode.current === normalizedCode) return;
    lastAutoJoinCode.current = normalizedCode;

    const attemptJoin = async () => {
      const status = await joinFiveByShareCode(normalizedCode, user.id);
      if (status === 'joined') {
        toast.success('Vous avez rejoint le match via le lien !');
        const params = new URLSearchParams(searchParams);
        params.delete('shareCode');
        setSearchParams(params, { replace: true });
      } else if (status === 'joinedAsSub') {
        toast.success('Vous avez rejoint la liste d\'attente en tant que remplaçant via le lien !');
        const params = new URLSearchParams(searchParams);
        params.delete('shareCode');
        setSearchParams(params, { replace: true });
      } else if (status === 'already') {
        toast.info('Vous participez déjà à ce match');
        const params = new URLSearchParams(searchParams);
        params.delete('shareCode');
        setSearchParams(params, { replace: true });
      } else {
        toast.error('Lien invalide ou erreur de connexion au match');
      }
    };

    attemptJoin();
  }, [joinFiveByShareCode, searchParams, setSearchParams, user]);

  return (
    <Layout>
      <div className="pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Mes Matchs</h1>
          <p className="text-sm text-text-tertiary">Créez et gérez vos matchs</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setFormMaxPlayers(10);
                setCreateDuration(60);
                setShowCreateModal(true);
              }}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white hover:bg-red-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer un match
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center justify-center gap-2 rounded-lg border border-border-primary bg-bg-card px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Code
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFilter('active')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                  : 'border border-border-primary bg-bg-card text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              À venir
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filter === 'past'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                  : 'border border-border-primary bg-bg-card text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              Passés
            </button>
          </div>
        </div>

        {/* Fives List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-primary border-t-red-500"></div>
          </div>
        ) : filteredFives.length === 0 ? (
          <div className="rounded-lg border border-border-primary bg-bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mb-2 font-semibold text-text-primary">Aucun match</p>
            <p className="text-sm text-text-tertiary">Créez votre premier match ou rejoignez-en un avec un code</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFives.map((five) => {
              const isPast = isFivePast(five.date);
              return (
              <div
                key={five.id}
                onClick={() => handleShowDetails(five)}
                className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                  isPast
                    ? 'border-border-primary bg-bg-card opacity-60'
                    : 'border-border-primary bg-bg-card hover:border-red-500/50 hover:bg-bg-hover hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary">{five.title}</h3>
                    {five.isCreator && (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                        Créateur
                      </span>
                    )}
                    {isPast && (
                      <span className="rounded-full bg-text-tertiary/20 px-2 py-0.5 text-xs text-text-tertiary">
                        Terminé
                      </span>
                    )}
                  </div>
                    <div className="mt-3 space-y-1 text-sm text-text-tertiary">
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatDuration(five.duration_minutes)}</span>
                    </div>
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
                    {/* Actions removed on card for a cleaner list; manage from details modal */}
                    {isPast ? (
                      <button
                        disabled
                        className="rounded-lg bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-tertiary cursor-not-allowed"
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
                        className="rounded-lg bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-tertiary cursor-not-allowed"
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
            <div className="w-full max-w-md rounded-lg border border-border-primary bg-bg-modal p-6 shadow-2xl">
              <h2 className="mb-4 text-xl font-bold text-text-primary">Créer un match</h2>
              <form onSubmit={handleCreateFive} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">Titre</label>
                  <input
                    type="text"
                    name="title"
                    required
                    maxLength={60}
                    className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-text-primary focus:border-red-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">Lieu</label>
                  <input
                    type="text"
                    name="location"
                    required
                    maxLength={80}
                    className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-text-primary focus:border-red-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">Date et heure</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                      <svg className="h-4 w-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        name="date"
                        required
                        className="flex-1 rounded-lg border border-border-primary/50 bg-transparent px-2 py-1 text-text-primary focus:border-red-500 focus:outline-none [appearance:textfield]"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                      <svg className="h-4 w-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <input
                        type="time"
                        name="time"
                        required
                        className="flex-1 rounded-lg border border-border-primary/50 bg-transparent px-2 py-1 text-text-primary focus:border-red-500 focus:outline-none [appearance:textfield]"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm text-text-tertiary">
                    <label>Durée (minutes)</label>
                    <span className="text-text-primary font-medium">{createDuration} min</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={120}
                    step={30}
                    value={createDuration}
                    onChange={(e) => setCreateDuration(parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  <div className="mt-1 flex justify-between text-xs text-text-tertiary">
                    <span>30m</span>
                    <span>60m</span>
                    <span>90m</span>
                    <span>120m</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">Nombre de joueurs max</label>
                  <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setFormMaxPlayers((prev) => Math.max(2, prev - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-primary bg-bg-tertiary text-text-primary hover:border-red-500 transition-colors"
                      aria-label="Diminuer"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      name="maxPlayers"
                      value={formMaxPlayers}
                      readOnly
                      min={2}
                      max={20}
                      className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-4 py-2 text-center text-text-primary focus:border-red-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormMaxPlayers((prev) => Math.min(20, prev + 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-primary bg-bg-tertiary text-text-primary hover:border-red-500 transition-colors"
                      aria-label="Augmenter"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                    className="flex-1 rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover disabled:opacity-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {isCreating ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join by Code Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-border-primary bg-bg-modal p-6 shadow-2xl">
              <h2 className="mb-4 text-xl font-bold text-text-primary">Rejoindre un match</h2>
              <form onSubmit={handleJoinByCode} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">Code du match</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Entrez le code à 8 caractères"
                    maxLength={8}
                    required
                    className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-center font-mono uppercase tracking-widest text-text-primary focus:border-red-500 focus:outline-none transition-colors"
                  />
                  <p className="mt-2 text-xs text-text-tertiary">
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
                    className="flex-1 rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover disabled:opacity-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isJoining || joinCode.length !== 8}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    {isJoining ? 'Rejoindre...' : 'Rejoindre'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && fiveToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-border-primary bg-bg-modal p-6 shadow-2xl">
              <h2 className="mb-4 text-xl font-bold text-text-primary">Modifier le match</h2>
              <form onSubmit={handleEditFive} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">Titre</label>
                  <input
                    type="text"
                    name="title"
                    required
                    maxLength={60}
                    defaultValue={fiveToEdit.title}
                    className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">Lieu</label>
                  <input
                    type="text"
                    name="location"
                    required
                    maxLength={80}
                    defaultValue={fiveToEdit.location || ''}
                    className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">Date et heure</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                      <svg className="h-4 w-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        name="date"
                        required
                        defaultValue={formatDateForInput(fiveToEdit.date).slice(0, 10)}
                        className="flex-1 rounded-lg border border-white/5 bg-transparent px-2 py-1 text-white focus:border-red-500 focus:outline-none [appearance:textfield]"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                      <svg className="h-4 w-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <input
                        type="time"
                        name="time"
                        required
                        defaultValue={formatDateForInput(fiveToEdit.date).slice(11, 16)}
                        className="flex-1 rounded-lg border border-white/5 bg-transparent px-2 py-1 text-white focus:border-red-500 focus:outline-none [appearance:textfield]"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm text-text-tertiary">
                    <label>Durée (minutes)</label>
                    <span className="text-text-primary">{editDuration} min</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={120}
                    step={30}
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  <div className="mt-1 flex justify-between text-xs text-text-tertiary">
                    <span>30m</span>
                    <span>60m</span>
                    <span>90m</span>
                    <span>120m</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">Nombre de joueurs max</label>
                  <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setFormMaxPlayers((prev) => Math.max(2, prev - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-primary bg-bg-tertiary text-white hover:border-red-500"
                      aria-label="Diminuer"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      name="maxPlayers"
                      value={formMaxPlayers}
                      readOnly
                      min={2}
                      max={20}
                      className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-4 py-2 text-center text-white focus:border-red-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormMaxPlayers((prev) => Math.min(20, prev + 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-primary bg-bg-tertiary text-white hover:border-red-500"
                      aria-label="Augmenter"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setFiveToEdit(null);
                    }}
                    disabled={isUpdating}
                    className="flex-1 rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-white hover:bg-bg-secondary disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && fiveToShare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-border-primary bg-bg-modal p-6 shadow-2xl">
              <div className="mb-4 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                  <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="mb-2 text-xl font-bold text-text-primary">Match créé !</h2>
                <p className="text-sm text-text-tertiary">Partagez ce lien avec vos amis</p>
              </div>

              <div className="mb-6 rounded-lg border-2 border-red-500/50 bg-red-500/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-primary">Lien de partage</p>
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="mb-3 overflow-hidden rounded-lg border border-red-500/30 bg-bg-modal/50 px-3 py-3">
                  <span className="block break-all text-sm text-text-primary">{buildShareLink(fiveToShare.share_code)}</span>
                </div>
                <button
                  onClick={() => handleCopyShareLink(fiveToShare.share_code)}
                  className="w-full rounded-lg bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-600"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copier le lien
                  </div>
                </button>
                <p className="mt-3 text-xs text-text-tertiary">Toute personne connectée avec ce lien rejoindra automatiquement le match.</p>
              </div>

              <div className="mb-6">
                <details className="group">
                  <summary className="cursor-pointer list-none text-center text-xs text-text-tertiary hover:text-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      Ou partager par code
                      <svg className="h-3 w-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-3 rounded-lg border border-border-primary bg-bg-secondary/60 p-4">
                    <div className="mb-2 text-center">
                      <div className="mx-auto inline-block rounded-lg border border-border-primary bg-bg-tertiary px-6 py-2">
                        <p className="text-2xl font-mono font-bold tracking-widest text-text-primary">
                          {fiveToShare.share_code}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyShareCode(fiveToShare.share_code)}
                      className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover"
                    >
                      Copier le code
                    </button>
                  </div>
                </details>
              </div>

              <div className="space-y-2 rounded-lg border border-border-primary bg-bg-secondary/50 p-4">
                <p className="text-sm font-semibold text-text-primary">{fiveToShare.title}</p>
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(fiveToShare.date)}</span>
                </div>
                {fiveToShare.location && (
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{fiveToShare.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatDuration(fiveToShare.duration_minutes)}</span>
                </div>
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
            <div className="flex w-full max-w-md flex-col rounded-lg border border-border-primary bg-bg-modal shadow-2xl max-h-[90vh]">
              {/* Header - Fixed */}
              <div className="flex items-start justify-between border-b border-border-primary p-6 pb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-text-primary">{selectedFive.title}</h2>
                    {selectedFive.isCreator && (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                        Créateur
                      </span>
                    )}
                    {isFivePast(selectedFive.date) && (
                      <span className="rounded-full bg-bg-tertiary/50 px-2 py-0.5 text-xs text-text-tertiary">
                        Terminé
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-3 border-b border-border-primary pb-4">
                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(selectedFive.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatDuration(selectedFive.duration_minutes)}</span>
                </div>
                {selectedFive.location && (
                  <div className="flex items-center gap-2 text-sm text-text-tertiary">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{selectedFive.location}</span>
                  </div>
                )}
                <div className="space-y-2 rounded-lg bg-bg-secondary/50 p-3">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border-primary bg-bg-tertiary/60 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span className="font-mono font-semibold text-red-400">{selectedFive.share_code}</span>
                    </div>
                    <button
                      onClick={() => handleCopyShareCode(selectedFive.share_code)}
                      className="rounded-lg border border-border-primary bg-bg-secondary px-3 py-1 text-xs font-medium text-text-primary hover:bg-bg-hover"
                    >
                      Copier
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border-primary bg-bg-tertiary/60 px-3 py-2">
                    <div className="flex-1 overflow-hidden text-xs text-text-secondary">
                      <span className="block truncate">{buildShareLink(selectedFive.share_code)}</span>
                    </div>
                    <button
                      onClick={() => handleCopyShareLink(selectedFive.share_code)}
                      className="rounded-lg border border-border-primary bg-bg-secondary px-3 py-1 text-xs font-medium text-text-primary hover:bg-bg-hover"
                    >
                      Copier
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Participants ({selectedFive.participantCount}/{selectedFive.max_players})
                  </h3>
                  {selectedFive.isFull && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                      Complet
                    </span>
                  )}
                </div>

                {participants.filter(p => !p.is_substitute).length === 0 ? (
                  <p className="py-3 text-center text-xs text-text-tertiary">
                    Aucun participant
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {participants.filter(p => !p.is_substitute).map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2 rounded-lg bg-bg-secondary/50 p-2"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-medium text-text-primary">
                              {participant.user.first_name && participant.user.last_name
                                ? `${participant.user.first_name} ${participant.user.last_name}`
                                : participant.user.email}
                            </p>
                            {participant.user_id === selectedFive.created_by && (
                              <span className="flex-shrink-0 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-300">
                                Organisateur
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedFive.isCreator && participant.user_id !== selectedFive.created_by && (
                          <button
                            onClick={() => {
                              setParticipantToRemove(participant);
                              setShowRemoveParticipantModal(true);
                            }}
                            className="flex-shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-red-500/10 hover:text-red-400"
                            title="Retirer du match"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {participants.filter(p => p.is_substitute).length > 0 && (
                <div className="mt-3">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">
                      Remplaçants ({selectedFive.substituteCount})
                    </h3>
                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
                      Liste d'attente
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {participants.filter(p => p.is_substitute).map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-bg-secondary/30 p-2"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {participant.user.first_name && participant.user.last_name
                              ? `${participant.user.first_name} ${participant.user.last_name}`
                              : participant.user.email}
                          </p>
                        </div>
                        {selectedFive.isCreator && (
                          <button
                            onClick={() => {
                              setParticipantToRemove(participant);
                              setShowRemoveParticipantModal(true);
                            }}
                            className="flex-shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-red-500/10 hover:text-red-400"
                            title="Retirer de la liste d'attente"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>

              {/* Footer - Fixed */}
              <div className="border-t border-border-primary p-6 pt-4">
                <div className="space-y-2">
                {isFivePast(selectedFive.date) ? (
                  <button
                    disabled
                    className="w-full rounded-lg bg-bg-secondary px-4 py-2 text-sm font-medium text-text-tertiary cursor-not-allowed"
                  >
                    Ce match est terminé
                  </button>
                ) : (
                  <>
                    {selectedFive.isCreator ? (
                      <>
                        <button
                          onClick={() => {
                            setFiveToEdit(selectedFive);
                            setShowDetailsModal(false);
                            setShowEditModal(true);
                          }}
                          className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-bg-hover"
                        >
                          Modifier
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
                        {selectedFive.isUserSubstitute ? 'Se retirer de la liste d\'attente' : 'Se retirer du match'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleJoinFive(selectedFive.id);
                          setShowDetailsModal(false);
                        }}
                        className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white ${
                          selectedFive.isFull
                            ? 'bg-yellow-500 hover:bg-yellow-600'
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {selectedFive.isFull ? 'Rejoindre comme remplaçant' : 'Rejoindre le match'}
                      </button>
                    )}
                  </>
                )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leave Confirmation Modal */}
        {showLeaveModal && fiveToLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-border-primary bg-bg-modal p-6 shadow-2xl">
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
                <h2 className="mb-2 text-xl font-bold text-text-primary">
                  Se retirer du match ?
                </h2>
                <p className="text-sm text-text-tertiary">
                  Vous êtes sur le point de vous retirer de "{fiveToLeave.title}".
                </p>
                <p className="mt-2 text-sm text-text-tertiary">
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
                  className="flex-1 rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary hover:bg-bg-hover disabled:opacity-50"
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
            <div className="w-full max-w-md rounded-lg border border-border-primary bg-bg-modal p-6 shadow-2xl">
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
                <h2 className="mb-2 text-xl font-bold text-text-primary">
                  Supprimer le match ?
                </h2>
                <p className="text-sm text-text-tertiary">
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
                  className="flex-1 rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-white hover:bg-bg-secondary disabled:opacity-50"
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

        {/* Remove Participant Confirmation Modal */}
        {showRemoveParticipantModal && participantToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-border-primary bg-bg-modal p-6 shadow-2xl">
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
                <h2 className="mb-2 text-xl font-bold text-text-primary">
                  Retirer ce participant ?
                </h2>
                <p className="text-sm text-text-tertiary">
                  Vous êtes sur le point de retirer{' '}
                  <span className="font-medium text-text-primary">
                    {participantToRemove.user.first_name && participantToRemove.user.last_name
                      ? `${participantToRemove.user.first_name} ${participantToRemove.user.last_name}`
                      : participantToRemove.user.email}
                  </span>{' '}
                  du match.
                </p>
                <p className="mt-2 text-sm text-text-tertiary">
                  Cette personne pourra rejoindre à nouveau le match si elle le souhaite.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRemoveParticipantModal(false);
                    setParticipantToRemove(null);
                  }}
                  disabled={isRemovingParticipant}
                  className="flex-1 rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-white hover:bg-bg-secondary disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRemoveParticipant}
                  disabled={isRemovingParticipant}
                  className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRemovingParticipant ? "Retrait..." : "Retirer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
