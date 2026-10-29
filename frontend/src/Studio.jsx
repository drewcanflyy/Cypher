import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, ArrowRight, AudioLines, Eye, EyeOff, Headphones, Mic, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { partnerPortraits, roomImages } from './rooms.js';

gsap.registerPlugin(ScrollTrigger);

const roomNames = {
  tech_interview: 'The technical interview',
  general_job_interview: 'Make your first impression',
  university_presentation: 'Defend your big idea',
  school_interaction: 'Find your way on campus',
  casual_coffee_hangout: 'A conversation over coffee',
  salary_negotiation: 'Know what you bring',
};
const roomDescriptions = {
  tech_interview: 'Talk through your thinking. Turn your experience into a convincing answer.',
  general_job_interview: 'Tell your story with the confidence it deserves.',
  university_presentation: 'Explain your research. Stand behind your thinking.',
  school_interaction: 'Real questions, everyday English, a little less hesitation.',
  casual_coffee_hangout: 'No script. Just you, a new friend, and a good conversation.',
  salary_negotiation: 'Make your case and navigate the conversation that matters.',
};
const categories = ['All', 'Career', 'Education', 'Daily Life', 'Business'];

export function Waveform({ active = false, className = '' }) {
  return <span className={`waveform ${active ? 'is-active' : ''} ${className}`} aria-hidden="true">
    {[10, 22, 34, 18, 42, 28, 52, 36, 20, 44, 30, 16, 38, 24, 12].map((height, index) => <i key={index} style={{ '--bar': `${height}px`, '--delay': `${index * -87}ms` }} />)}
  </span>;
}

