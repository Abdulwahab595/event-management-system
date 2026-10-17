function webUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : '';
}

export function formatEvent(event) {
  const start = event.dates?.start || {};
  const venue = event._embedded?.venues?.[0] || {};
  const classification = event.classifications?.find((item) => item.primary) || event.classifications?.[0];
  const images = event.images || [];
  const image = images.find((item) => item.ratio === '16_9' && item.width >= 640) || images[0];
  const location = [venue.city?.name, venue.state?.name, venue.country?.name].filter(Boolean).join(', ');
  const prices = (event.priceRanges || []).filter((price) => Number.isFinite(price.min));
  const statusLabels = {
    onsale: 'On sale', offsale: 'Off sale', canceled: 'Cancelled',
    postponed: 'Postponed', rescheduled: 'Rescheduled',
  };

  return {
    id: event.id,
    name: event.name || 'Untitled event',
    image: webUrl(image?.url),
    localDate: start.localDate || '',
    localTime: start.localTime || '',
    startDateTime: start.dateTime || '',
    timezone: event.dates?.timezone || venue.timezone || '',
    dateTBA: Boolean(start.dateTBA),
    dateTBD: Boolean(start.dateTBD),
    timeTBA: Boolean(start.timeTBA || start.noSpecificTime),
    venue: venue.name || 'Venue not announced',
    address: [venue.address?.line1, venue.address?.line2].filter(Boolean).join(', '),
    location: location || 'Location not announced',
    category: classification?.segment?.name || 'Other',
    genre: classification?.genre?.name === 'Undefined' ? '' : classification?.genre?.name || '',
    status: event.dates?.status?.code || '',
    statusLabel: statusLabels[event.dates?.status?.code] || 'Status unavailable',
    description: event.info || event.description || '',
    note: event.pleaseNote || '',
    url: webUrl(event.url),
    price: prices.map((price) => {
      const amount = Number.isFinite(price.max) && price.max !== price.min
        ? `${price.min}–${price.max}` : `${price.min}`;
      return `${amount} ${price.currency || ''}`.trim();
    }).join('; ') || 'Price not listed',
  };
}

export function eventSchedule(event) {
  if (event.dateTBA) return 'Date to be announced';
  if (event.dateTBD || !event.localDate) return 'Date to be confirmed';
  const time = event.timeTBA || !event.localTime ? 'Time to be announced' : event.localTime.slice(0, 5);
  const timezone = event.timezone ? ` (${event.timezone})` : ' (local event time)';
  return `${event.localDate} · ${time}${timezone}`;
}
