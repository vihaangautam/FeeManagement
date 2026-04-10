import { useState, useRef, useEffect } from 'react';
import { searchImages } from '../../api/lessonApi';

/**
 * ImageSwapper — A mini modal to search and replace diagram images.
 */
export default function ImageSwapper({ slide, onSelect, onClose }) {
  const [query, setQuery] = useState(slide?.imageQuery || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Auto-search with original query
    if (slide?.imageQuery) {
      doSearch(slide.imageQuery);
    }
  }, []);

  const doSearch = async (q) => {
    if (!q || q.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchImages(q.trim(), 12);
      setResults(data.results || []);
    } catch (err) {
      console.error('Image search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch(query);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-bg-secondary rounded-2xl border border-border shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">Swap Image</h3>
          <button onClick={onClose} className="btn-icon">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-border">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search educational diagrams..."
              className="form-input flex-1"
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? '...' : 'Search'}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1.5">
            Source: Wikimedia Commons (free educational images)
          </p>
        </form>

        {/* Results Grid */}
        <div className="p-4 max-h-80 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {results.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onSelect(img.fullUrl, img.thumbnail);
                    onClose();
                  }}
                  className="group rounded-xl border border-border hover:border-accent overflow-hidden bg-bg-tertiary transition-all duration-200 hover:shadow-lg"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={img.thumbnail}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                  <p className="p-2 text-xs text-text-muted truncate">{img.title}</p>
                </button>
              ))}
            </div>
          ) : searched ? (
            <div className="text-center py-8 text-text-muted text-sm">
              No images found. Try a different search term.
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted text-sm">
              Search for an educational diagram to replace the current image.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