export function PracticeStage({ scenarios, choose }) {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const stageRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const visible = scenarios.filter(item => (filter === 'All' || item.category === filter) && `${item.title} ${item.partner_name} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  const visibleKey = visible.map(item => item.id).join('|');

  useLayoutEffect(() => {
    const cards = gsap.utils.toArray('[data-room-card]', stageRef.current);
    if (reduceMotion) {
      gsap.set(cards, { clearProps: 'opacity,transform' });
      return undefined;
    }

    const context = gsap.context(() => {
      cards.forEach((card, index) => {
        gsap.fromTo(card,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            delay: Math.min(index * 0.045, 0.18),
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 92%', once: true },
          });

        const image = card.querySelector('.room-image');
        if (image) {
          gsap.fromTo(image,
            { '--parallax-y': '-3.5%' },
            {
              '--parallax-y': '3.5%',
              ease: 'none',
              scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 0.65 },
            });
        }
      });
    }, stageRef);

    return () => context.revert();
  }, [visibleKey, reduceMotion]);

  return <section className="stage" ref={stageRef}>
    <div className="intro">
      <span className="section-kicker"><AudioLines size={16} /> Your conversation studio</span>
      <h1>Less <br />overthinking.<br /><span>More you.</span></h1>
      <p>Real situations. A partner who adapts.<br />Find your voice, one conversation at a time.</p>
      <div className="filters" aria-label="Filter practice rooms">{categories.map(category => <motion.button whileTap={{ scale: 0.96 }} key={category} aria-pressed={filter === category} className={filter === category ? 'selected' : ''} onClick={() => setFilter(category)}>{category}{filter === category && <ArrowUpRight size={14} />}</motion.button>)}</div>
      <div className="studio-note"><span className="note-icon"><Mic size={18} /></span><p><strong>Your pace. Your voice.</strong><span>Speak or type. No timer, no rush.</span></p></div>
    </div>
    <div className="room-collection">
      <header className="collection-head"><div><span className="eyebrow">Practice rooms</span><h2>Choose your next conversation<span>{visible.length}</span></h2></div><label className="room-search"><Search size={16} /><input aria-label="Search practice rooms" placeholder="Find a room" value={query} onChange={event => setQuery(event.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="Clear room search"><X size={14} /></button>}</label></header>
      <div className="scenario-grid">{visible.map((item, index) => <article data-room-card key={item.id} className={`scenario ${index === 0 ? 'featured' : index === visible.length - 1 && visible.length % 2 === 0 ? 'wide' : ''}`}>
        <img className="room-image" src={roomImages[item.id] || roomImages.tech_interview} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
        <div className="room-shade" />
        <div className="room-topline"><span>{item.category}</span><span><Headphones size={14} />Voice & text</span></div>
        <div className="room-content"><span className="room-difficulty">All levels welcome</span><h2>{roomNames[item.id] || item.title}</h2><p>{roomDescriptions[item.id] || item.partner_role}</p><div className="room-bottom"><div className="room-partner">{partnerPortraits[item.id] ? <img className="partner-avatar" src={partnerPortraits[item.id]} alt={item.partner_name} /> : <span className="partner-monogram">{item.partner_name.split(' ').map(word => word[0]).slice(0, 2).join('')}</span>}<div><strong>{item.partner_name}</strong><span>{item.partner_role}</span></div></div><motion.button whileTap={{ scale: 0.94 }} className="scenario-start" onClick={() => choose(item)} aria-label={`Choose level for ${item.title}`}><span>Enter room</span><ArrowUpRight size={21} /></motion.button></div></div>
      </article>)}</div>
      {visible.length === 0 && <div className="empty-panel"><Search size={28} /><h2>No rooms found.</h2><p>Try another keyword or category.</p><button className="secondary" onClick={() => { setQuery(''); setFilter('All'); }}>Show all rooms</button></div>}
      <footer className="collection-footer"><span>Small conversations. Real progress.</span><span>CYPHER<ArrowUpRight size={14} /></span></footer>
    </div>
  </section>;
}

export function StudioAuth({ onSubmit, busy, error }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  return <main className="auth-page">
    <section className="auth-intro"><span className="section-kicker"><AudioLines size={16} /> A little practice changes everything</span><h1>Your voice.<span>No second guessing.</span></h1><p>Walk into your next real conversation<br />with a little more confidence.</p><div className="auth-room-preview"><img src={roomImages.tech_interview} alt="An atmospheric interview room ready for your next practice" /><div><span className="preview-icon"><Mic size={24} /></span><div><strong>Real situations. Your own pace.</strong><span>Interviews, coffee chats, big ideas.</span></div><Waveform /></div></div></section>
    <section className="auth-card"><span className="auth-symbol"><AudioLines size={25} /></span><div><p className="eyebrow">Your next conversation starts here</p><h2>{mode === 'login' ? 'Good to have\nyou back.' : 'Make room for\nyour voice.'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Sign in to your personal practice space.' : 'A fresh start. A more confident you.'}</p></div>
      <div className="auth-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button></div>
      <form onSubmit={event => { event.preventDefault(); onSubmit(mode, { display_name: name, email, password }); }}>
        {mode === 'register' && <label>Your name<input required autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="What should we call you?" /></label>}
        <label>Email<input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>Password<span className="password-field"><input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary auth-submit" disabled={busy}>{busy ? 'Opening your space...' : mode === 'login' ? 'Let’s get talking' : 'Create my account'}<ArrowRight size={18} /></button>
      </form><p className="auth-privacy"><ShieldCheck size={15} /> Your practice history stays in your account.</p>
    </section>
  </main>;
}

export function PartnerPresence({ active, pressure, speaking, replying, recording, complete }) {
  const mood = complete ? 'Session complete' : pressure >= 75 ? 'Under pressure' : pressure >= 40 ? 'Getting tense' : 'At ease';
  const portrait = partnerPortraits[active.id] || roomImages[active.id] || roomImages.tech_interview;
  const state = complete ? 'Ready for your reflection' : recording ? 'Listening to your answer' : replying ? 'Considering your answer' : speaking ? 'Speaking with you' : 'Ready when you are';
  return <section className="partner-presence">
    <div className="presence-scene">
      <img src={portrait} alt={`AI-generated portrait of ${active.partner_name}`} />
      <span className="presence-caption"><i />{state}</span>
      <div className={`presence-orb ${speaking || recording ? 'is-speaking' : ''}`} aria-hidden="true"><AudioLines size={24} strokeWidth={1.4} /></div>
    </div>
    <div className="presence-details">
      <div className="presence-name"><span>Your conversation partner</span><h3>{active.partner_name}</h3><small>{active.partner_role}</small></div>
      <div className="mood-reading"><span>Partner’s mood</span><strong>{mood}</strong></div>
      <div className="mood-segments" role="meter" aria-label="Partner pressure" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pressure}>{Array.from({ length: 20 }, (_, index) => <i key={index} className={index < Math.ceil(pressure / 5) ? 'filled' : ''} />)}</div>
    </div>
  </section>;
}

export function ProgressPanel({ user, dashboard, scenarios, practice, signOut, openReport }) {
  const sessions = dashboard?.sessions || [];
  const scored = sessions.filter(session => typeof session.assessment?.overall_score === 'number');
  const average = scored.length ? Math.round(scored.reduce((sum, session) => sum + session.assessment.overall_score, 0) / scored.length) : null;
  return <section className="dashboard"><header className="dashboard-head"><div><span className="section-kicker"><Sparkles size={16} /> Your personal practice space</span><h1>Look how far<br /><span>you’ve come.</span></h1><p>{user.display_name}, every conversation is another step forward.</p></div><button className="primary" onClick={practice}>Back to the studio<ArrowUpRight size={18} /></button></header>
    <div className="progress-overview"><article><span>Completed conversations</span><strong>{dashboard?.session_count || 0}</strong><p>Every attempt counts.</p></article><article><span>Recent average score</span><strong>{average ?? '--'}<small>{average !== null ? '/100' : ''}</small></strong><p>{average !== null ? 'From your saved speaking reports.' : 'Complete a room to see your score.'}</p></article><article className="progress-invitation"><Waveform /><h2>Keep the conversation going.</h2><button onClick={practice}>Choose your next room<ArrowRight size={18} /></button></article></div>
    <div className="history-heading"><h2>Your conversations</h2><span>{sessions.length} saved sessions</span></div>
    {sessions.length ? <div className="history-list">{sessions.map(session => { const scenario = scenarios.find(item => item.id === session.scenario_id); return <article key={session.id}><img src={partnerPortraits[session.scenario_id] || roomImages[session.scenario_id] || roomImages.tech_interview} alt="" /><div><span>{session.level}</span><h3>{scenario?.title || session.scenario_id.replaceAll('_', ' ')}</h3><small>{new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</small></div><strong>{session.assessment?.overall_score ?? '--'}<small>/100</small></strong>{session.assessment && <button aria-label={`Open report for ${scenario?.title || 'practice session'}`} onClick={() => openReport(session)}><ArrowUpRight size={20} /></button>}</article>; })}</div> : <section className="empty-panel"><span className="empty-icon"><Mic size={28} /></span><h2>Your story starts with a conversation.</h2><p>Choose a room, speak or type, then finish your session to see your progress here.</p><button className="primary" onClick={practice}>Find your first room<ArrowUpRight size={18} /></button></section>}
    <button className="sign-out" onClick={signOut}>Sign out<ArrowRight size={16} /></button>
  </section>;
}

export function StudioDialog({ children, close, title, className = '' }) {
  const dialog = useRef(null);
  const reduceMotion = useReducedMotion();
  const closeRef = useRef(close);
  useEffect(() => { closeRef.current = close; }, [close]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const onKey = event => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.current.querySelectorAll('button:not(:disabled), input, select, [tabindex="0"]')];
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); previousFocus?.focus(); };
  }, []);
  return <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0.12 : 0.2 }} onMouseDown={event => { if (event.target === event.currentTarget) close(); }}><motion.section ref={dialog} tabIndex={-1} className={className} role="dialog" aria-modal="true" aria-label={title} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.975 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }} transition={reduceMotion ? { duration: 0.12 } : { type: 'spring', bounce: 0, duration: 0.38 }}><button className="dialog-close round-button" onClick={close} aria-label="Close dialog"><X size={18} /></button>{children}</motion.section></motion.div>;
}
