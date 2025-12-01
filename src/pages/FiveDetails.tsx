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

  return (
    <Layout>
      <div className="space-y-6">
        <button
          onClick={() => navigate('/fives')}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Retour
        </button>

        <div className="rounded-lg border border-white/10 bg-slate-900/70 p-4">
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{five.title}</h1>
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
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(five.date)}</span>
              <button
                onClick={handleAddToCalendar}
                className="ml-1 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                title="Ajouter au calendrier"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{five.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDuration(five.duration_minutes)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className={five.isFull ? 'text-red-400' : ''}>
                {five.participantCount}/{five.max_players} joueurs
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleShare}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Copier le lien
            </button>
            {!isPast && (
              <>
                {five.isCreator ? (
                  <>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </>
                ) : five.isUserParticipant ? (
                  <button
                    onClick={handleLeave}
                    disabled={isLeaving}
                    className="rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {isLeaving ? 'Sortie...' : 'Quitter'}
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
                    onClick={handleJoin}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                  >
                    Rejoindre
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-white">
              Participants ({five.participantCount}/{five.max_players})
            </h3>
            {five.isFull && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                Complet
              </span>
            )}
          </div>
          {participantsLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-red-500" />
            </div>
          ) : participants.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun participant pour le moment</p>
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
                      {participant.user?.first_name && participant.user?.last_name
                        ? `${participant.user.first_name} ${participant.user.last_name}`
                        : participant.user?.email}
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
      </div>
    </Layout>
  );
}
