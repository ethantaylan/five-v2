import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Layout } from '../components/Layout';
import { useFiveStore } from '../stores/useFiveStore';
import { buildShareLink, formatDate, formatDuration } from '../utils/format';

export function FiveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    fetchFiveByShareCode,
    fetchFiveParticipants,
    joinFive,
    leaveFive,
    deleteFive,
    participants,
  } = useFiveStore();
  const [five, setFive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const data = await fetchFiveByShareCode(id, ''); // shareCode or id? using id as code fallback
      if (!data) {
        toast.error('Match introuvable');
        navigate('/fives');
        return;
      }
      setFive(data);
      setLoading(false);
    };
    load();
  }, [fetchFiveByShareCode, id, navigate]);

  useEffect(() => {
    const loadParticipants = async () => {
      if (!five) return;
      setParticipantsLoading(true);
      await fetchFiveParticipants(five.id);
      setParticipantsLoading(false);
    };
    loadParticipants();
  }, [fetchFiveParticipants, five]);

  const handleShare = () => {
    if (!five) return;
    navigator.clipboard.writeText(buildShareLink(five.share_code));
    toast.success('Lien copié !');
  };

  const handleJoin = async () => {
    if (!five) return;
    const success = await joinFive(five.id, five.created_by);
    if (success) toast.success('Rejoint !');
  };

  const handleLeave = async () => {
    if (!five || isLeaving) return;
    setIsLeaving(true);
    const success = await leaveFive(five.id, five.created_by);
    if (success) {
      toast.info('Vous avez quitté le match');
      navigate('/fives');
    }
    setIsLeaving(false);
  };

  const handleDelete = async () => {
    if (!five || isDeleting) return;
    setIsDeleting(true);
    const success = await deleteFive(five.id, five.created_by);
    if (success) {
      toast.success('Match supprimé');
      navigate('/fives');
    }
    setIsDeleting(false);
  };

  const handleAddToCalendar = () => {
    if (!five) return;

    const startDate = new Date(five.date);
    const endDate = new Date(startDate.getTime() + five.duration_minutes * 60000);

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Football Five//FR',
      'BEGIN:VEVENT',
      `UID:${five.id}@footballfive.app`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${five.title}`,
      `LOCATION:${five.location}`,
      `DESCRIPTION:Match de football - ${five.max_players} joueurs`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${five.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Événement téléchargé !');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-500" />
        </div>
      </Layout>
    );
  }

  if (!five) {
    return null;
  }

  const isPast = new Date(five.date) < new Date();
  const isFull = five.isFull;

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/fives')}
            className="inline-flex items-center gap-2 rounded-full border border-border-primary bg-bg-secondary/80 px-3 py-1.5 text-sm font-semibold text-text-primary hover:bg-bg-hover"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
          <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-mono font-semibold text-red-300">
            #{five.share_code}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border-primary bg-bg-modal shadow-2xl relative">
          <button
            onClick={() => navigate('/fives')}
            className="absolute right-4 top-4 inline-flex items-center justify-center rounded-full border border-border-primary bg-bg-secondary/80 p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-hover"
            aria-label="Fermer"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="relative overflow-hidden border-b border-border-primary bg-gradient-to-br from-red-500/10 via-bg-card to-bg-modal px-6 py-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.18),transparent_45%)]" />
            <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                  <span className="rounded-full bg-red-500/15 px-2 py-1 text-red-300">
                    {formatDate(five.date)}
                  </span>
                  <span className="rounded-full bg-bg-secondary/70 px-2 py-1 text-text-secondary">
                    {formatDuration(five.duration_minutes)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-text-primary">{five.title}</h1>
                  {five.isCreator && (
                    <span className="rounded-full bg-red-500/25 px-2 py-0.5 text-xs font-semibold text-red-200">
                      Créateur
                    </span>
                  )}
                </div>
                {five.location && (
                  <button
                    onClick={() => {
                      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(five.location || '')}`;
                      window.open(mapsUrl, '_blank');
                    }}
                    className="mt-2 inline-flex items-center gap-2 rounded-full border border-transparent bg-bg-secondary/80 py-1 text-xs font-medium text-text-secondary hover:border-red-500/40 hover:text-red-300 transition-colors"
                    title="Ouvrir dans Google Maps"
                  >
                    <svg className="h-4 w-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{five.location}</span>
                  </button>
                )}
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <div className="flex items-center gap-2 rounded-full border border-border-primary bg-bg-secondary/80 px-3 py-1.5 text-xs font-semibold text-text-secondary shadow-sm">
                  <svg className="h-4 w-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span className="font-mono text-sm text-text-primary">{five.share_code}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(five.share_code)}
                    className="rounded-full bg-red-500/15 px-2 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-500/25"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-5 px-6 py-5">
            {/* Quick facts */}
            <div className="grid gap-3 rounded-xl border border-border-primary bg-bg-card/60 p-4 md:grid-cols-3">
              <div className="rounded-lg bg-bg-secondary/60 p-3">
                <p className="text-xs text-text-tertiary">Date</p>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <svg className="h-4 w-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(five.date)}</span>
                  <button
                    onClick={handleAddToCalendar}
                    className="rounded-md p-1 text-text-tertiary hover:bg-bg-tertiary/60 hover:text-red-300 transition-colors"
                    title="Ajouter au calendrier"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="rounded-lg bg-bg-secondary/60 p-3">
                <p className="text-xs text-text-tertiary">Durée</p>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <svg className="h-4 w-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatDuration(five.duration_minutes)}</span>
                </div>
              </div>
              <div className="rounded-lg bg-bg-secondary/60 p-3">
                <p className="text-xs text-text-tertiary">Participants</p>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <svg className="h-4 w-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className={isFull ? 'text-red-400' : ''}>
                    {five.participantCount}/{five.max_players}
                  </span>
                </div>
                {isFull && (
                  <p className="mt-1 rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-300">
                    Liste d'attente ouverte
                  </p>
                )}
              </div>
            </div>

            {/* Share */}
            <div className="flex flex-col gap-3 rounded-xl border border-border-primary bg-bg-card/70 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-primary">Partager le match</p>
                <p className="text-xs text-text-tertiary">Lien direct ou code unique, prêt à copier.</p>
              </div>
              <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-end">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary/70 px-3 py-2">
                  <div className="flex-1 overflow-hidden text-xs text-text-secondary">
                    <span className="block truncate">{buildShareLink(five.share_code)}</span>
                  </div>
                  <button
                    onClick={handleShare}
                    className="rounded-md bg-red-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                  >
                    Copier le lien
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary/70 px-3 py-2">
                  <span className="font-mono text-sm font-semibold text-text-primary">{five.share_code}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(five.share_code)}
                    className="rounded-md bg-red-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-3 rounded-xl border border-border-primary bg-bg-card/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Participants ({five.participantCount}/{five.max_players})
                  </h3>
                  {isFull && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Complet</span>
                  )}
                </div>
              </div>

              {participantsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-primary border-t-red-500" />
                </div>
              ) : participants.length === 0 ? (
                <p className="text-sm text-text-tertiary">Aucun participant pour le moment</p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 rounded-lg border border-border-primary bg-bg-secondary/60 p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary">
                          {participant.user?.first_name && participant.user?.last_name
                            ? `${participant.user.first_name} ${participant.user.last_name}`
                            : participant.user?.email}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          Rejoint le {new Date(participant.joined_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="border-t border-border-primary bg-bg-card/70 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-xs text-text-tertiary">
                {isFull ? "Le match est complet, vous rejoindrez la liste d'attente." : "Les places se remplissent vite, agissez maintenant."}
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                {isPast ? (
                  <button
                    disabled
                    className="w-full rounded-lg bg-bg-secondary px-4 py-2 text-sm font-medium text-text-tertiary cursor-not-allowed md:min-w-[180px]"
                  >
                    Ce match est terminé
                  </button>
                ) : five.isCreator ? (
                  <>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50 md:min-w-[140px]"
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </>
                ) : five.isUserParticipant ? (
                  <button
                    onClick={handleLeave}
                    disabled={isLeaving}
                    className="w-full rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50 md:min-w-[200px]"
                  >
                    {isLeaving ? 'Sortie...' : 'Quitter le match'}
                  </button>
                ) : (
                  <button
                    onClick={handleJoin}
                    className={`w-full rounded-lg px-4 py-2 text-sm font-semibold text-white md:min-w-[200px] ${
                      isFull ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {isFull ? 'Rejoindre comme remplaçant' : 'Rejoindre le match'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
