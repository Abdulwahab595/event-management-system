import { useEffect, useState } from 'react';

function EventImage({ src, name }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return src && !failed ? (
    <img className="event-image" src={src} alt={name} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <div className="image-placeholder">Image unavailable</div>
  );
}

export default EventImage;
