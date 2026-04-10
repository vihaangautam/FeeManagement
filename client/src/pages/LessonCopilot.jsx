import { useState, useCallback } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, Play, Download, Save, BookOpen, Beaker, Leaf, Atom, ArrowLeft } from 'lucide-react';
import CURRICULUM from '../data/curriculumData';
import { generateLesson, saveLesson } from '../api/lessonApi';
import SlideRenderer from '../components/lesson/SlideRenderer';
import PresentationMode from '../components/lesson/PresentationMode';
import ImageSwapper from '../components/lesson/ImageSwapper';
import { exportLessonPPTX } from '../utils/pptxExport';
import { useAuth } from '../context/AuthContext';

const VIBES = [
  {
    id: 'concept_intro',
    label: 'Concept Introduction',
    desc: 'Build intuition with analogies & real-world examples',
    icon: '💡',
    color: 'from-accent to-emerald-400',
  },
  {
    id: 'deep_dive',
    label: 'Deep Dive & Mechanisms',
    desc: 'In-depth processes, derivations & flowcharts',
    icon: '🔬',
    color: 'from-indigo to-violet-400',
  },
  {
    id: 'exam_revision',
    label: 'Exam Revision & PYQs',
    desc: 'Previous year questions, cheat sheets & tips',
    icon: '🎯',
    color: 'from-warning to-orange-400',
  },
];

const LOADING_MESSAGES = [
  'Mapping syllabus guidelines...',
  'Analyzing key concepts...',
  'Generating conceptual flowcharts...',
  'Sourcing educational diagrams...',
  'Structuring lesson slides...',
  'Formatting exam-focused content...',
  'Adding quiz questions...',
  'Polishing final presentation...',
];

const SUBJECT_ICONS = {
  Physics: Atom,
  Chemistry: Beaker,
  Biology: Leaf,
};


