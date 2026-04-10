import { useEffect, useCallback } from 'react';
import SlideRenderer from './SlideRenderer';

/**
 * PresentationMode — Full-screen slide presentation with keyboard navigation.
 */
export default function PresentationMode({ slides, currentSlide, onSlideChange, onExit }) {

  const goNext = useCallback(() => {
    onSlideChange(prev => Math.min(prev + 1, slides.length - 1));
  }, [slides.length, onSlideChange]);

  const goPrev = useCallback(() => {
    onSlideChange(prev => Math.max(prev - 1, 0));
  }, [onSlideChange]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'Escape':
          e.preventDefault();
          onExit();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onExit]);

  // Request fullscreen
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const slide = slides[currentSlide];
  if (!slide) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bg-primary flex flex-col">
      {/* Slide Area */}
      <div className="flex-1 flex items-center justify-center p-2 md:p-6">
        <div className="w-[95vw] max-w-7xl aspect-[16/9] bg-bg-secondary rounded-2xl border border-border shadow-2xl overflow-y-auto">
          <SlideRenderer slide={slide} index={currentSlide} />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between px-6 py-4 bg-bg-secondary/80 backdrop-blur border-t border-border">
        {/* Prev */}
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="btn btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>

        {/* Slide Counter + Progress */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => onSlideChange(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  i === currentSlide
                    ? 'bg-accent scale-125'
                    : i < currentSlide
                    ? 'bg-accent/40'
                    : 'bg-border'
                }`}
              />
            ))}
          </div>
          <span className="text-text-muted text-xs font-medium">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        {/* Next / Exit */}
        <div className="flex items-center gap-2">
          {currentSlide === slides.length - 1 ? (
            <button onClick={onExit} className="btn btn-primary btn-sm">
              Exit ✓
            </button>
          ) : (
            <button onClick={goNext} className="btn btn-primary btn-sm">
              Next →
            </button>
          )}
          <button
            onClick={onExit}
            className="btn-icon text-text-muted hover:text-danger"
            title="Exit Presentation (Esc)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
