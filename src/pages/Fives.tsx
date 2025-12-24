import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useFiveStore } from "../stores/useFiveStore";
import { useUserStore } from "../stores/useUserStore";
import { Layout } from "../components/Layout";
import { FiveChat } from "../components/FiveChat";
import {
  buildShareLink,
  convertLocalDateTimeToUTC,
  formatDate,
  formatDateForInput,
  formatDuration,
  formatUserName,
} from "../utils/format";

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
    fetchGuestParticipants,
    guestParticipants,
    addGuestParticipant,
    removeGuestParticipant,
    moveParticipantToSubstitute,
    moveSubstituteToParticipant,
    moveGuestToSubstitute,
    moveGuestSubstituteToParticipant,
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
  const [showRemoveParticipantModal, setShowRemoveParticipantModal] =
    useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showRemoveGuestModal, setShowRemoveGuestModal] = useState(false);
  const [fiveToLeave, setFiveToLeave] = useState<(typeof fives)[0] | null>(
    null
  );
  const [fiveToDelete, setFiveToDelete] = useState<(typeof fives)[0] | null>(
    null
  );
  const [fiveToShare, setFiveToShare] = useState<(typeof fives)[0] | null>(
    null
  );
  const [fiveToEdit, setFiveToEdit] = useState<(typeof fives)[0] | null>(null);
  const [participantToRemove, setParticipantToRemove] = useState<
    (typeof participants)[0] | null
  >(null);
  const [guestToRemove, setGuestToRemove] = useState<
    (typeof guestParticipants)[0] | null
  >(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingParticipant, setIsRemovingParticipant] = useState(false);
  const [isRemovingGuest, setIsRemovingGuest] = useState(false);
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFive, setSelectedFive] = useState<(typeof fives)[0] | null>(
    null
  );
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [createDuration, setCreateDuration] = useState(60);
  const [editDuration, setEditDuration] = useState(60);
  const [formMaxPlayers, setFormMaxPlayers] = useState(10);
  const [filter, setFilter] = useState<"active" | "past">("active");
  const [showLocationPopover, setShowLocationPopover] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"participants" | "chat">(
    "participants"
  );
  const [openParticipantMenu, setOpenParticipantMenu] = useState<string | null>(
    null
  );
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

  // Close location popover when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showLocationPopover) {
        setShowLocationPopover(null);
      }
    };

    if (showLocationPopover) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showLocationPopover]);

  // Close participant menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openParticipantMenu) {
        setOpenParticipantMenu(null);
      }
    };

    if (openParticipantMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openParticipantMenu]);

  const handleCreateFive = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || isCreating) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const location = formData.get("location") as string;
    const datePart = formData.get("date") as string;
    const timePart = formData.get("time") as string;
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
      toast.success("Événement créé avec succès !");
      setShowCreateModal(false);
      setCreateDuration(60);
      // Show share code
      setFiveToShare({
        ...result.five,
        share_code: result.shareCode,
        participantCount: 1,
        substituteCount: 0,
        guestCount: 0,
        guestSubstituteCount: 0,
        isUserParticipant: true,
        isUserSubstitute: false,
        isFull: false,
        isCreator: true,
      });
      setShowShareModal(true);
    } else {
      toast.error("Erreur lors de la création de l'événement");
    }
    setIsCreating(false);
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim() || isJoining) return;

    setIsJoining(true);
    try {
      const status = await joinFiveByShareCode(
        joinCode.trim().toUpperCase(),
        user.id
      );
      if (status === "joined") {
        toast.success("Vous avez rejoint l'événement !");
        setShowJoinModal(false);
        setJoinCode("");
      } else if (status === "joinedAsSub") {
        toast.success(
          "Vous avez rejoint la liste d'attente en tant que remplaçant !"
        );
        setShowJoinModal(false);
        setJoinCode("");
      } else if (status === "already") {
        toast.info("Vous êtes déjà inscrit à cet événement");
        setShowJoinModal(false);
        setJoinCode("");
      } else if (status === "notFound") {
        toast.error("Code invalide");
      } else {
        toast.error("Erreur lors de la tentative de rejoindre l'événement");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinFive = async (fiveId: string) => {
    if (!user) return;
    const five = fives.find((f) => f.id === fiveId);
    const isFull = five?.isFull || false;
    const success = await joinFive(fiveId, user.id);
    if (success) {
      if (isFull) {
        toast.success(
          "Vous avez rejoint la liste d'attente en tant que remplaçant !"
        );
      } else {
        toast.success("Vous avez rejoint l'événement !");
      }
    } else {
      toast.error("Erreur lors de la tentative de rejoindre l'événement");
    }
  };

  const handleLeaveFive = async () => {
    if (!user || !fiveToLeave || isLeaving) return;

    setIsLeaving(true);
    try {
      const success = await leaveFive(fiveToLeave.id, user.id);
      if (success) {
        toast.info("Vous avez quitté l'événement");
        setShowLeaveModal(false);
        setFiveToLeave(null);
        if (showDetailsModal) {
          setShowDetailsModal(false);
        }
      } else {
        toast.error("Erreur lors de la tentative de quitter l'événement");
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
        toast.success("Événement supprimé");
        setShowDeleteModal(false);
        setFiveToDelete(null);
        if (showDetailsModal) {
          setShowDetailsModal(false);
        }
      } else {
        toast.error("Erreur lors de la suppression de l'événement");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveParticipant = async () => {
    if (!user || !participantToRemove || !selectedFive || isRemovingParticipant)
      return;

    setIsRemovingParticipant(true);
    try {
      const success = await removeParticipant(
        selectedFive.id,
        participantToRemove.user_id,
        user.id
      );
      if (success) {
        toast.success("Participant retiré de l'événement");
        setShowRemoveParticipantModal(false);
        setParticipantToRemove(null);
      } else {
        toast.error("Erreur lors du retrait du participant");
      }
    } finally {
      setIsRemovingParticipant(false);
    }
  };

  const handleAddGuest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !selectedFive || isAddingGuest) return;

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = (formData.get("lastName") as string) || null;

    if (!firstName.trim()) {
      toast.error("Veuillez entrer un prénom");
      return;
    }

    setIsAddingGuest(true);
    try {
      const success = await addGuestParticipant(
        selectedFive.id,
        firstName.trim(),
        lastName ? lastName.trim() : null,
        user.id
      );
      if (success) {
        toast.success("Participant invité ajouté avec succès");
        setShowAddGuestModal(false);
        await fetchGuestParticipants(selectedFive.id);
        // Reset form
        e.currentTarget.reset();
      } else {
        toast.error("Erreur lors de l'ajout du participant invité");
      }
    } finally {
      setIsAddingGuest(false);
    }
  };

  const handleRemoveGuest = async () => {
    if (!user || !guestToRemove || isRemovingGuest) return;

    setIsRemovingGuest(true);
    try {
      const success = await removeGuestParticipant(guestToRemove.id, user.id);
      if (success) {
        toast.success("Participant invité retiré de l'événement");
        setShowRemoveGuestModal(false);
        setGuestToRemove(null);
        if (selectedFive) {
          await fetchGuestParticipants(selectedFive.id);
        }
      } else {
        toast.error("Erreur lors du retrait du participant invité");
      }
    } finally {
      setIsRemovingGuest(false);
    }
  };

  const handleShowDetails = async (five: (typeof fives)[0]) => {
    setSelectedFive(five);
    setShowDetailsModal(true);
    await fetchFiveParticipants(five.id);
    await fetchGuestParticipants(five.id);
  };

  const handleCopyShareCode = (shareCode: string) => {
    navigator.clipboard.writeText(shareCode);
    toast.success("Code copié !");
  };

  const handleCopyShareLink = (shareCode: string) => {
    navigator.clipboard.writeText(buildShareLink(shareCode));
    toast.success("Lien copié !");
  };

  const handleEditFive = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !fiveToEdit || isUpdating) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const location = formData.get("location") as string;
    const datePart = formData.get("date") as string;
    const timePart = formData.get("time") as string;
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
        toast.success("Événement mis à jour");
        setShowEditModal(false);
        setFiveToEdit(null);
        setSelectedFive((prev) =>
          prev && prev.id === updated.id ? { ...prev, ...updated } : prev
        );
      } else {
        toast.error("Erreur lors de la mise à jour de l'événement");
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

  // Check if user is admin
  const isAdmin = user?.email === "ethtaylan@gmail.com";

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
    return filter === "past" ? past : !past;
  });

  const isDetailView = showDetailsModal && selectedFive;

  // Auto-join when arriving with a share link (?shareCode=XXXXXX)
  useEffect(() => {
    const shareCodeParam = searchParams.get("shareCode");

    // If user is not logged in but there's a shareCode, save it for after login
    if (!user && shareCodeParam) {
      localStorage.setItem("pendingShareCode", shareCodeParam.toUpperCase());
      return;
    }

    if (!user) return;

    // Check for pending shareCode from before login
    const pendingCode = localStorage.getItem("pendingShareCode");
    if (pendingCode) {
      localStorage.removeItem("pendingShareCode");
      // Set the shareCode in URL params to trigger the join flow
      const params = new URLSearchParams(searchParams);
      params.set("shareCode", pendingCode);
      setSearchParams(params, { replace: true });
      return;
    }

    if (!shareCodeParam) return;

    const normalizedCode = shareCodeParam.toUpperCase();
    if (lastAutoJoinCode.current === normalizedCode) return;
    lastAutoJoinCode.current = normalizedCode;

    const attemptJoin = async () => {
      const status = await joinFiveByShareCode(normalizedCode, user.id);
      if (status === "joined") {
        toast.success("Vous avez rejoint l'événement via le lien !");
        const params = new URLSearchParams(searchParams);
        params.delete("shareCode");
        setSearchParams(params, { replace: true });
      } else if (status === "joinedAsSub") {
        toast.success(
          "Vous avez rejoint la liste d'attente en tant que remplaçant via le lien !"
        );
        const params = new URLSearchParams(searchParams);
        params.delete("shareCode");
        setSearchParams(params, { replace: true });
      } else if (status === "already") {
        toast.info("Vous participez déjà à cet événement");
        const params = new URLSearchParams(searchParams);
        params.delete("shareCode");
        setSearchParams(params, { replace: true });
      } else {
        toast.error("Lien invalide ou erreur de connexion à l'événement");
      }
    };

    attemptJoin();
  }, [joinFiveByShareCode, searchParams, setSearchParams, user]);

  return (
    <Layout>
      <div className="pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Mes Événements</h1>
          <p className="text-sm text-text-tertiary">
            Créez et gérez vos événements sportifs
          </p>
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
              <svg
                className="h-5 w-5"
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
              Créer un événement
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center justify-center gap-2 rounded-lg border border-border-primary bg-bg-card px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              Code
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setFilter("active");
                setSelectedFive(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filter === "active"
                  ? "bg-red-500/10 text-red-500 border border-red-500/30"
                  : "border border-border-primary bg-bg-card text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
            >
              À venir
            </button>
            <button
              onClick={() => {
                setFilter("past");
                setSelectedFive(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filter === "past"
                  ? "bg-red-500/10 text-red-500 border border-red-500/30"
                  : "border border-border-primary bg-bg-card text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
            >
              Passés
            </button>
          </div>
        </div>

        {/* Fives List */}
        {!isDetailView && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-primary border-t-red-500"></div>
              </div>
            ) : filteredFives.length === 0 ? (
              <div className="rounded-lg border border-border-primary bg-bg-card p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                  <svg
                    className="h-8 w-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="mb-2 font-semibold text-text-primary">
                  Aucun événement
                </p>
                <p className="text-sm text-text-tertiary">
                  Créez votre premier événement ou rejoignez-en un avec un code
                </p>
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
                          ? "border-border-primary bg-bg-card opacity-60"
                          : "border-border-primary bg-bg-card hover:border-red-500/50 hover:bg-bg-hover hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-stretch justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-text-primary">
                              {five.title}
                            </h3>
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
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span>{formatDate(five.date)}</span>
                            </div>
                            {five.location && (
                              <div className="flex items-center gap-2">
                                <svg
                                  className="h-4 w-4 flex-shrink-0 text-text-tertiary"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
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
                                <span className="text-sm">
                                  Adresse disponible
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
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
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                {formatDuration(five.duration_minutes)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
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
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              <span
                                className={five.isFull ? "text-red-400" : ""}
                              >
                                {(five.participantCount || 0) +
                                  (five.guestCount || 0)}
                                /{five.max_players} joueurs
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-stretch justify-end gap-2 self-end min-w-[120px]">
                          {/* Actions removed on card for a cleaner list; manage from details modal */}
                          {five.location && !isPast && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowLocationPopover(
                                    showLocationPopover === five.id
                                      ? null
                                      : five.id
                                  );
                                }}
                                className="group w-full flex items-center justify-center gap-1.5 rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 hover:border-red-500/50 hover:bg-red-500/10 transition-all"
                              >
                                <svg
                                  className="h-4 w-4 text-text-tertiary group-hover:text-red-400 transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
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
                                <span className="text-sm font-medium text-text-primary group-hover:text-red-400 transition-colors whitespace-nowrap">
                                  Adresse
                                </span>
                              </button>

                              {showLocationPopover === five.id && (
                                <div
                                  className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg border border-border-primary bg-bg-modal p-3 shadow-2xl"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="mb-2 flex items-start justify-between gap-2">
                                    <p className="flex-1 text-sm text-text-primary break-words">
                                      {five.location}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowLocationPopover(null);
                                      }}
                                      className="flex-shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
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
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(five.location || "")}`;
                                      window.open(mapsUrl, "_blank");
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
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
                                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                      />
                                    </svg>
                                    Ouvrir dans Maps
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {isPast ? (
                            <button
                              disabled
                              className="w-full rounded-lg bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-tertiary cursor-not-allowed"
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
                              className="w-full rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
                            >
                              Se retirer
                            </button>
                          ) : five.isFull ? (
                            <button
                              disabled
                              className="w-full rounded-lg bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-tertiary cursor-not-allowed"
                            >
                              Complet
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinFive(five.id);
                              }}
                              className="w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
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
          </>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-border-primary bg-bg-modal p-6 shadow-2xl">
              <h2 className="mb-4 text-xl font-bold text-text-primary">
                Créer un événement
              </h2>
              <form onSubmit={handleCreateFive} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">
                    Titre
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    maxLength={60}
                    className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-text-primary focus:border-red-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">
                    Lieu
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    maxLength={80}
                    className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-text-primary focus:border-red-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">
                    Date et heure
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                      <svg
                        className="h-4 w-4 text-text-tertiary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <input
                        type="date"
                        name="date"
                        required
                        className="flex-1 rounded-lg border border-border-primary/50 bg-transparent px-2 py-1 text-text-primary focus:border-red-500 focus:outline-none [appearance:textfield]"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                      <svg
                        className="h-4 w-4 text-text-tertiary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
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
                    <span className="text-text-primary font-medium">
                      {createDuration} min
                    </span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={120}
                    step={30}
                    value={createDuration}
                    onChange={(e) =>
                      setCreateDuration(parseInt(e.target.value))
                    }
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
                  <label className="mb-1 block text-sm text-text-tertiary">
                    Nombre de joueurs max
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormMaxPlayers((prev) => Math.max(2, prev - 1))
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-primary bg-bg-tertiary text-text-primary hover:border-red-500 transition-colors"
                      aria-label="Diminuer"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 12h14"
                        />
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
                      onClick={() =>
                        setFormMaxPlayers((prev) => Math.min(20, prev + 1))
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-primary bg-bg-tertiary text-text-primary hover:border-red-500 transition-colors"
                      aria-label="Augmenter"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v14m-7-7h14"
                        />
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
                    {isCreating ? "Création..." : "Créer"}
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
              <h2 className="mb-4 text-xl font-bold text-text-primary">
                Rejoindre un événement
              </h2>
              <form onSubmit={handleJoinByCode} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">
                    Code de l'événement
                  </label>
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
                    Demandez le code au créateur de l'événement
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinModal(false);
                      setJoinCode("");
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
                    {isJoining ? "Rejoindre..." : "Rejoindre"}
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
              <h2 className="mb-4 text-xl font-bold text-text-primary">
                Modifier l'événement
              </h2>
              <form onSubmit={handleEditFive} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">
                    Titre
                  </label>
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
                  <label className="mb-1 block text-sm text-text-tertiary">
                    Lieu
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    maxLength={80}
                    defaultValue={fiveToEdit.location || ""}
                    className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-tertiary">
                    Date et heure
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                      <svg
                        className="h-4 w-4 text-text-tertiary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <input
                        type="date"
                        name="date"
                        required
                        defaultValue={formatDateForInput(fiveToEdit.date).slice(
                          0,
                          10
                        )}
                        className="flex-1 rounded-lg border border-white/5 bg-transparent px-2 py-1 text-white focus:border-red-500 focus:outline-none [appearance:textfield]"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                      <svg
                        className="h-4 w-4 text-text-tertiary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <input
                        type="time"
                        name="time"
                        required
                        defaultValue={formatDateForInput(fiveToEdit.date).slice(
                          11,
                          16
                        )}
                        className="flex-1 rounded-lg border border-white/5 bg-transparent px-2 py-1 text-white focus:border-red-500 focus:outline-none [appearance:textfield]"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm text-text-tertiary">
                    <label>Durée (minutes)</label>
                    <span className="text-text-primary">
                      {editDuration} min
                    </span>
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
                  <label className="mb-1 block text-sm text-text-tertiary">
                    Nombre de joueurs max
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormMaxPlayers((prev) => Math.max(2, prev - 1))
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-primary bg-bg-tertiary text-white hover:border-red-500"
                      aria-label="Diminuer"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 12h14"
                        />
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
                      onClick={() =>
                        setFormMaxPlayers((prev) => Math.min(20, prev + 1))
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-primary bg-bg-tertiary text-white hover:border-red-500"
                      aria-label="Augmenter"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v14m-7-7h14"
                        />
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
                    {isUpdating ? "Enregistrement..." : "Enregistrer"}
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
                <h2 className="mb-2 text-xl font-bold text-text-primary">
                  Événement créé !
                </h2>
                <p className="text-sm text-text-tertiary">
                  Partagez ce lien avec vos amis
                </p>
              </div>

              <div className="mb-6 rounded-lg border-2 border-red-500/50 bg-red-500/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-primary">
                    Lien de partage
                  </p>
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <div className="mb-3 overflow-hidden rounded-lg border border-red-500/30 bg-bg-modal/50 px-3 py-3">
                  <span className="block break-all text-sm text-text-primary">
                    {buildShareLink(fiveToShare.share_code)}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyShareLink(fiveToShare.share_code)}
                  className="w-full rounded-lg bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-600"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5"
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
                    Copier le lien
                  </div>
                </button>
                <p className="mt-3 text-xs text-text-tertiary">
                  Toute personne connectée avec ce lien rejoindra
                  automatiquement l'événement.
                </p>
              </div>

              <div className="mb-6">
                <details className="group">
                  <summary className="cursor-pointer list-none text-center text-xs text-text-tertiary hover:text-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      Ou partager par code
                      <svg
                        className="h-3 w-3 transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
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
                      onClick={() =>
                        handleCopyShareCode(fiveToShare.share_code)
                      }
                      className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover"
                    >
                      Copier le code
                    </button>
                  </div>
                </details>
              </div>

              <div className="space-y-2 rounded-lg border border-border-primary bg-bg-secondary/50 p-4">
                <p className="text-sm font-semibold text-text-primary">
                  {fiveToShare.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{formatDate(fiveToShare.date)}</span>
                </div>
                {fiveToShare.location && (
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <svg
                      className="h-4 w-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
                    <span className="flex-1">{fiveToShare.location}</span>
                    <button
                      onClick={() => {
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fiveToShare.location || "")}`;
                        window.open(mapsUrl, "_blank");
                      }}
                      className="flex-shrink-0 rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Ouvrir dans Google Maps"
                    >
                      Maps
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
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

        {/* Details Page */}
        {isDetailView && selectedFive && (
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedFive(null);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Retour
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-border-primary bg-bg-card shadow-lg relative">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedFive(null);
                }}
                className="absolute right-4 top-4 z-10 inline-flex items-center justify-center rounded-lg border border-border-primary bg-bg-secondary p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
                aria-label="Fermer"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              {/* Header */}
              <div className="border-b border-border-primary bg-bg-card px-6 py-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-lg font-semibold text-text-primary">
                        {selectedFive.title}
                      </h2>
                      {selectedFive.isCreator && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                          Créateur
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-text-tertiary mt-1">
                      <div className="flex items-center gap-2">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatDate(selectedFive.date)}</span>
                      </div>
                      {selectedFive.location &&
                        !isFivePast(selectedFive.date) && (
                          <button
                            onClick={() => {
                              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedFive.location || "")}`;
                              window.open(mapsUrl, "_blank");
                            }}
                            className="flex items-center gap-2 text-sm text-text-tertiary hover:text-red-400 transition-colors"
                            title="Ouvrir dans Google Maps"
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
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span className="truncate">Adresse disponible</span>
                          </button>
                        )}
                      <div className="flex items-center gap-2">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          {formatDuration(selectedFive.duration_minutes)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span
                          className={selectedFive.isFull ? "text-red-400" : ""}
                        >
                          {(selectedFive.participantCount || 0) +
                            (selectedFive.guestCount || 0)}
                          /{selectedFive.max_players} joueurs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 space-y-4 px-6 py-5">
                {/* Share card */}
                <div className="rounded-lg border border-border-primary bg-bg-card p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary mb-1">
                        Partager l'événement
                      </p>
                      <p className="text-xs text-text-tertiary">
                        Lien direct ou code unique, prêt à copier.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                        <div className="flex-1 overflow-hidden text-xs text-text-secondary">
                          <span className="block truncate">
                            {buildShareLink(selectedFive.share_code)}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleCopyShareLink(selectedFive.share_code)
                          }
                          className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                        >
                          Copier lien
                        </button>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2">
                        <div className="flex-1 overflow-hidden text-xs text-text-secondary">
                          <span className="block truncate font-mono font-semibold text-text-primary">
                            {selectedFive.share_code}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleCopyShareCode(selectedFive.share_code)
                          }
                          className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                        >
                          Copier le code
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="rounded-lg bg-bg-secondary p-1 text-sm font-medium">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setActiveTab("participants")}
                      className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 transition-colors ${
                        activeTab === "participants"
                          ? "bg-red-500 text-white"
                          : "text-text-tertiary hover:text-text-primary"
                      }`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span>Participants</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${activeTab === "participants" ? "bg-white/20" : "bg-bg-tertiary"}`}
                      >
                        {(selectedFive.participantCount || 0) +
                          (selectedFive.guestCount || 0)}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 transition-colors ${
                        activeTab === "chat"
                          ? "bg-red-500 text-white"
                          : "text-text-tertiary hover:text-text-primary"
                      }`}
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
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span>Discussion</span>
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === "participants" ? (
                  <div className="space-y-3 rounded-lg border border-border-primary bg-bg-card p-4">
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-border-primary">
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span className="text-sm font-semibold text-text-primary">
                          Participants (
                          {(selectedFive.participantCount || 0) +
                            (selectedFive.guestCount || 0)}
                          /{selectedFive.max_players})
                        </span>
                        {selectedFive.isFull && (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                            Complet
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedFive.isCreator && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowAddGuestModal(true)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/25 transition-colors"
                          title="Ajouter un participant invité"
                        >
                          <span className="text-base leading-none">+</span>{" "}
                          Invité
                        </button>
                      </div>
                    )}

                    {participants.filter((p) => !p.is_substitute).length ===
                      0 &&
                    guestParticipants.filter((g) => !g.is_substitute).length ===
                      0 ? (
                      <p className="py-3 text-center text-xs text-text-tertiary">
                        Aucun participant
                      </p>
                    ) : (
                      <div className="grid gap-2 md:grid-cols-2">
                        {participants
                          .filter((p) => !p.is_substitute)
                          .map((participant) => (
                            <div
                              key={participant.id}
                              className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary p-2.5"
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                                <svg
                                  className="h-4 w-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="truncate text-sm font-semibold text-text-primary">
                                    {participant.user.first_name ||
                                      "Utilisateur"}
                                  </p>
                                  {participant.user_id ===
                                    selectedFive.created_by && (
                                    <span className="flex-shrink-0 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-300">
                                      Organisateur
                                    </span>
                                  )}
                                </div>
                              </div>
                              {selectedFive.isCreator &&
                                participant.user_id !==
                                  selectedFive.created_by && (
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenParticipantMenu(
                                          openParticipantMenu ===
                                            `user-${participant.id}`
                                            ? null
                                            : `user-${participant.id}`
                                        );
                                      }}
                                      className="flex-shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
                                      title="Gérer le participant"
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
                                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                        />
                                      </svg>
                                    </button>
                                    {openParticipantMenu ===
                                      `user-${participant.id}` && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border-primary bg-bg-modal shadow-xl"
                                      >
                                        <button
                                          onClick={async () => {
                                            setOpenParticipantMenu(null);
                                            if (user && selectedFive) {
                                              const success =
                                                await moveParticipantToSubstitute(
                                                  selectedFive.id,
                                                  participant.user_id,
                                                  user.id
                                                );
                                              if (success) {
                                                toast.success(
                                                  "Participant déplacé en remplaçant"
                                                );
                                                await fetchFiveParticipants(
                                                  selectedFive.id
                                                );
                                                await fetchGuestParticipants(
                                                  selectedFive.id
                                                );
                                                // Mettre à jour selectedFive avec les nouvelles données
                                                const updatedFive = fives.find(
                                                  (f) =>
                                                    f.id === selectedFive.id
                                                );
                                                if (updatedFive)
                                                  setSelectedFive(updatedFive);
                                              } else {
                                                toast.error(
                                                  "Erreur lors du déplacement"
                                                );
                                              }
                                            }
                                          }}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors rounded-t-lg"
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
                                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                            />
                                          </svg>
                                          Mettre en remplaçant
                                        </button>
                                        <button
                                          onClick={() => {
                                            setOpenParticipantMenu(null);
                                            setParticipantToRemove(participant);
                                            setShowRemoveParticipantModal(true);
                                          }}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-b-lg"
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
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                          Retirer de l'événement
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                          ))}
                        {guestParticipants
                          .filter((g) => !g.is_substitute)
                          .map((guest) => (
                            <div
                              key={guest.id}
                              className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary p-2.5"
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                <svg
                                  className="h-4 w-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="truncate text-sm font-semibold text-text-primary">
                                    {guest.first_name}
                                    {guest.last_name
                                      ? ` ${guest.last_name}`
                                      : ""}
                                  </p>
                                  <span className="flex-shrink-0 rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] text-blue-300">
                                    Invité
                                  </span>
                                </div>
                              </div>
                              {selectedFive.isCreator && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenParticipantMenu(
                                        openParticipantMenu ===
                                          `guest-${guest.id}`
                                          ? null
                                          : `guest-${guest.id}`
                                      );
                                    }}
                                    className="flex-shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
                                    title="Gérer le participant"
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
                                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                      />
                                    </svg>
                                  </button>
                                  {openParticipantMenu ===
                                    `guest-${guest.id}` && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border-primary bg-bg-modal shadow-xl"
                                    >
                                      <button
                                        onClick={async () => {
                                          setOpenParticipantMenu(null);
                                          if (user && selectedFive) {
                                            const success =
                                              await moveGuestToSubstitute(
                                                selectedFive.id,
                                                guest.id,
                                                user.id
                                              );
                                            if (success) {
                                              toast.success(
                                                "Invité déplacé en remplaçant"
                                              );
                                              await fetchFiveParticipants(
                                                selectedFive.id
                                              );
                                              await fetchGuestParticipants(
                                                selectedFive.id
                                              );
                                              // Mettre à jour selectedFive avec les nouvelles données
                                              const updatedFive = fives.find(
                                                (f) => f.id === selectedFive.id
                                              );
                                              if (updatedFive)
                                                setSelectedFive(updatedFive);
                                            } else {
                                              toast.error(
                                                "Erreur lors du déplacement"
                                              );
                                            }
                                          }
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors rounded-t-lg"
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
                                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                          />
                                        </svg>
                                        Mettre en remplaçant
                                      </button>
                                      <button
                                        onClick={() => {
                                          setOpenParticipantMenu(null);
                                          setGuestToRemove(guest);
                                          setShowRemoveGuestModal(true);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-b-lg"
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
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                        Retirer de l'événement
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {(participants.filter((p) => p.is_substitute).length > 0 ||
                      guestParticipants.filter((g) => g.is_substitute).length >
                        0) && (
                      <div className="rounded-lg border border-border-primary bg-bg-secondary/50 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-text-primary">
                            Remplaçants (
                            {(selectedFive.substituteCount || 0) +
                              (selectedFive.guestSubstituteCount || 0)}
                            )
                          </h3>
                          <span className="rounded-full bg-yellow-500/25 px-2 py-0.5 text-xs text-yellow-300">
                            Liste d'attente
                          </span>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          {participants
                            .filter((p) => p.is_substitute)
                            .map((participant) => (
                              <div
                                key={participant.id}
                                className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary p-2.5"
                              >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400">
                                  <svg
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-text-primary">
                                    {participant.user.first_name ||
                                      "Utilisateur"}
                                  </p>
                                </div>
                                {selectedFive.isCreator && (
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenParticipantMenu(
                                          openParticipantMenu ===
                                            `sub-user-${participant.id}`
                                            ? null
                                            : `sub-user-${participant.id}`
                                        );
                                      }}
                                      className="flex-shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
                                      title="Gérer le remplaçant"
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
                                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                        />
                                      </svg>
                                    </button>
                                    {openParticipantMenu ===
                                      `sub-user-${participant.id}` && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border-primary bg-bg-modal shadow-xl"
                                      >
                                        <button
                                          onClick={async () => {
                                            setOpenParticipantMenu(null);
                                            if (user && selectedFive) {
                                              try {
                                                const success =
                                                  await moveSubstituteToParticipant(
                                                    selectedFive.id,
                                                    participant.user_id,
                                                    user.id
                                                  );
                                                if (success) {
                                                  toast.success(
                                                    "Remplaçant promu en participant"
                                                  );
                                                  await fetchFiveParticipants(
                                                    selectedFive.id
                                                  );
                                                  await fetchGuestParticipants(
                                                    selectedFive.id
                                                  );
                                                  // Mettre à jour selectedFive avec les nouvelles données
                                                  const updatedFive =
                                                    fives.find(
                                                      (f) =>
                                                        f.id === selectedFive.id
                                                    );
                                                  if (updatedFive)
                                                    setSelectedFive(
                                                      updatedFive
                                                    );
                                                } else {
                                                  toast.error(
                                                    "Erreur lors de la promotion"
                                                  );
                                                }
                                              } catch (error) {
                                                const message =
                                                  error instanceof Error
                                                    ? error.message
                                                    : "Erreur lors de la promotion";
                                                toast.error(message);
                                              }
                                            }
                                          }}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors rounded-t-lg"
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
                                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                                            />
                                          </svg>
                                          Promouvoir en participant
                                        </button>
                                        <button
                                          onClick={() => {
                                            setOpenParticipantMenu(null);
                                            setParticipantToRemove(participant);
                                            setShowRemoveParticipantModal(true);
                                          }}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-b-lg"
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
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                          Retirer de la liste
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          {guestParticipants
                            .filter((g) => g.is_substitute)
                            .map((guest) => (
                              <div
                                key={guest.id}
                                className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary p-2.5"
                              >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400">
                                  <svg
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className="truncate text-sm font-semibold text-text-primary">
                                      {guest.first_name}
                                      {guest.last_name
                                        ? ` ${guest.last_name}`
                                        : ""}
                                    </p>
                                    <span className="flex-shrink-0 rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] text-blue-300">
                                      Invité
                                    </span>
                                  </div>
                                </div>
                                {selectedFive.isCreator && (
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenParticipantMenu(
                                          openParticipantMenu ===
                                            `sub-guest-${guest.id}`
                                            ? null
                                            : `sub-guest-${guest.id}`
                                        );
                                      }}
                                      className="flex-shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
                                      title="Gérer le remplaçant"
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
                                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                        />
                                      </svg>
                                    </button>
                                    {openParticipantMenu ===
                                      `sub-guest-${guest.id}` && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border-primary bg-bg-modal shadow-xl"
                                      >
                                        <button
                                          onClick={async () => {
                                            setOpenParticipantMenu(null);
                                            if (user && selectedFive) {
                                              try {
                                                const success =
                                                  await moveGuestSubstituteToParticipant(
                                                    selectedFive.id,
                                                    guest.id,
                                                    user.id
                                                  );
                                                if (success) {
                                                  toast.success(
                                                    "Invité promu en participant"
                                                  );
                                                  await fetchFiveParticipants(
                                                    selectedFive.id
                                                  );
                                                  await fetchGuestParticipants(
                                                    selectedFive.id
                                                  );
                                                  // Mettre à jour selectedFive avec les nouvelles données
                                                  const updatedFive =
                                                    fives.find(
                                                      (f) =>
                                                        f.id === selectedFive.id
                                                    );
                                                  if (updatedFive)
                                                    setSelectedFive(
                                                      updatedFive
                                                    );
                                                } else {
                                                  toast.error(
                                                    "Erreur lors de la promotion"
                                                  );
                                                }
                                              } catch (error) {
                                                const message =
                                                  error instanceof Error
                                                    ? error.message
                                                    : "Erreur lors de la promotion";
                                                toast.error(message);
                                              }
                                            }
                                          }}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors rounded-t-lg"
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
                                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                                            />
                                          </svg>
                                          Promouvoir en participant
                                        </button>
                                        <button
                                          onClick={() => {
                                            setOpenParticipantMenu(null);
                                            setGuestToRemove(guest);
                                            setShowRemoveGuestModal(true);
                                          }}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-b-lg"
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
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                          Retirer de la liste
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border-primary bg-bg-card p-4">
                    <div className="h-[420px] rounded-lg bg-bg-secondary p-2">
                      <FiveChat
                        fiveId={selectedFive.id}
                        isCreator={!!selectedFive.isCreator}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border-primary bg-bg-card p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-xs text-text-tertiary">
                    {selectedFive.isFull
                      ? "L'événement est complet, vous rejoindrez la liste d'attente."
                      : "Les places se remplissent vite, agissez maintenant."}
                  </div>
                  <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                    {isFivePast(selectedFive.date) && !isAdmin ? (
                      <button
                        disabled
                        className="w-full rounded-lg bg-bg-secondary px-4 py-2 text-sm font-medium text-text-tertiary cursor-not-allowed md:min-w-[180px]"
                      >
                        Cet événement est terminé
                      </button>
                    ) : selectedFive.isCreator || isAdmin ? (
                      <>
                        {selectedFive.isCreator && (
                          <button
                            onClick={() => {
                              setFiveToEdit(selectedFive);
                              setShowDetailsModal(false);
                              setShowEditModal(true);
                            }}
                            className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors md:min-w-[160px]"
                          >
                            Modifier
                          </button>
                        )}
                        {isAdmin && !selectedFive.isCreator && (
                          <button
                            onClick={() => {
                              setFiveToEdit(selectedFive);
                              setShowDetailsModal(false);
                              setShowEditModal(true);
                            }}
                            className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors md:min-w-[200px]"
                            title="Modifier l'événement (Admin)"
                          >
                            Modifier (Admin)
                          </button>
                        )}
                        <div className="flex w-full flex-row flex-wrap gap-2 md:w-auto">
                          {selectedFive.isCreator && (
                            <button
                              onClick={() => {
                                setFiveToDelete(selectedFive);
                                setShowDeleteModal(true);
                              }}
                              className="w-full rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors md:min-w-[52px]"
                              title="Supprimer l'événement"
                            >
                              Supprimer
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setFiveToDelete(selectedFive);
                                setShowDeleteModal(true);
                              }}
                              className="w-full rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors md:min-w-[200px]"
                              title="Supprimer l'événement (Admin)"
                            >
                              Supprimer (Admin)
                            </button>
                          )}
                        </div>
                      </>
                    ) : selectedFive.isUserParticipant ? (
                      <button
                        onClick={() => {
                          setFiveToLeave(selectedFive);
                          setShowLeaveModal(true);
                        }}
                        className="w-full rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors md:min-w-[200px]"
                      >
                        {selectedFive.isUserSubstitute
                          ? "Se retirer de la liste d'attente"
                          : "Se retirer de l'événement"}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleJoinFive(selectedFive.id);
                          setShowDetailsModal(false);
                        }}
                        className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors md:min-w-[200px] ${
                          selectedFive.isFull
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        {selectedFive.isFull
                          ? "Rejoindre comme remplaçant"
                          : "Rejoindre l'événement"}
                      </button>
                    )}
                  </div>
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
                  Se retirer de l'événement ?
                </h2>
                <p className="text-sm text-text-tertiary">
                  Vous êtes sur le point de vous retirer de "{fiveToLeave.title}
                  ".
                </p>
                <p className="mt-2 text-sm text-text-tertiary">
                  Vous pourrez rejoindre à nouveau cet événement tant qu'il n'est pas
                  complet.
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
                  Supprimer l'événement ?
                </h2>
                <p className="text-sm text-text-tertiary">
                  Vous êtes sur le point de supprimer "{fiveToDelete.title}".
                </p>
                <p className="mt-2 text-sm text-red-400">
                  Cette action est irréversible. Tous les participants seront
                  retirés.
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
                  Vous êtes sur le point de retirer{" "}
                  <span className="font-medium text-text-primary">
                    {formatUserName(
                      participantToRemove.user.first_name,
                      participantToRemove.user.last_name
                    )}
                  </span>{" "}
                  de l'événement.
                </p>
                <p className="mt-2 text-sm text-text-tertiary">
                  Cette personne pourra rejoindre à nouveau l'événement si elle le
                  souhaite.
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

        {/* Add Guest Participant Modal */}
        {showAddGuestModal && selectedFive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-lg border border-border-primary bg-bg-modal p-6 shadow-2xl">
              <div className="mb-6">
                <h2 className="mb-2 text-xl font-bold text-text-primary">
                  Ajouter un participant invité
                </h2>
                <p className="text-sm text-text-tertiary">
                  Ajoutez une personne manuellement sans qu'elle ait besoin de
                  créer un compte.
                </p>
              </div>

              <form onSubmit={handleAddGuest}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-text-primary mb-1"
                    >
                      Prénom
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-text-primary focus:border-red-500 focus:outline-none"
                      placeholder="Ex: Jean"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-text-primary mb-1"
                    >
                      Nom{" "}
                      <span className="text-text-tertiary font-normal">
                        (optionnel)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 text-text-primary focus:border-red-500 focus:outline-none"
                      placeholder="Ex: Dupont"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddGuestModal(false);
                    }}
                    disabled={isAddingGuest}
                    className="flex-1 rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary hover:bg-bg-hover disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingGuest}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingGuest ? "Ajout..." : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Remove Guest Participant Modal */}
        {showRemoveGuestModal && guestToRemove && (
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
                  Retirer ce participant invité ?
                </h2>
                <p className="text-sm text-text-tertiary">
                  Vous êtes sur le point de retirer{" "}
                  <span className="font-medium text-text-primary">
                    {guestToRemove.first_name}
                    {guestToRemove.last_name
                      ? ` ${guestToRemove.last_name}`
                      : ""}
                  </span>{" "}
                  de l'événement.
                </p>
                <p className="mt-2 text-sm text-text-tertiary">
                  Cette personne devra être ajoutée à nouveau manuellement si
                  nécessaire.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRemoveGuestModal(false);
                    setGuestToRemove(null);
                  }}
                  disabled={isRemovingGuest}
                  className="flex-1 rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-white hover:bg-bg-secondary disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRemoveGuest}
                  disabled={isRemovingGuest}
                  className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRemovingGuest ? "Retrait..." : "Retirer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
