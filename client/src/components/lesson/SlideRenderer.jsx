import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * SlideRenderer — Renders a single lesson slide based on its type.
 * Types: title, content, flowchart, diagram, quiz, summary
 */
export default function SlideRenderer({ slide, index, onSwapImage, compact = false }) {
  switch (slide.type) {
    case 'title':
      return <TitleSlide slide={slide} compact={compact} />;
    case 'content':
      return <ContentSlide slide={slide} compact={compact} />;
    case 'flowchart':
      return <FlowchartSlide slide={slide} index={index} compact={compact} />;
    case 'diagram':
      return <DiagramSlide slide={slide} onSwapImage={onSwapImage} compact={compact} />;
    case 'quiz':
      return <QuizSlide slide={slide} compact={compact} />;
    case 'summary':
      return <SummarySlide slide={slide} compact={compact} />;
    default:
      return <ContentSlide slide={slide} compact={compact} />;
  }
}

const cleanBullet = (text) => 
  text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim();


/* ── Title Slide ──────────────────────────────────── */

function TitleSlide({ slide, compact }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center h-full ${compact ? 'p-4' : 'p-8 md:p-12'}`}>
      <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-accent to-indigo flex items-center justify-center">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h1 className={`font-bold bg-gradient-to-r from-accent to-indigo bg-clip-text text-transparent ${compact ? 'text-xl mb-2' : 'text-2xl md:text-4xl mb-4'}`}>
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p className={`text-text-secondary max-w-md ${compact ? 'text-xs' : 'text-base md:text-lg'}`}>
          {slide.subtitle}
        </p>
      )}
      {slide.tagline && (
        <span className="mt-4 inline-flex items-center gap-1 py-1 px-3 rounded-full text-xs font-semibold bg-accent-light text-accent uppercase tracking-wider">
          {slide.tagline}
        </span>
      )}
    </div>
  );
}


/* ── Content Slide ────────────────────────────────── */

function ContentSlide({ slide, compact }) {
  return (
    <div className={`flex flex-col h-full ${compact ? 'p-4' : 'p-6 md:p-10'}`}>
      <h2 className={`font-bold text-text-primary mb-4 ${compact ? 'text-base' : 'text-xl md:text-2xl'}`}>
        {slide.title}
      </h2>

      {slide.highlight && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-gradient-to-r from-accent/10 to-indigo/10 border border-accent/20">
          <p className={`text-accent font-semibold font-mono ${compact ? 'text-xs' : 'text-sm md:text-base'}`}>
            {slide.highlight}
          </p>
        </div>
      )}

      <ul className="space-y-3 flex-1">
        {(slide.bullets || []).map((bullet, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
            <span className={`text-text-secondary leading-relaxed ${compact ? 'text-xs' : 'text-sm md:text-base'}`}>
              {cleanBullet(bullet)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}


/* ── Flowchart Slide ──────────────────────────────── */

function FlowchartSlide({ slide, index, compact }) {
  const containerRef = useRef(null);
  const [svgHtml, setSvgHtml] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function renderMermaid() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#10b981',
            primaryTextColor: '#e2e8f0',
            primaryBorderColor: '#2e3345',
            lineColor: '#6366f1',
            secondaryColor: '#1a1d27',
            tertiaryColor: '#242836',
            background: '#1a1d27',
            mainBkg: '#242836',
            nodeBorder: '#3a3f52',
            clusterBkg: '#1a1d27',
            titleColor: '#e2e8f0',
            edgeLabelBackground: '#1a1d27',
          },
          flowchart: { curve: 'basis', padding: 15 },
          fontFamily: 'Inter, sans-serif',
          suppressErrorRendering: true,
        });
        const id = `mermaid-${index}-${Date.now()}`;
        
        // Gemini sometimes outputs ```mermaid ... ``` inside the JSON string. Prevent syntax errors:
        let cleanMermaidCode = slide.mermaidCode || '';
        if (cleanMermaidCode.includes('```')) {
          cleanMermaidCode = cleanMermaidCode.replace(/```mermaid\n?/i, '').replace(/```\n?/g, '').trim();
        }
        // Force wrap all text inside square brackets with double quotes to prevent parenthesis parse errors
        cleanMermaidCode = cleanMermaidCode.replace(/\[([^\]"]+)\]/g, '["$1"]');
        
        const { svg } = await mermaid.render(id, cleanMermaidCode);
        if (!cancelled) setSvgHtml(svg);
      } catch (e) {
        console.warn('Mermaid render failed:', e);
        if (!cancelled) setError(true);
      }
    }
    if (slide.mermaidCode) renderMermaid();
    return () => { cancelled = true; };
  }, [slide.mermaidCode, index]);

  return (
    <div className={`flex flex-col h-full ${compact ? 'p-4' : 'p-6 md:p-10'}`}>
      <h2 className={`font-bold text-text-primary mb-4 ${compact ? 'text-base' : 'text-xl md:text-2xl'}`}>
        {slide.title}
      </h2>

      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center rounded-xl bg-bg-tertiary/50 border border-border overflow-auto p-4"
      >
        {error ? (
          <div className="text-center text-text-muted p-4">
            <p className="text-sm mb-2">Flowchart rendering failed</p>
            <pre className="text-xs text-left bg-bg-primary p-3 rounded-lg overflow-auto max-h-40 text-text-secondary">
              {slide.mermaidCode}
            </pre>
          </div>
        ) : svgHtml ? (
          <div
            className="flex items-center justify-center w-full h-full [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:h-auto [&_svg]:w-auto"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Rendering flowchart...
          </div>
        )}
      </div>

      {slide.caption && (
        <p className={`mt-3 text-text-muted italic text-center ${compact ? 'text-xs' : 'text-sm'}`}>
          {slide.caption}
        </p>
      )}
    </div>
  );
}


