import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { Layout } from '../components/Layout';
import { fetchFiveById, joinFive } from '../services/fiveService';
import { formatDate, formatDuration } from '../utils/format';
import type { FiveWithDetails } from '../types/database';

export function EventPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const navigate = useNavigate();
  const [event, setEvent] = useState<FiveWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) {
        navigate('/fives');
        return;
      }

      try {
        // Si l'utilisateur n'est pas connecté, on charge quand même les données pour les meta tags
        const userId = user?.id || 'anonymous';
        const eventData = await fetchFiveById(id, userId);

        if (!eventData) {
          toast.error("Événement introuvable");
          navigate('/fives');
          return;
        }

        setEvent(eventData);

        // Mettre à jour les meta tags dynamiquement
        document.title = `${eventData.title} | Stryver`;

        const setMeta = (attribute: 'name' | 'property', value: string, content: string) => {
          let meta = document.head.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement | null;
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, value);
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', content);
        };

        const description = `${eventData.title} - ${formatDate(eventData.date)} à ${eventData.location}. ${(eventData.participantCount || 0) + (eventData.guestCount || 0)}/${eventData.max_players} participants.`;

        setMeta('name', 'description', description);
        setMeta('property', 'og:title', `${eventData.title} | Stryver`);
        setMeta('property', 'og:description', description);
        setMeta('property', 'og:type', 'website');
        setMeta('name', 'twitter:title', `${eventData.title} | Stryver`);
        setMeta('name', 'twitter:description', description);

      } catch (error) {
        console.error('Error loading event:', error);
        toast.error("Erreur lors du chargement de l'événement");
        navigate('/fives');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id, user, navigate]);

  const handleJoinEvent = async () => {
    if (!user || !event) return;

    setIsJoining(true);
    try {
      await joinFive(event.id, user.id);
      const isFull = event.isFull;

      if (isFull) {
        toast.success("Vous avez rejoint la liste d'attente en tant que remplaçant !");
      } else {
        toast.success("Vous avez rejoint l'événement !");
      }

      // Rediriger vers la page des événements
      navigate('/fives');
    } catch (error) {
      console.error('Error joining event:', error);
      toast.error("Erreur lors de la tentative de rejoindre l'événement");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
            <p className="text-text-tertiary">Chargement de l'événement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return null;
  }

  const isPast = new Date(event.date) < new Date();

  return (
    <Layout>
      <div className="mx-auto max-w-3xl pb-20">
        {/* Event Header */}
        <div className="mb-6 rounded-lg border border-border-primary bg-bg-card p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-text-primary">{event.title}</h1>
              {isPast && (
                <span className="mt-2 inline-block rounded-full bg-text-tertiary/20 px-3 py-1 text-sm text-text-tertiary">
                  Terminé
                </span>
              )}
              {event.isFull && !isPast && (
                <span className="mt-2 inline-block rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-400">
                  Complet
                </span>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-text-secondary">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-lg">{formatDate(event.date)}</span>
            </div>

            <div className="flex items-center gap-3 text-text-secondary">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-lg">{event.location}</span>
            </div>

            <div className="flex items-center gap-3 text-text-secondary">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg">{formatDuration(event.duration_minutes)}</span>
            </div>

            <div className="flex items-center gap-3 text-text-secondary">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-lg">
                {(event.participantCount || 0) + (event.guestCount || 0)} / {event.max_players} participants
              </span>
            </div>
          </div>
        </div>

        {/* Join Button */}
        {!user ? (
          <div className="rounded-lg border border-border-primary bg-bg-card p-6 text-center">
            <h3 className="mb-2 text-xl font-bold text-text-primary">Connectez-vous pour rejoindre</h3>
            <p className="mb-4 text-text-secondary">Créez un compte gratuitement pour participer à cet événement</p>
            <button
              onClick={() => navigate(`/sign-in?redirect=/evenement/${event.id}`)}
              className="rounded-lg bg-red-500 px-6 py-3 text-white hover:bg-red-600 transition-colors"
            >
              Se connecter
            </button>
          </div>
        ) : event.isUserParticipant ? (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-6 text-center">
            <svg className="mx-auto mb-3 h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="mb-2 text-xl font-bold text-text-primary">
              {event.isUserSubstitute ? "Vous êtes sur la liste d'attente" : "Vous participez à cet événement"}
            </h3>
            <button
              onClick={() => navigate('/fives')}
              className="mt-4 rounded-lg border border-border-primary bg-bg-secondary px-6 py-3 text-text-primary hover:bg-bg-hover transition-colors"
            >
              Voir tous mes événements
            </button>
          </div>
        ) : isPast ? (
          <div className="rounded-lg border border-border-primary bg-bg-card p-6 text-center">
            <p className="text-text-tertiary">Cet événement est terminé</p>
          </div>
        ) : (
          <button
            onClick={handleJoinEvent}
            disabled={isJoining}
            className={`w-full rounded-lg px-6 py-4 text-lg font-medium text-white transition-colors ${
              event.isFull
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-red-500 hover:bg-red-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isJoining
              ? 'Rejoindre...'
              : event.isFull
              ? "Rejoindre comme remplaçant"
              : "Rejoindre l'événement"}
          </button>
        )}

        {/* Info */}
        {event.isFull && !isPast && !user?.id && (
          <p className="mt-4 text-center text-sm text-text-tertiary">
            L'événement est complet, vous rejoindrez la liste d'attente.
          </p>
        )}
      </div>
    </Layout>
  );
}
