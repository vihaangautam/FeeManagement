import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, IndianRupee, Sparkles, Users, BookOpen, BarChart3, ArrowRight, Play, CheckCircle2, ChevronRight, Zap, Shield } from 'lucide-react';
import './landing.css';

/* ─── Intersection Observer for scroll reveals ─────────── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.12 }
    );
    const els = ref.current?.querySelectorAll('.reveal');
    els?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ─── Navbar ────────────────────────────────────────────── */
function Navbar({ onNavigate }) {
  return (
    <nav className="nav-glass fixed top-0 left-0 w-full z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="TutorFlow" className="w-[80%] h-[80%] object-contain" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">TutorFlow</span>
        </div>

        {/* Links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="nav-link text-sm font-medium">Features</a>
          <a href="#steps" className="nav-link text-sm font-medium">How It Works</a>
          <a href="#tech" className="nav-link text-sm font-medium">Stack</a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/login')}
            className="text-sm font-medium text-text-secondary hover:text-white transition-colors hidden sm:block"
          >
            Log In
          </button>
          <button
            onClick={() => onNavigate('/login')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
          >
            Sign Up
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero ──────────────────────────────────────────────── */
function Hero({ onNavigate }) {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left — Copy */}
        <div className="space-y-6 reveal">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-tertiary border border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
            <Sparkles size={12} className="text-accent" /> Master your craft
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.12] tracking-tight">
            Empower Your{' '}
            <span className="gradient-text">Tutoring Business</span>{' '}
            with TutorFlow
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed max-w-lg">
            Seamlessly manage student enrollments, automate fee tracking, and generate professional AI-powered lesson plans in minutes.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => onNavigate('/login')}
              className="btn bg-accent text-white hover:bg-accent-hover shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all"
            >
              Get Started for Free
              <ArrowRight size={16} />
            </button>
            <button className="btn bg-bg-tertiary text-text-primary border border-border hover:border-border-light hover:bg-border transition-all">
              <Play size={16} className="text-accent" />
              Watch Demo
            </button>
          </div>
          <div className="flex items-center gap-4 pt-2 text-xs text-text-muted">
            <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-accent" /> Free forever plan</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-accent" /> No credit card required</span>
          </div>
        </div>

        {/* Right — Dashboard Mockup */}
        <div className="relative reveal" style={{ animationDelay: '100ms' }}>
          <div className="hero-glow" />
          <img
            src="/landing/hero-dashboard.png"
            alt="TutorFlow Dashboard Preview"
            className="relative z-10 w-full rounded-2xl border border-border shadow-2xl shadow-black/40 animate-float"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Features Grid ─────────────────────────────────────── */
function Features() {
  return (
    <section id="features" className="py-20 md:py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 reveal">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Precision Tools for <span className="gradient-text">Educators</span>
          </h2>
          <p className="text-text-secondary mt-3 max-w-xl mx-auto">
            Designed for professional tutors to deliver excellence and efficiency in every session.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 — Dashboard */}
          <div className="feature-card glass-card p-6 sm:p-8 reveal">
            <div className="w-12 h-12 rounded-xl bg-indigo-light flex items-center justify-center mb-5">
              <LayoutDashboard size={24} className="text-indigo" />
            </div>
            <h3 className="text-xl font-bold mb-2">Unified Dashboard</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-5">
              Monitor your coaching center's heartbeat. Track students, collections, revenue growth, and batch performance with real-time KPI metrics designed for clarity.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-text-muted">
                <CheckCircle2 size={13} className="text-accent shrink-0" /> Real-time KPI visualizations
              </li>
              <li className="flex items-center gap-2 text-xs text-text-muted">
                <CheckCircle2 size={13} className="text-accent shrink-0" /> Quick performance analytics
              </li>
            </ul>
          </div>

          {/* Card 2 — Fee Management */}
          <div className="feature-card glass-card p-6 sm:p-8 reveal border-indigo/30 hover:border-indigo/50" style={{ animationDelay: '80ms' }}>
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center mb-5">
              <IndianRupee size={24} className="text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Fee Management</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-5">
              Streamline fee collections and track pending payments. Generate detailed enrollment-aware financial reports & Excel exports in one click.
            </p>
            <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors">
              Explore Features <ChevronRight size={13} />
            </button>
          </div>

          {/* Card 3 — Lesson Copilot */}
          <div className="feature-card glass-card p-6 sm:p-8 reveal md:col-span-2 lg:col-span-1" style={{ animationDelay: '160ms' }}>
            <div className="w-12 h-12 rounded-xl bg-indigo-light flex items-center justify-center mb-5">
              <Sparkles size={24} className="text-indigo" />
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Lesson Copilot</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-5">
              Leverage AI to build comprehensive lesson plans, interactive quizzes, and professional PPTX presentations. Let AI handle the pedagogy.
            </p>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-[11px] font-semibold border border-accent/20">
                Export PPTX
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo/10 text-indigo text-[11px] font-semibold border border-indigo/20">
                AI-Powered
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Steps ─────────────────────────────────────────────── */
function Steps() {
  const steps = [
    {
      num: '01',
      title: 'Set up Batches',
      desc: 'Define your subjects, timing, and locations. Organize classes by batch to streamline enrollment.',
      icon: Users,
    },
    {
      num: '02',
      title: 'Enroll Students',
      desc: 'Add students directly or in bulk. Assign them to batches, set monthly fees, and track engagement from day one.',
      icon: BookOpen,
    },
    {
      num: '03',
      title: 'Track & Teach',
      desc: 'Monitor attendance, collect fees automatically, and use AI lesson plans to stay ahead in every session.',
      icon: BarChart3,
    },
  ];

  return (
    <section id="steps" className="py-20 md:py-28 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 reveal">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            From Setup to <span className="gradient-text">Success</span>
          </h2>
          <p className="text-text-secondary mt-3 max-w-lg">
            A streamlined workflow designed for high-performance coaching centers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.num} className="relative reveal" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="step-number mb-2">{s.num}</div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center">
                  <s.icon size={20} className="text-accent" />
                </div>
                <h3 className="text-lg font-bold">{s.title}</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Tech Stack ────────────────────────────────────────── */
function TechStack() {
  const techs = [
    { name: 'FastAPI', color: 'text-emerald-400' },
    { name: 'React', color: 'text-cyan-400' },
    { name: 'Gemini AI', color: 'text-violet-400' },
    { name: 'Excel+', color: 'text-green-400' },
    { name: 'MongoDB', color: 'text-emerald-400' },
  ];

  return (
    <section id="tech" className="py-20 md:py-28 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-8 sm:p-12 reveal relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-accent" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Engineered for <span className="gradient-text">Stability</span>
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed max-w-lg mb-8">
              Built with a modern, high-performing architecture for seamless interfaces and reliable data management.
              Our AI integration leverages state-of-the-art Google Gemini models to ensure your lesson plans are accurate, relevant, and engaging.
            </p>

            <div className="flex flex-wrap gap-3">
              {techs.map((t) => (
                <span key={t.name} className="tech-badge">
                  <span className={`mr-1.5 ${t.color}`}>●</span> {t.name}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6 mt-6 text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><Zap size={13} className="text-accent" /> Enterprise-grade Security</span>
              <span className="flex items-center gap-1.5"><Zap size={13} className="text-accent" /> 99.9% Uptime SLA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Footer ────────────────────────────────────────── */
function CTASection({ onNavigate }) {
  return (
    <section className="py-24 md:py-32 px-4 sm:px-6 relative">
      <div className="cta-glow left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="max-w-3xl mx-auto text-center relative z-10 reveal">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center mx-auto mb-6 overflow-hidden shadow-lg shadow-emerald-500/20">
          <img src="/logo.png" alt="TutorFlow" className="w-[70%] h-[70%] object-contain" />
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4">
          Ready to streamline your<br />coaching center?
        </h2>
        <p className="text-text-secondary max-w-lg mx-auto mb-8">
          Join hundreds of professional tutors who have saved 20+ hours a month with TutorFlow's automation.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate('/login')}
            className="btn bg-accent text-white hover:bg-accent-hover shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all text-base px-7 py-3"
          >
            Start Free Trial
          </button>
          <button className="btn bg-bg-tertiary text-text-primary border border-border hover:border-border-light hover:bg-border transition-all text-base px-7 py-3">
            Book a Consultation
          </button>
        </div>
        <p className="text-text-muted text-xs mt-5">✓ No credit card required · 14-day free trial</p>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-border py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="TutorFlow" className="w-[80%] h-[80%] object-contain" />
          </div>
          <span className="text-sm font-semibold text-text-secondary">TutorFlow</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-text-muted">
          <a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-text-primary transition-colors">Contact Us</a>
          <a href="#" className="hover:text-text-primary transition-colors">Blog</a>
        </div>
        <p className="text-xs text-text-muted">© 2026 TutorFlow. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ─── Landing Page ──────────────────────────────────────── */
export default function LandingPage() {
  const containerRef = useReveal();
  const navigate = useNavigate();
  const go = (path) => navigate(path);

  return (
    <div ref={containerRef} className="landing-page min-h-screen">
      <Navbar onNavigate={go} />
      <Hero onNavigate={go} />
      <Features />
      <Steps />
      <TechStack />
      <CTASection onNavigate={go} />
      <Footer />
    </div>
  );
}