export default function LessonCopilot() {
  const { user } = useAuth();

  // ── Wizard State ──────────────────────────────────
  const [step, setStep] = useState(1);
  const [board, setBoard] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [vibe, setVibe] = useState('');

  // ── Generation State ──────────────────────────────
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError] = useState('');
  const [lesson, setLesson] = useState(null);

  // ── Presentation State ────────────────────────────
  const [presenting, setPresenting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // ── Image Swapper State ───────────────────────────
  const [swapSlide, setSwapSlide] = useState(null);

  // ── Saving State ──────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);


  // ── Derived ───────────────────────────────────────
  const chapters = board && grade && subject
    ? (CURRICULUM[board]?.[grade]?.[subject] || [])
    : [];


  // ── Handlers ──────────────────────────────────────

  const canProceedStep1 = board && grade && subject && chapter;
  const canProceedStep2 = subtopic.trim().length > 3;
  const canProceedStep3 = vibe !== '';

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setLoadingMsg(0);

    // Cycle loading messages
    const interval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 1800);

    try {
      const result = await generateLesson({
        board, grade, subject, chapter, subtopic, vibe,
      });
      setLesson(result);
    } catch (err) {
      setError(err.message || 'Failed to generate lesson. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lesson) return;
    setSaving(true);
    try {
      await saveLesson({
        title: lesson.title,
        board: lesson.board,
        grade: lesson.grade,
        subject: lesson.subject,
        chapter: lesson.chapter,
        subtopic: lesson.subtopic,
        vibe: lesson.vibe,
        slides: lesson.slides,
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPPTX = async () => {
    if (!lesson) return;
    setExporting(true);
    try {
      await exportLessonPPTX(lesson.slides, lesson.title, user?.name);
    } catch (err) {
      setError('PPTX export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleSwapImage = useCallback((slide) => {
    setSwapSlide(slide);
  }, []);

  const handleImageSelected = useCallback((fullUrl, thumbnail) => {
    if (!swapSlide || !lesson) return;
    setLesson(prev => ({
      ...prev,
      slides: prev.slides.map(s =>
        s === swapSlide
          ? { ...s, imageUrl: fullUrl, thumbnailUrl: thumbnail }
          : s
      ),
    }));
    setSwapSlide(null);
  }, [swapSlide, lesson]);

  const handleNewLesson = () => {
    setLesson(null);
    setStep(1);
    setBoard('');
    setGrade('');
    setSubject('');
    setChapter('');
    setSubtopic('');
    setVibe('');
    setError('');
    setSaved(false);
  };


  // ── If presenting, show fullscreen ────────────────
  if (presenting && lesson) {
    return (
      <PresentationMode
        slides={lesson.slides}
        currentSlide={currentSlide}
        onSlideChange={setCurrentSlide}
        onExit={() => setPresenting(false)}
      />
    );
  }


  // ── Render ────────────────────────────────────────
  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-indigo flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Smart Lesson Copilot</h1>
            <p className="text-text-muted text-sm">AI-powered lessons in seconds</p>
          </div>
        </div>
      </div>

      {/* ── Generated Lesson View ───────────────────── */}
      {lesson ? (
        <div className="space-y-6 animate-fade-in">
          {/* Action Bar */}
          <div className="glass-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg text-text-primary">{lesson.title}</h2>
                <p className="text-text-muted text-xs mt-0.5">
                  {lesson.board} • Class {lesson.grade} • {lesson.subject} •{' '}
                  {VIBES.find(v => v.id === lesson.vibe)?.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setCurrentSlide(0); setPresenting(true); }} className="btn btn-primary">
                  <Play size={16} /> Teach Now
                </button>
                <button onClick={handleExportPPTX} disabled={exporting} className="btn btn-secondary">
                  <Download size={16} /> {exporting ? 'Exporting...' : 'PPTX'}
                </button>
                <button onClick={handleSave} disabled={saving || saved} className="btn btn-secondary">
                  <Save size={16} /> {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleNewLesson} className="btn btn-secondary">
                  <Sparkles size={16} /> New
                </button>
              </div>
            </div>
          </div>

          {/* Slide Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.slides.map((slide, i) => (
              <div
                key={i}
                data-slide-export
                className="glass-card overflow-hidden cursor-pointer hover:border-accent transition-all duration-200"
                style={{ minHeight: '280px' }}
                onClick={() => { setCurrentSlide(i); setPresenting(true); }}
              >
                {/* Slide number badge */}
                <div className="absolute top-3 left-3 z-10 w-6 h-6 rounded-lg bg-bg-primary/80 flex items-center justify-center text-xs font-bold text-text-muted">
                  {i + 1}
                </div>

                <div className="relative h-full" onClick={(e) => e.stopPropagation()}>
                  <SlideRenderer
                    slide={slide}
                    index={i}
                    compact
                    onSwapImage={slide.type === 'diagram' ? handleSwapImage : undefined}
                  />
                  {/* Click overlay to present */}
                  <div
                    className="absolute inset-0 z-[1] cursor-pointer"
                    onClick={() => { setCurrentSlide(i); setPresenting(true); }}
                  />
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-xl bg-danger-light border border-danger/20 p-4 text-danger text-sm">
              {error}
            </div>
          )}
        </div>
      ) : loading ? (
        /* ── Loading State ──────────────────────────── */
        <div className="glass-card p-12 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-accent to-indigo flex items-center justify-center relative">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/30 to-indigo/30 animate-ping" />
          </div>

          <h2 className="text-xl font-bold text-text-primary mb-2">Creating Your Lesson</h2>
          <p className="text-text-muted text-sm mb-6">
            {board} • Class {grade} • {subject} • {chapter}
          </p>

          {/* Animated message */}
          <div className="h-8 flex items-center justify-center">
            <p className="text-accent font-medium text-sm animate-pulse" key={loadingMsg}>
              ✨ {LOADING_MESSAGES[loadingMsg]}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-6">
            {LOADING_MESSAGES.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i <= loadingMsg ? 'bg-accent' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ── Wizard ─────────────────────────────────── */
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= s
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-muted'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${step >= s ? 'text-text-primary' : 'text-text-muted'}`}>
                  {s === 1 ? 'Curriculum' : s === 2 ? 'Sub-Topic' : 'Style'}
                </span>
                {s < 3 && <div className={`flex-1 h-0.5 rounded ${step > s ? 'bg-accent' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-xl bg-danger-light border border-danger/20 p-4 text-danger text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Curriculum Selector */}
          {step === 1 && (
            <div className="glass-card p-6 md:p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="text-accent" size={24} />
                <div>
                  <h2 className="text-lg font-bold">Choose Your Curriculum</h2>
                  <p className="text-text-muted text-sm">Select board, class, subject, and chapter</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Board */}
                <div>
                  <label className="form-label">Board</label>
                  <select
                    className="form-select"
                    value={board}
                    onChange={(e) => { setBoard(e.target.value); setGrade(''); setSubject(''); setChapter(''); }}
                  >
                    <option value="">Select Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                  </select>
                </div>

                {/* Grade */}
                <div>
                  <label className="form-label">Class</label>
                  <select
                    className="form-select"
                    value={grade}
                    onChange={(e) => { setGrade(e.target.value); setSubject(''); setChapter(''); }}
                    disabled={!board}
                  >
                    <option value="">Select Class</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={subject}
                    onChange={(e) => { setSubject(e.target.value); setChapter(''); }}
                    disabled={!grade}
                  >
                    <option value="">Select Subject</option>
                    {board && grade && Object.keys(CURRICULUM[board]?.[grade] || {}).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Chapter */}
                <div>
                  <label className="form-label">Chapter</label>
                  <select
                    className="form-select"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    disabled={!subject}
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map(ch => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject Cards (visual) */}
              {board && grade && (
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {Object.keys(CURRICULUM[board]?.[grade] || {}).map(sub => {
                    const Icon = SUBJECT_ICONS[sub] || BookOpen;
                    const isSelected = subject === sub;
                    return (
                      <button
                        key={sub}
                        onClick={() => { setSubject(sub); setChapter(''); }}
                        className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                          isSelected
                            ? 'border-accent bg-accent-light'
                            : 'border-border bg-bg-tertiary/50 hover:border-border-light'
                        }`}
                      >
                        <Icon size={24} className={`mx-auto mb-2 ${isSelected ? 'text-accent' : 'text-text-muted'}`} />
                        <p className={`text-sm font-medium ${isSelected ? 'text-accent' : 'text-text-secondary'}`}>{sub}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Sub-Topic Input */}
          {step === 2 && (
            <div className="glass-card p-6 md:p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <Beaker className="text-indigo" size={24} />
                <div>
                  <h2 className="text-lg font-bold">What's Today's Focus?</h2>
                  <p className="text-text-muted text-sm">Be specific for the best results</p>
                </div>
              </div>

              <div className="mb-2">
                <span className="badge badge-coaching text-xs">{board} • Class {grade} • {subject} • {chapter}</span>
              </div>

              <div className="mt-4">
                <label className="form-label">Sub-Topic or Focus Area</label>
                <input
                  type="text"
                  className="form-input text-base py-3"
                  placeholder='e.g. "Extraction of Aluminium (Hall-Héroult process)"'
                  value={subtopic}
                  onChange={(e) => setSubtopic(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-text-muted mt-2">
                  💡 Tip: The more specific you are, the better the lesson. Include process names, specific topics, or question types.
                </p>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="btn btn-secondary">
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Vibe / Depth */}
          {step === 3 && (
            <div className="glass-card p-6 md:p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-warning" size={24} />
                <div>
                  <h2 className="text-lg font-bold">Choose Your Teaching Style</h2>
                  <p className="text-text-muted text-sm">How should the lesson be structured?</p>
                </div>
              </div>

              <div className="mb-2">
                <span className="badge badge-coaching text-xs">{board} • Class {grade} • {subject} • {chapter}</span>
                <span className="badge badge-home text-xs ml-2">{subtopic}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {VIBES.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVibe(v.id)}
                    className={`p-5 rounded-xl border text-left transition-all duration-200 ${
                      vibe === v.id
                        ? 'border-accent bg-accent-light shadow-lg shadow-accent/10'
                        : 'border-border bg-bg-tertiary/50 hover:border-border-light'
                    }`}
                  >
                    <span className="text-2xl mb-3 block">{v.icon}</span>
                    <p className={`font-semibold text-sm mb-1 ${vibe === v.id ? 'text-accent' : 'text-text-primary'}`}>
                      {v.label}
                    </p>
                    <p className="text-xs text-text-muted">{v.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(2)} className="btn btn-secondary">
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!canProceedStep3}
                  className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles size={16} /> Generate Lesson
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Swapper Modal */}
      {swapSlide && (
        <ImageSwapper
          slide={swapSlide}
          onSelect={handleImageSelected}
          onClose={() => setSwapSlide(null)}
        />
      )}
    </div>
  );
}
