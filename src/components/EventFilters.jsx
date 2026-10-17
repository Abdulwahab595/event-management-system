import { useState } from 'react';
import { emptyFilters } from '../utils/eventSearch';

const categories = ['Music', 'Sports', 'Arts & Theatre', 'Film', 'Miscellaneous'];
const countries = [
  ['AU', 'Australia'], ['CA', 'Canada'], ['FR', 'France'], ['DE', 'Germany'],
  ['IE', 'Ireland'], ['NZ', 'New Zealand'], ['GB', 'United Kingdom'], ['US', 'United States'],
];

function EventFilters({ filters, loading, onSearch }) {
  const [draft, setDraft] = useState(filters);

  function handleChange(event) {
    setDraft({ ...draft, [event.target.name]: event.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!loading) onSearch(draft);
  }

  function handleClear() {
    setDraft({ ...emptyFilters });
    onSearch(emptyFilters);
  }

  return (
    <form className="search-form" onSubmit={handleSubmit} aria-label="Find events">
      <div className="filter-fields">
        <div className="filter-field">
          <label htmlFor="event-keyword">Search events</label>
          <input id="event-keyword" name="keyword" type="search" placeholder="Event, artist or team" maxLength={100} value={draft.keyword} onChange={handleChange} />
        </div>
        <div className="filter-field">
          <label htmlFor="event-city">City</label>
          <input id="event-city" name="city" type="text" placeholder="Any city" maxLength={80} value={draft.city} onChange={handleChange} />
        </div>
        <div className="filter-field">
          <label htmlFor="event-category">Category</label>
          <select id="event-category" name="category" value={draft.category} onChange={handleChange}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="event-country">Country</label>
          <select id="event-country" name="countryCode" value={draft.countryCode} onChange={handleChange}>
            <option value="">All countries</option>
            {countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </div>
      </div>
      <div className="filter-actions">
        <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Search'}</button>
        <button className="secondary-button" type="button" onClick={handleClear}>Clear filters</button>
      </div>
    </form>
  );
}

export default EventFilters;
