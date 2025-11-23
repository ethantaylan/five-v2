import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFiveStore } from '../stores/useFiveStore';
import { useGroupStore } from '../stores/useGroupStore';
import { useUserStore } from '../stores/useUserStore';
import { Layout } from '../components/Layout';

export function Fives() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');

  const { fives, loading, fetchFivesByGroup, createFive, joinFive, leaveFive, fetchFiveParticipants, participants } = useFiveStore();
  const { groups, fetchGroups, currentGroup, setCurrentGroup } = useGroupStore();
  const { user } = useUserStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFive, setSelectedFive] = useState<typeof fives[0] | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groupId || '');

  useEffect(() => {
    if (user) {
      fetchGroups(user.id);
    }
  }, [user, fetchGroups]);

  useEffect(() => {
    if (groupId && user) {
      setSelectedGroupId(groupId);
      fetchFivesByGroup(groupId, user.id);
      const group = groups.find((g) => g.id === groupId);
      if (group) setCurrentGroup(group);
    }
  }, [groupId, user, groups, fetchFivesByGroup, setCurrentGroup]);

  const handleCreateFive = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !selectedGroupId) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const date = formData.get('date') as string;
    const maxPlayers = parseInt(formData.get('maxPlayers') as string) || 10;

    const five = await createFive(
      selectedGroupId,
      title,
      description,
      location,
      date,
      maxPlayers,
      user.id
    );
    if (five) {
      toast.success('Five créé avec succès !');
      setShowCreateModal(false);
    } else {
      toast.error('Erreur lors de la création du five');
    }
  };

  const handleJoinFive = async (fiveId: string) => {
    if (!user) return;
    const success = await joinFive(fiveId, user.id);
    if (success) {
      toast.success('Vous avez rejoint le five !');
    } else {
      toast.error('Erreur lors de la tentative de rejoindre le five');
    }
  };

  const handleLeaveFive = async (fiveId: string) => {
    if (!user) return;
    const success = await leaveFive(fiveId, user.id);
    if (success) {
      toast.info('Vous avez quitté le five');
    } else {
      toast.error('Erreur lors de la tentative de quitter le five');
    }
  };

  const handleShowDetails = async (five: typeof fives[0]) => {
    setSelectedFive(five);
    setShowDetailsModal(true);
    await fetchFiveParticipants(five.id);
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

    // If one is past and the other isn't, upcoming comes first
    if (aIsPast && !bIsPast) return 1;
    if (!aIsPast && bIsPast) return -1;

    // If both are in the same category (both past or both upcoming), sort by date
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  if (!selectedGroupId) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <p className="mb-4 text-slate-400">Sélectionnez ou créez un groupe pour voir les fives</p>
          <button
            onClick={() => navigate('/groups')}
            className="rounded-lg bg-red-500 px-6 py-3 text-sm font-medium text-white hover:bg-red-600"
          >
            Voir les groupes
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pb-20">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/groups')}
            className="mb-2 flex items-center gap-1 text-sm text-slate-400 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour aux groupes
          </button>
          <h1 className="text-2xl font-bold text-white">{currentGroup?.name}</h1>
          <p className="text-sm text-slate-400">Fives disponibles</p>
        </div>

        {/* Fives List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-500"></div>
          </div>
        ) : fives.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-slate-900/30 p-8 text-center">
            <p className="text-slate-400">Aucun five programmé pour ce groupe</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-lg bg-red-500 px-6 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Créer un five
            </button>
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
                  <div>
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
                          handleLeaveFive(five.id);
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

        {/* Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/50 hover:bg-red-600"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <h2 className="mb-4 text-xl font-bold text-white">Créer un five</h2>
              <form onSubmit={handleCreateFive} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-400">Titre</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="Five du samedi"
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

        {/* Details Modal */}
        {showDetailsModal && selectedFive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedFive.title}</h2>
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

              <div className="mt-6">
                {isFivePast(selectedFive.date) ? (
                  <button
                    disabled
                    className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-500 cursor-not-allowed"
                  >
                    Ce five est terminé
                  </button>
                ) : selectedFive.isUserParticipant ? (
                  <button
                    onClick={() => {
                      handleLeaveFive(selectedFive.id);
                      setShowDetailsModal(false);
                    }}
                    className="w-full rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
                  >
                    Se retirer du five
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
                    Rejoindre le five
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
