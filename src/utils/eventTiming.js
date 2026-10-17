function timestamp(value) {
  // Only compare absolute timestamps; never guess the viewer's timezone.
  return typeof value === 'string' && /T.*(Z|[+-]\d{2}:\d{2})$/.test(value)
    ? Date.parse(value) : NaN;
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function localToday(timezone, now) {
  if (!timezone) return '';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    return ['year', 'month', 'day'].map((name) => parts.find((part) => part.type === name).value).join('-');
  } catch {
    return '';
  }
}

export function eventTiming(event, now = Date.now()) {
  if (event.status === 'canceled' || event.status === 'postponed') {
    return { group: 'unavailable', label: event.status === 'canceled' ? 'Cancelled by organiser' : 'Postponed' };
  }
  if (event.dateTBA || event.dateTBD) return { group: 'uncertain', label: 'Schedule to be confirmed' };

  const start = timestamp(event.startDateTime);
  const end = timestamp(event.endDateTime);
  if (Number.isFinite(end) && (!Number.isFinite(start) || end >= start)) {
    if (now >= end) return { group: 'completed', label: event.endApproximate ? 'Completed (estimated end time)' : 'Completed' };
    if (start <= now) return { group: 'upcoming', label: 'In progress' };
  }
  if (!event.timeTBA && start > now) return { group: 'upcoming', label: 'Upcoming' };

  const today = localToday(event.timezone, now);
  const lastDay = validDate(event.endLocalDate) && event.endLocalDate >= event.localDate
    ? event.endLocalDate : event.spanMultipleDays ? '' : event.localDate;
  if (today && validDate(lastDay) && !(end > now)) {
    if (today > lastDay) return { group: 'completed', label: 'Completed (estimated from event date)' };
    if (validDate(event.localDate) && today > event.localDate && today <= lastDay) {
      return { group: 'upcoming', label: 'Event dates in progress' };
    }
  }
  if (today && validDate(event.localDate) && today <= event.localDate) {
    return { group: 'upcoming', label: start <= now ? 'Started; end time unavailable' : 'Upcoming' };
  }
  return { group: 'uncertain', label: 'Schedule or end time unconfirmed' };
}

export function registrationProblem(event, now = Date.now()) {
  if (event.status === 'canceled' || event.status === 'postponed') return 'Registration is unavailable for cancelled or postponed events.';
  if (event.dateTBA || event.dateTBD || event.timeTBA || !Number.isFinite(timestamp(event.startDateTime))) {
    return 'Registration will be available when the start date and time are confirmed.';
  }
  if (timestamp(event.startDateTime) <= now || eventTiming(event, now).group === 'completed') {
    return 'Registration is closed because this event has already started.';
  }
  return '';
}
