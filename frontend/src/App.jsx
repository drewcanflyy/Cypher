import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Award, BookOpen, BriefcaseBusiness, Check, CheckCircle2, ChevronRight, Coffee, GraduationCap, Lightbulb, LogOut, Mic, MicOff, Radio, Send, Settings, Sparkles, UserRound, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

const API = 'http://127.0.0.1:8000';
const categories = ['All', 'Career', 'Education', 'Daily Life', 'Business'];
const levels = ['Beginner', 'Intermediate', 'Advanced'];
const fallback = [
  { id: 'tech_interview', title: 'Software engineer interview', category: 'Career', difficulty: 'Mid to senior', partner_name: 'Sarah Chen', partner_role: 'Engineering manager', initial_message: 'Hello. Thanks for taking the time to speak today. Could you briefly introduce yourself and share a technical project you recently worked on?' },
  { id: 'general_job_interview', title: 'Behavioral interview', category: 'Career', difficulty: 'Intermediate', partner_name: 'David Miller', partner_role: 'Head of talent', initial_message: 'Good morning. Great to meet you. Tell me about yourself and what motivated you to apply for this position?' },
  { id: 'university_presentation', title: 'University defense', category: 'Education', difficulty: 'Advanced', partner_name: 'Prof. Julian Vance', partner_role: 'Academic advisor', initial_message: 'Welcome to today’s seminar. What primary question or hypothesis are you exploring in your recent research?' },
  { id: 'school_interaction', title: 'College office', category: 'Education', difficulty: 'Beginner to intermediate', partner_name: 'Emma Wright', partner_role: 'Student advisor', initial_message: 'Hi there. Welcome to student services. How can I help with your schedule or classes?' },
  { id: 'casual_coffee_hangout', title: 'Coffee chat', category: 'Daily Life', difficulty: 'Conversational', partner_name: 'Jordan', partner_role: 'Local friend', initial_message: 'Hey, mind if I borrow this chair? By the way, what drink did you get? It looks great.' },
  { id: 'salary_negotiation', title: 'Offer negotiation', category: 'Business', difficulty: 'Advanced', partner_name: 'Arthur Sterling', partner_role: 'Managing director', initial_message: 'We were impressed with your interviews. We’d like to extend an offer at $65,000 per year with benefits. What are your thoughts?' },
];
const iconFor = { Career: BriefcaseBusiness, Education: GraduationCap, 'Daily Life': Coffee, Business: Award };
const imageFor = { tech_interview: '/scenarios/tech-interview.png', general_job_interview: '/scenarios/behavioral-interview.png', university_presentation: '/scenarios/university-defense.png', school_interaction: '/scenarios/college-office.png', casual_coffee_hangout: '/scenarios/coffee-chat.png', salary_negotiation: '/scenarios/offer-negotiation.png' };

function Scenario({ item, index, choose }) {
  const Icon = iconFor[item.category] || Radio;
  return <article className={`scenario ${index === 0 ? 'featured' : ''}`} style={{ '--scenario-image': `url(${imageFor[item.id] || imageFor.tech_interview})` }}>
    <div><div className="scenario-meta"><span>{String(index + 1).padStart(2, '0')}</span><span>{item.difficulty}</span></div><div className="scenario-icon"><Icon size={20} strokeWidth={1.5} /></div><p className="category">{item.category}</p><h2>{item.title}</h2><p className="partner">With {item.partner_name}<span>{item.partner_role}</span></p><p className="prompt">“{item.initial_message}”</p></div>
    <button className="scenario-start" onClick={() => choose(item)}>Choose level <ArrowUpRight size={17} /></button>
  </article>;
}

