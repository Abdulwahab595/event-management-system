export const PAGE_SIZE = 20;
export const MAX_PAGES = 50;
export const emptyFilters = { keyword: '', city: '', category: '', countryCode: '' };

export function cleanFilters(filters = {}) {
  return {
    keyword: (filters.keyword || '').trim(),
    city: (filters.city || '').trim(),
    category: (filters.category || '').trim(),
    countryCode: (filters.countryCode || '').trim().toUpperCase(),
  };
}

export function buildEventQuery({ filters, page = 0, startDateTime } = {}) {
  if (!Number.isInteger(page) || page < 0 || page >= MAX_PAGES) {
    throw new Error('This results page is unavailable. Please narrow your search.');
  }

  const selected = cleanFilters(filters);
  const query = {
    size: String(PAGE_SIZE),
    page: String(page),
    sort: 'date,asc',
    startDateTime: startDateTime || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  };
  if (selected.keyword) query.keyword = selected.keyword;
  if (selected.city) query.city = selected.city;
  if (selected.category) query.segmentName = selected.category;
  if (selected.countryCode) query.countryCode = selected.countryCode;
  return query;
}
