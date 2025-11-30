export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateForInput(dateString: string) {
  const date = new Date(dateString);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function convertLocalDateTimeToUTC(localDateTime: string) {
  // localDateTime is in format "YYYY-MM-DDTHH:mm" (from HTML date/time inputs)
  // We interpret it as local time and convert to UTC ISO string
  const date = new Date(localDateTime);
  return date.toISOString();
}

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return 'Durée non définie';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} h`;
  return `${hrs} h ${mins} min`;
}

export function buildShareLink(shareCode: string, origin?: string) {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/fives?shareCode=${shareCode}`;
}

export function formatUserName(firstName: string | null, lastName: string | null) {
  if (!firstName && !lastName) return 'Utilisateur';
  if (!firstName) return lastName || 'Utilisateur';
  if (!lastName) return firstName;

  // Format as "FirstName L."
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}