function AuthScreen({ onSubmit, busy, error }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = event => { event.preventDefault(); onSubmit(mode, { display_name: name, email, password }); };
  return <main className="auth-page"><section className="auth-intro"><div className="auth-badge-wrap"><img src="/logo.png" alt="CYPHER Logo" className="auth-badge-logo" /><span className="eyebrow" style={{ margin: 0 }}>English practice, made personal</span></div><h1>Every conversation knows where you left off.</h1><p>Keep your rooms, speaking reports, and progress in one private panel.</p><div className="auth-benefits"><span><Check size={16} />Personal practice history</span><span><Check size={16} />Choose your own level</span><span><Check size={16} />Voice or text answers</span></div></section><section className="auth-card"><div><p className="eyebrow">Welcome to CYPHER</p><h2>{mode === 'login' ? 'Pick up where you left off.' : 'Create your practice space.'}</h2></div><div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button><button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button></div><form onSubmit={submit}>{mode === 'register' && <label>Your name<input required value={name} onChange={event => setName(event.target.value)} placeholder="Souhail" /></label>}<label>Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<input required minLength="8" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>{error && <p className="auth-error">{error}</p>}<button className="primary auth-submit" disabled={busy}>{busy ? 'One moment...' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowUpRight size={18} /></button></form></section></main>;
}

export default function App() {
  const [view, setView] = useState('stage');
  const [scenarios, setScenarios] = useState(fallback);
  const [active, setActive] = useState(null);
  const [pendingScenario, setPendingScenario] = useState(null);
  const [level, setLevel] = useState('Intermediate');
  const [filter, setFilter] = useState('All');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [grading, setGrading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voice, setVoice] = useState('en-US-GuyNeural');
  const [report, setReport] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [key, setKey] = useState('');
  const [colab, setColab] = useState('');
  const [health, setHealth] = useState(null);
  const [notice, setNotice] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('cypher-token') || '');
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const recorder = useRef(null);
  const recordingStream = useRef(null);
  const audioChunks = useRef([]);
  const player = useRef(new Audio());
  const audioUrl = useRef(null);
  const end = useRef(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const loadDashboard = async () => {
    if (!token) return;
    const response = await fetch(`${API}/api/dashboard`, { headers: authHeaders });
    if (response.ok) setDashboard(await response.json());
  };

  useEffect(() => {
    const loadPublicData = async () => {
      const [scenarioResult, healthResult] = await Promise.allSettled([
        fetch(`${API}/api/scenarios`).then(response => response.json()),
        fetch(`${API}/api/health`).then(response => response.json()),
      ]);
      if (scenarioResult.status === 'fulfilled' && Array.isArray(scenarioResult.value) && scenarioResult.value.length) setScenarios(scenarioResult.value);
      setHealth(healthResult.status === 'fulfilled' ? healthResult.value : { status: 'offline' });
    };
    loadPublicData();
  }, []);

  useEffect(() => {
    const restoreUser = async () => {
      if (!token) { setAuthReady(true); return; }
      try {
        const response = await fetch(`${API}/api/auth/me`, { headers: authHeaders });
        if (!response.ok) throw new Error();
        setUser(await response.json());
        await loadDashboard();
      } catch {
        localStorage.removeItem('cypher-token');
        setToken('');
      } finally { setAuthReady(true); }
    };
    restoreUser();
  }, [token]);

  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [messages, replying]);
  useEffect(() => () => {
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    recordingStream.current?.getTracks().forEach(track => track.stop());
  }, []);

  const play = value => {
    fetch(`${API}/api/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: value, voice }) })
      .then(response => { if (!response.ok) throw new Error(); return response.blob(); })
      .then(blob => { if (audioUrl.current) URL.revokeObjectURL(audioUrl.current); audioUrl.current = URL.createObjectURL(blob); player.current.src = audioUrl.current; player.current.play().catch(() => {}); })
      .catch(() => { if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(value)); });
  };

  const signIn = async (mode, credentials) => {
    setAuthBusy(true); setAuthError('');
    try {
      const response = await fetch(`${API}/api/auth/${mode === 'login' ? 'login' : 'register'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'We could not sign you in.');
      localStorage.setItem('cypher-token', data.token);
      setUser(data.user); setToken(data.token);
    } catch (error) { setAuthError(error.message || 'We could not sign you in.'); }
    finally { setAuthBusy(false); }
  };

  const signOut = () => { localStorage.removeItem('cypher-token'); setToken(''); setUser(null); setDashboard(null); setView('stage'); };
  const chooseScenario = item => { setPendingScenario(item); setLevel('Intermediate'); };
  const start = () => {
    if (!pendingScenario) return;
    setActive(pendingScenario); setMessages([{ role: 'assistant', content: pendingScenario.initial_message }]); setReport(null); setNotice(''); setPendingScenario(null); setView('booth');
  };

  const sendText = async value => {
    if (!value || replying || !active) return;
    const next = [...messages, { role: 'user', content: value }];
    setMessages(next); setText(''); setReplying(true); setNotice('');
    try {
      const response = await fetch(`${API}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: active.id, messages: next, voice, level }) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      const reply = data.reply || 'Could you say a little more about the action you took?';
      setMessages([...next, { role: 'assistant', content: reply }]);
      if (voiceOn) play(reply);
    } catch {
      setMessages([...next, { role: 'assistant', content: 'That is a useful starting point. What was the most important decision you made in that situation?' }]);
      setNotice('The AI service is unavailable right now. Your answer is still in this session.');
    } finally { setReplying(false); }
  };

  const send = event => { event.preventDefault(); sendText(text.trim()); };
  const transcribeRecording = async blob => {
    setTranscribing(true); setNotice('Transcribing your answer...');
    try {
      const form = new FormData();
      form.append('audio', blob, 'cypher-recording.webm');
      const response = await fetch(`${API}/api/transcribe`, { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.text?.trim()) throw new Error(data.detail || 'No speech was detected.');
      setNotice('');
      await sendText(data.text.trim());
    } catch (error) { setNotice(error.message || 'We could not understand that recording. Please try again.'); }
    finally { setTranscribing(false); }
  };

  const toggleMic = async () => {
    if (recording) { recorder.current?.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setNotice('Voice recording is not supported in this browser. You can still type your answer.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStream.current = stream; audioChunks.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = event => { if (event.data.size) audioChunks.current.push(event.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        recordingStream.current = null; setRecording(false);
        if (audioChunks.current.length) transcribeRecording(new Blob(audioChunks.current, { type: mediaRecorder.mimeType || 'audio/webm' }));
      };
      mediaRecorder.start(); recorder.current = mediaRecorder; setRecording(true); setNotice('Recording. Tap the microphone again when you are finished.');
    } catch { setNotice('Microphone permission was not granted. Allow it in your browser settings and try again.'); }
  };

  const savePractice = async assessment => {
    if (!token) return;
    await fetch(`${API}/api/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify({ scenario_id: active.id, level, conversation: messages, assessment }) });
    await loadDashboard();
  };

  const assess = async () => {
    setGrading(true); setNotice('');
    try {
      const response = await fetch(`${API}/api/assess`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: active.id, conversation: messages, level }) });
      if (!response.ok) throw new Error();
      const data = await response.json(); setReport(data); setView('assessment'); savePractice(data);
      if (data.overall_score >= 75) confetti({ particleCount: 70, spread: 55, origin: { y: .58 }, colors: ['#f0785a', '#f3eadf', '#9bb3c8'] });
    } catch { setNotice('We could not create your assessment. Check the backend and try again.'); }
    finally { setGrading(false); }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch(`${API}/api/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groq_api_key: key || undefined, colab_backend_url: colab || undefined }) });
      if (!response.ok) throw new Error(); setSettingsOpen(false); setNotice('Settings saved for this session.');
    } catch { setNotice('We could not save those settings. Check the backend.'); }
  };

  if (!authReady) return <div className="app-loader">Loading your practice space…</div>;
  if (!user) return <div className="app-shell auth-shell"><header className="top-nav"><div className="brand"><img src="/logo.png" alt="CYPHER Logo" className="brand-logo" />CYPHER</div></header><AuthScreen onSubmit={signIn} busy={authBusy} error={authError} /></div>;
  const shown = filter === 'All' ? scenarios : scenarios.filter(item => item.category === filter);
  const online = health?.status === 'online';

  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a><header className="top-nav"><button className="brand" onClick={() => setView('stage')} aria-label="Return to practice"><img src="/logo.png" alt="CYPHER Logo" className="brand-logo" />CYPHER</button><nav><button className={view === 'stage' ? 'active' : ''} onClick={() => setView('stage')}>Practice</button><button className={view === 'dashboard' || view === 'assessment' ? 'active' : ''} onClick={() => setView('dashboard')}>Your panel</button></nav><div className="nav-tools"><span className={online ? 'status online' : 'status'}><i />{online ? 'Ready' : 'Demo mode'}</span><button className="user-button" onClick={() => setView('dashboard')}><UserRound size={16} />{user.display_name}</button><button className="round-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings"><Settings size={19} /></button></div></header>{notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
    <main id="main-content">
      {view === 'stage' && <section className="stage"><div className="intro"><p className="eyebrow">Practice rooms</p><h1>Speak like you mean it.</h1><p>Pick a room. We will handle the pressure.</p><div className="filters">{categories.map(item => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="scenario-grid">{shown.map((item, index) => <Scenario key={item.id} item={item} index={index} choose={chooseScenario} />)}</div></section>}
      {view === 'booth' && active && <section className="booth"><div className="conversation"><header className="conversation-head"><button className="back" onClick={() => setView('stage')}><ArrowLeft size={17} />Back</button><div><p>Live practice · {level}</p><h1>{active.title}</h1><span>{active.partner_name} · {active.partner_role}</span></div><button className="voice" onClick={() => setVoiceOn(value => !value)}>{voiceOn ? <Volume2 size={18} /> : <VolumeX size={18} />}Voice {voiceOn ? 'on' : 'off'}</button></header><div className="stream" aria-live="polite">{messages.map((item, index) => <article className={`message ${item.role}`} key={`${item.role}-${index}`}><span className="avatar">{item.role === 'assistant' ? active.partner_name.charAt(0) : 'Y'}</span><div><p>{item.role === 'assistant' ? active.partner_name : 'You'}</p><div>{item.content}</div>{item.role === 'assistant' && <button onClick={() => play(item.content)}><Volume2 size={14} />Listen again</button>}</div></article>)}{replying && <article className="message assistant pending"><span className="avatar">{active.partner_name.charAt(0)}</span><div><p>{active.partner_name}</p><div>Thinking of the next question<span className="dots">...</span></div></div></article>}<div ref={end} /></div><form className={`composer ${recording ? 'recording' : ''}`} onSubmit={send}><button type="button" onClick={toggleMic} disabled={transcribing || replying} className="mic" aria-label={recording ? 'Stop recording' : 'Start recording'}>{recording ? <MicOff size={20} /> : <Mic size={20} />}</button><input value={text} onChange={event => setText(event.target.value)} disabled={recording || transcribing} placeholder={recording ? 'Recording your answer…' : transcribing ? 'Turning your voice into text…' : 'Type your answer here'} aria-label="Your answer" autoComplete="off" /><button className="send" disabled={!text.trim() || replying || recording || transcribing} aria-label="Send"><Send size={19} /></button>{recording && <small><i />Recording — tap mic to send</small>}</form></div><aside className="coach"><div className="coach-title"><Sparkles size={20} /><div><p>Your AI coach</p><h2>Find the sharper answer.</h2></div></div><button onClick={() => setText('The turning point was...')}><Lightbulb size={19} /><span><strong>Try a precise transition</strong><small>For example, the turning point was...</small></span><ChevronRight size={18} /></button><button onClick={() => setText('What I learned from that was...')}><BookOpen size={19} /><span><strong>Highlight what you learned</strong><small>Make the takeaway specific.</small></span><ChevronRight size={18} /></button><div /><button className="primary" onClick={assess} disabled={grading || messages.length < 2}>{grading ? 'Reading your session...' : 'Finish & get feedback'}<ArrowUpRight size={18} /></button></aside></section>}
      {view === 'dashboard' && <section className="dashboard"><header className="dashboard-head"><div><p className="eyebrow">{user.display_name}'s practice space</p><h1>Your speaking history.</h1><p>Every completed practice is kept here, with its level and score.</p></div><div className="session-count"><small>Completed rooms</small><strong>{dashboard?.session_count || 0}</strong></div></header>{dashboard?.sessions?.length ? <div className="history-list">{dashboard.sessions.map(session => <article key={session.id}><div><p>{session.scenario_id.replaceAll('_', ' ')}</p><span>{session.level} · {new Date(session.created_at).toLocaleDateString()}</span></div><strong>{session.assessment?.overall_score ?? '—'}<small>{session.assessment ? '/100' : 'Awaiting score'}</small></strong></article>)}</div> : <section className="empty-panel"><Sparkles size={26} /><h2>Your first room is waiting.</h2><p>Choose a situation, practise by voice or text, then finish it to see your progress here.</p><button className="primary" onClick={() => setView('stage')}>Find a practice room<ArrowUpRight size={17} /></button></section>}<button className="sign-out" onClick={signOut}><LogOut size={16} />Sign out</button></section>}
      {view === 'assessment' && report && <section className="assessment"><button className="back" onClick={() => setView('dashboard')}><ArrowLeft size={17} />Back to your panel</button><header className="assessment-head"><div><p className="eyebrow">Your speaking snapshot · {level}</p><h1>{report.cefr_label || 'A clear picture of your speaking'}</h1><p>{report.summary}</p></div><div className="score"><div><small>CEFR</small><b>{report.cefr_level}</b></div><div><small>Your score</small><strong>{report.overall_score}</strong><span>/100</span></div></div></header><section className="skills">{Object.entries(report.pillars || {}).map(([name, value]) => <div key={name}><section><b>{name.replace(/_/g, ' ')}</b><p>{value.feedback}</p></section><aside><i style={{ '--score': `${value.score}%` }} /><b>{value.score}</b><small>/100</small></aside></div>)}</section><div className="feedback"><section><i><Check size={20} /></i><h2>What landed</h2><ul>{(report.strengths || []).map(item => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul></section><section><i><ArrowUpRight size={20} /></i><h2>Try next</h2><ul>{(report.actionable_drills || []).map(item => <li key={item}><span />{item}</li>)}</ul></section></div><section className="corrections"><p className="eyebrow">Corrections from your response</p><h2>Small changes, clearer English.</h2>{report.corrections?.length ? report.corrections.map((item, index) => <article key={index}><div><small>You said</small><p>{item.original}</p></div><ChevronRight size={19} /><div><small>Try instead</small><p>{item.improved}</p></div><em>{item.explanation}</em></article>) : <p className="empty">No major corrections were found. Keep building range through longer answers.</p>}</section><button className="primary again" onClick={() => setView('stage')}>Practice again<ArrowUpRight size={18} /></button></section>}
    </main>
    {pendingScenario && <div className="modal" onMouseDown={() => setPendingScenario(null)}><section className="level-picker" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><p className="eyebrow">{pendingScenario.category} practice</p><h2>Choose your challenge.</h2><p>Start at the level that feels right today. Your partner will adapt the vocabulary, pace, and questions.</p><div>{levels.map(item => <button key={item} className={level === item ? 'selected' : ''} onClick={() => setLevel(item)}><strong>{item}</strong><span>{item === 'Beginner' ? 'Short prompts and useful support.' : item === 'Intermediate' ? 'Natural back-and-forth conversation.' : 'Nuanced questions and precise feedback.'}</span></button>)}</div><footer><button className="secondary" onClick={() => setPendingScenario(null)}>Cancel</button><button className="primary" onClick={start}>Start {level}<ArrowUpRight size={17} /></button></footer></section></div>}
    {settingsOpen && <div className="modal" onMouseDown={() => setSettingsOpen(false)}><section role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><header><div><p className="eyebrow">Connection</p><h2>Practice settings</h2></div><button className="round-button" onClick={() => setSettingsOpen(false)}>×</button></header><label>Groq API key<input type="password" value={key} placeholder="gsk_..." onChange={event => setKey(event.target.value)} /></label><label>Google Colab URL<input type="url" value={colab} placeholder="https://your-tunnel.trycloudflare.com" onChange={event => setColab(event.target.value)} /></label><label>Voice persona<select value={voice} onChange={event => setVoice(event.target.value)}><option value="en-US-GuyNeural">US English - male</option><option value="en-US-AriaNeural">US English - female</option><option value="en-GB-RyanNeural">British English - male</option><option value="en-GB-SoniaNeural">British English - female</option></select></label><footer><button className="secondary" onClick={() => setSettingsOpen(false)}>Cancel</button><button className="primary" onClick={saveSettings}>Save settings<ArrowUpRight size={17} /></button></footer></section></div>}
  </div>;
}