/* ── Diagram Slide ────────────────────────────────── */

function DiagramSlide({ slide, onSwapImage, compact }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = slide.imageUrl || slide.thumbnailUrl;

  return (
    <div className={`flex flex-col h-full ${compact ? 'p-4' : 'p-6 md:p-10'}`}>
      <h2 className={`font-bold text-text-primary mb-4 ${compact ? 'text-base' : 'text-xl md:text-2xl'}`}>
        {slide.title}
      </h2>

      <div className="flex-1 relative flex items-center justify-center rounded-xl bg-bg-tertiary/50 border border-border overflow-hidden group">
        {imageUrl && !imgError ? (
          <>
            <img
              src={imageUrl}
              alt={slide.altText || slide.caption || 'Diagram'}
              className="max-w-full max-h-full object-contain p-2"
              onError={() => setImgError(true)}
            />
            {onSwapImage && (
              <button
                onClick={() => onSwapImage(slide)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity btn btn-sm bg-bg-secondary/90 backdrop-blur text-text-primary border border-border hover:border-accent"
              >
                🔄 Swap Image
              </button>
            )}
          </>
        ) : (
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-bg-tertiary flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
            <p className="text-text-muted text-sm mb-1">{slide.altText || 'Diagram not available'}</p>
            {onSwapImage && (
              <button
                onClick={() => onSwapImage(slide)}
                className="btn btn-sm btn-primary mt-2"
              >
                Search Image
              </button>
            )}
          </div>
        )}
      </div>

      {slide.caption && (
        <p className={`mt-3 text-text-muted italic text-center ${compact ? 'text-xs' : 'text-sm'}`}>
          {slide.caption}
        </p>
      )}
    </div>
  );
}


/* ── Quiz Slide ───────────────────────────────────── */

function QuizSlide({ slide, compact }) {
  const [revealed, setRevealed] = useState({});

  const toggleReveal = (qi) => {
    setRevealed(prev => ({ ...prev, [qi]: !prev[qi] }));
  };

  return (
    <div className={`flex flex-col h-full overflow-auto ${compact ? 'p-4' : 'p-6 md:p-10'}`}>
      <h2 className={`font-bold text-text-primary mb-4 ${compact ? 'text-base' : 'text-xl md:text-2xl'}`}>
        {slide.title}
      </h2>

      <div className="space-y-4 flex-1">
        {(slide.questions || []).map((q, qi) => (
          <div key={qi} className="rounded-xl border border-border bg-bg-tertiary/30 p-4">
            <p className={`font-medium text-text-primary mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
              Q{qi + 1}. {q.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {(q.options || []).map((opt, oi) => {
                const isCorrect = revealed[qi] && oi === q.correct;
                const isWrong = revealed[qi] && oi !== q.correct;
                return (
                  <div
                    key={oi}
                    className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                      isCorrect
                        ? 'border-success bg-success-light text-success font-semibold'
                        : isWrong
                        ? 'border-border/50 text-text-muted'
                        : 'border-border text-text-secondary'
                    }`}
                  >
                    <span className="font-semibold mr-1">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => toggleReveal(qi)}
              className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              {revealed[qi] ? 'Hide Answer' : 'Reveal Answer'}
            </button>
            {revealed[qi] && q.explanation && (
              <p className="mt-2 text-xs text-text-muted bg-bg-primary/50 rounded-lg p-2">
                💡 {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


/* ── Summary Slide ────────────────────────────────── */

function SummarySlide({ slide, compact }) {
  return (
    <div className={`flex flex-col h-full ${compact ? 'p-4' : 'p-6 md:p-10'}`}>
      <h2 className={`font-bold text-text-primary mb-4 ${compact ? 'text-base' : 'text-xl md:text-2xl'}`}>
        {slide.title}
      </h2>

      <div className="flex-1 space-y-3">
        {(slide.keyPoints || []).map((point, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-bg-tertiary/40 border border-border/50">
            <span className="w-6 h-6 flex-shrink-0 rounded-lg bg-accent-light text-accent flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            <span className={`text-text-secondary leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
              {cleanBullet(point)}
            </span>
          </div>
        ))}
      </div>

      {slide.examTip && (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/20 p-4">
          <p className={`text-warning font-semibold mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
            🎯 Exam Tip
          </p>
          <p className={`text-text-secondary ${compact ? 'text-xs' : 'text-sm'}`}>
            {slide.examTip}
          </p>
        </div>
      )}
    </div>
  );
}
