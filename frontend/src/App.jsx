import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PartnerPresence, PracticeStage, ProgressPanel, StudioAuth, StudioDialog } from './Studio.jsx';
import { partnerPortraits, roomImages } from './rooms.js';
import { ArrowLeft, ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronRight, Lightbulb, Mic, MicOff, Settings, Sparkles, Volume2, VolumeX, Sun, Moon, AudioLines } from 'lucide-react';
import confetti from 'canvas-confetti';

const API = 'http://127.0.0.1:8000';
const levels = ['Beginner', 'Intermediate', 'Advanced'];
const fallback = [
  { id: 'tech_interview', title: 'Software engineer interview', category: 'Career', difficulty: 'Mid to senior', partner_name: 'Sarah Chen', partner_role: 'Engineering manager', initial_message: 'Hello. Thanks for taking the time to speak today. Could you briefly introduce yourself and share a technical project you recently worked on?' },
  { id: 'general_job_interview', title: 'Behavioral interview', category: 'Career', difficulty: 'Intermediate', partner_name: 'David Miller', partner_role: 'Head of talent', initial_message: 'Good morning. Great to meet you. Tell me about yourself and what motivated you to apply for this position?' },
  { id: 'university_presentation', title: 'University defense', category: 'Education', difficulty: 'Advanced', partner_name: 'Prof. Julian Vance', partner_role: 'Academic advisor', initial_message: 'Welcome to today’s seminar. What primary question or hypothesis are you exploring in your recent research?' },
  { id: 'school_interaction', title: 'College office', category: 'Education', difficulty: 'Beginner to intermediate', partner_name: 'Emma Wright', partner_role: 'Student advisor', initial_message: 'Hi there. Welcome to student services. How can I help with your schedule or classes?' },
  { id: 'casual_coffee_hangout', title: 'Coffee chat', category: 'Daily Life', difficulty: 'Conversational', partner_name: 'Jordan', partner_role: 'Local friend', initial_message: 'Hey, mind if I borrow this chair? By the way, what drink did you get? It looks great.' },
  { id: 'salary_negotiation', title: 'Offer negotiation', category: 'Business', difficulty: 'Advanced', partner_name: 'Arthur Sterling', partner_role: 'Managing director', initial_message: 'We were impressed with your interviews. We’d like to extend an offer at $65,000 per year with benefits. What are your thoughts?' },
];
const sessionRules = { Beginner: { questions: 9 }, Intermediate: { questions: 12 }, Advanced: { questions: 15 } };
const voiceOptions = [{ value: 'en-US-GuyNeural', label: 'Male · US' }, { value: 'en-US-AriaNeural', label: 'Female · US' }, { value: 'en-GB-RyanNeural', label: 'Male · UK' }, { value: 'en-GB-SoniaNeural', label: 'Female · UK' }];

export default function App() {
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState('stage');
  const [theme, setTheme] = useState(() => localStorage.getItem('cypher-theme') || 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('cypher-theme', theme);
  }, [theme]);
  const [scenarios, setScenarios] = useState(fallback);
  const [active, setActive] = useState(null);
  const [pendingScenario, setPendingScenario] = useState(null);
  const [level, setLevel] = useState('Intermediate');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [grading, setGrading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voice, setVoice] = useState(() => localStorage.getItem('cypher-voice') || 'en-US-GuyNeural');
  const [speakingId, setSpeakingId] = useState(null);
  const [pressure, setPressure] = useState(12);
  const [responseSignal, setResponseSignal] = useState('The conversation starts calm. Your answers will shape the pressure.');
  const [completedQuestions, setCompletedQuestions] = useState(0);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [conversationComplete, setConversationComplete] = useState(false);
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
  const playbackRequest = useRef(0);
  const end = useRef(null);


  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const loadDashboard = useCallback(async () => {
    if (!token) return;
    const response = await fetch(`${API}/api/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setDashboard(await response.json());
  }, [token]);

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
        const response = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error();
        setUser(await response.json());
        await loadDashboard();
      } catch {
        localStorage.removeItem('cypher-token');
        setToken('');
      } finally { setAuthReady(true); }
    };
    restoreUser();
  }, [token, loadDashboard]);

  useEffect(() => {
    // Some browsers return a Promise from smooth scrolling. Effects must only
    // return a cleanup function, otherwise React unmounts the entire app.
    const stream = end.current?.closest('.stream');
    stream?.scrollTo({ top: stream.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [messages, replying]);
  useEffect(() => { localStorage.setItem('cypher-voice', voice); }, [voice]);
  useEffect(() => () => {
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    recordingStream.current?.getTracks().forEach(track => track.stop());
  }, []);

  const stopPlayback = () => {
    playbackRequest.current += 1;
    player.current.pause(); player.current.currentTime = 0;
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
  };
  const navigate = nextView => {
    stopPlayback();
    if (recorder.current?.state === 'recording') {
      recorder.current.onstop = null;
      recorder.current.stop();
    }
    recordingStream.current?.getTracks().forEach(track => track.stop());
    setRecording(false);
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const changeVoice = value => { stopPlayback(); setVoice(value); };
  const play = (value, id) => {
    if (speakingId === id) { stopPlayback(); return; }
    stopPlayback();
    const requestId = playbackRequest.current + 1;
    playbackRequest.current = requestId;
    setSpeakingId(id);
    fetch(`${API}/api/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: value, voice }) })
      .then(response => { if (!response.ok) throw new Error(); return response.blob(); })
      .then(blob => {
        if (requestId !== playbackRequest.current) return;
        if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
        audioUrl.current = URL.createObjectURL(blob); player.current.src = audioUrl.current;
        player.current.onended = () => { if (requestId === playbackRequest.current) setSpeakingId(null); };
        player.current.play().catch(() => setSpeakingId(null));
      })
      .catch(() => {
        if (requestId !== playbackRequest.current || !('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(value);
        const female = voice.includes('Aria') || voice.includes('Sonia');
        utterance.voice = window.speechSynthesis.getVoices().find(item => female ? /female|aria|sonia|zira/i.test(item.name) : /male|guy|ryan|david/i.test(item.name)) || null;
        utterance.onend = () => { if (requestId === playbackRequest.current) setSpeakingId(null); };
        window.speechSynthesis.speak(utterance);
      });
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

  const signOut = () => { localStorage.removeItem('cypher-token'); setToken(''); setUser(null); setDashboard(null); navigate('stage'); };
  const chooseScenario = item => { setPendingScenario(item); setLevel('Intermediate'); };
  const start = () => {
    if (!pendingScenario) return;
    setActive(pendingScenario); setMessages([{ role: 'assistant', content: pendingScenario.initial_message }]); setReport(null); setPressure(12); setResponseSignal('The conversation starts calm. Your answers will shape the pressure.'); setCompletedQuestions(0); setAttemptsUsed(0); setConversationComplete(false); setNotice(''); setPendingScenario(null); navigate('booth');
  };

  const sendText = async value => {
    if (!value || replying || !active || conversationComplete) return;
    const next = [...messages, { role: 'user', content: value }];
    const questionNumber = completedQuestions + 1;
    const attemptNumber = attemptsUsed + 1;
    setMessages(next); setText(''); setReplying(true); setNotice('');
    try {
      const response = await fetch(`${API}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: active.id, messages: next, voice, level, pressure, question_number: questionNumber, total_questions: sessionRules[level].questions, attempt_number: attemptNumber, max_attempts: 3 }) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      const nextPressure = Math.max(0, Math.min(100, pressure + Number(data.pressure_delta || 0)));
      setPressure(nextPressure);
      setResponseSignal(data.response_signal || 'The answer was reviewed.');
      const reply = data.reply || 'Could you say a little more about the action you took?';
      setMessages([...next, { role: 'assistant', content: reply }]);
      if (data.next_action === 'retry') {
        setAttemptsUsed(attemptNumber);
        setNotice(`Same question .  attempt ${attemptNumber} of 3. The AI gave you a hint, so try again.`);
      } else {
        setCompletedQuestions(questionNumber);
        setAttemptsUsed(0);
        if (data.next_action === 'complete') { setConversationComplete(true); setNotice('Final question complete. Open your feedback to see the score for this session.'); }
        else if (data.answer_status === 'skip') setNotice('Question skipped. The conversation moved to the next question.');
      }
      if (voiceOn) play(reply, 'auto-reply');
    } catch {
      const fallbackReply = 'That is a useful starting point. What was the most important decision you made in that situation?';
      setMessages([...next, { role: 'assistant', content: fallbackReply }]);
      setResponseSignal('The response could not be analyzed, so pressure stayed the same.');
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
      const data = await response.json(); setReport(data); navigate('assessment'); savePractice(data);
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

  const toggleTheme = () => setTheme(current => current === 'dark' ? 'light' : 'dark');
  const themeControl = <button className="round-button theme-control" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Use light appearance' : 'Use dark appearance'}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>;
  if (!authReady) return <div className="app-loader"><AudioLines size={38} /><span>Opening your studio</span><div className="loading-line" /></div>;
  if (!user) return <div className="app-shell auth-shell"><header className="top-nav auth-nav"><div className="brand"><img src="/logo.png" alt="" className="brand-logo" />CYPHER<span className="brand-descriptor">Conversation studio</span></div><div className="nav-tools">{themeControl}</div></header><StudioAuth onSubmit={signIn} busy={authBusy} error={authError} /></div>;
  const online = health?.status === 'online';
  const rules = sessionRules[level];
  const pressureLabel = pressure >= 75 ? 'Under pressure' : pressure >= 40 ? 'Getting tense' : 'At ease';
  const openSavedReport = session => { setReport(session.assessment); setLevel(session.level); navigate('assessment'); window.scrollTo({ top: 0 }); };

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="top-nav">
      <button className="brand" onClick={() => navigate('stage')} aria-label="Return to practice"><img src="/logo.png" alt="" className="brand-logo" />CYPHER<span className="brand-descriptor">Conversation studio</span></button>
      <nav aria-label="Main navigation"><button className={view === 'stage' || view === 'booth' ? 'active' : ''} aria-current={view === 'stage' || view === 'booth' ? 'page' : undefined} onClick={() => navigate('stage')}>{(view === 'stage' || view === 'booth') && <motion.span className="nav-active-pill" layoutId="main-nav-pill" transition={{ type: 'spring', bounce: 0, duration: reduceMotion ? 0.01 : 0.38 }} />}<span className="nav-label">Practice</span></button><button className={view === 'dashboard' || view === 'assessment' ? 'active' : ''} aria-current={view === 'dashboard' || view === 'assessment' ? 'page' : undefined} onClick={() => navigate('dashboard')}>{(view === 'dashboard' || view === 'assessment') && <motion.span className="nav-active-pill" layoutId="main-nav-pill" transition={{ type: 'spring', bounce: 0, duration: reduceMotion ? 0.01 : 0.38 }} />}<span className="nav-label">Your panel</span></button></nav>
      <div className="nav-tools"><span className={online ? 'status online' : 'status'}><i />{online ? 'Connected' : 'Offline'}</span>{themeControl}<button className="round-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings"><Settings size={18} /></button><button className="user-button" onClick={() => navigate('dashboard')} aria-label={`Open ${user.display_name}'s panel`}><span>{user.display_name.charAt(0).toUpperCase()}</span><b>{user.display_name}</b></button></div>
    </header>
    <AnimatePresence>{notice && <motion.div className="notice" role="status" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14, x: '-50%', scale: 0.98 }} animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, x: '-50%', scale: 0.98 }} transition={reduceMotion ? { duration: 0.12 } : { type: 'spring', bounce: 0, duration: 0.34 }}><AudioLines size={17} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></motion.div>}</AnimatePresence>
    <main id="main-content">
      {view === 'stage' && <PracticeStage scenarios={scenarios} choose={chooseScenario} />}
      {view === 'booth' && active && <section className="booth">
        <div className="conversation">
          <header className="conversation-head"><button className="back" onClick={() => { stopPlayback(); navigate('stage'); }} aria-label="Back to practice rooms"><ArrowLeft size={19} /></button><div><p>{active.category} practice <span>{level}</span></p><h1>{active.title}</h1></div><div className="voice-tools"><label className="voice-select">Partner voice<select value={voice} onChange={event => changeVoice(event.target.value)}>{voiceOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><button className={`voice ${voiceOn ? 'enabled' : ''}`} aria-pressed={voiceOn} onClick={() => { if (voiceOn) stopPlayback(); setVoiceOn(value => !value); }}>{voiceOn ? <Volume2 size={18} /> : <VolumeX size={18} />}<span>Auto voice {voiceOn ? 'on' : 'off'}</span></button></div></header>
          <section className={`session-meter ${conversationComplete ? 'complete' : ''}`}><div><span>Question <b>{Math.min(completedQuestions + 1, rules.questions)}</b><span className="meter-muted"> / {rules.questions}</span></span><span>{conversationComplete ? 'Session complete' : `Attempt ${attemptsUsed + 1} of 3`}</span></div><div className="question-segments" aria-label={`${completedQuestions} of ${rules.questions} questions complete`}>{Array.from({length: rules.questions}, (_, index) => <i key={index} className={index < completedQuestions ? 'filled' : index === completedQuestions ? 'current' : ''} />)}</div></section>
          <div className="stream" aria-live="polite"><AnimatePresence initial={false}>{messages.map((item, index) => { const messageId = `${item.role}-${index}`; return <motion.article layout={!reduceMotion} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0.12 } : { type: 'spring', bounce: 0, duration: 0.36 }} className={`message ${item.role}`} key={messageId}><span className="avatar">{item.role === 'assistant' ? <AudioLines size={17} /> : user.display_name.charAt(0)}</span><div><p>{item.role === 'assistant' ? active.partner_name : 'You'}<span>{item.role === 'assistant' ? 'AI partner' : ''}</span></p><div>{item.content}</div>{item.role === 'assistant' && <button className={speakingId === messageId ? 'is-playing' : ''} onClick={() => play(item.content, messageId)}>{speakingId === messageId ? <VolumeX size={14} /> : <Volume2 size={14} />}{speakingId === messageId ? 'Stop listening' : 'Listen again'}</button>}</div></motion.article>; })}{replying && <motion.article key="replying" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="message assistant pending"><span className="avatar"><AudioLines size={17} /></span><div><p>{active.partner_name}</p><div className="thinking-dots" aria-label="Preparing a reply"><i /><i /><i /></div></div></motion.article>}</AnimatePresence><div ref={end} /></div>
          <div className="composer-area"><form className={`composer ${recording ? 'recording' : ''}`} onSubmit={send}><button type="button" onClick={() => { stopPlayback(); toggleMic(); }} disabled={transcribing || replying || conversationComplete} className="mic" aria-label={recording ? 'Stop recording' : 'Start recording'}>{recording ? <MicOff size={21} /> : <Mic size={21} />}</button><input value={text} onChange={event => setText(event.target.value)} disabled={recording || transcribing || conversationComplete} placeholder={conversationComplete ? 'Your session is complete. Time to reflect.' : recording ? 'Recording... tap the mic to send' : transcribing ? 'Turning your voice into text...' : 'Your thoughts, in your own words...'} aria-label="Your answer" autoComplete="off" /><button className="send" disabled={!text.trim() || replying || recording || transcribing || conversationComplete} aria-label="Send answer"><ArrowUpRight size={21} /></button></form><p className="composer-caption">{recording ? 'Microphone is recording. Tap again to stop and send.' : 'Speak naturally or type your answer. Take your time.'}<span>Enter to send</span></p></div>
        </div>
        <aside className="coach">
          <PartnerPresence active={active} pressure={pressure} speaking={speakingId !== null} replying={replying} recording={recording} complete={conversationComplete} />
          <section className="pressure-feedback"><span className="eyebrow">{pressureLabel}</span><p>{responseSignal}</p></section>
          <div className="coach-title"><Sparkles size={17} /><h2>A little help, if you need it.</h2></div><button className="coach-hint" onClick={() => setText('The turning point was...')} disabled={conversationComplete}><Lightbulb size={18} /><span><strong>Find a starting point</strong><small>“The turning point was...”</small></span><ChevronRight size={16} /></button><button className="coach-hint" onClick={() => setText('What I learned from that was...')} disabled={conversationComplete}><BookOpen size={18} /><span><strong>Share a takeaway</strong><small>“What I learned was...”</small></span><ChevronRight size={16} /></button>
          <div className="coach-finish"><button className="primary" onClick={() => { stopPlayback(); assess(); }} disabled={grading || replying || recording || transcribing || messages.length < 2}>{grading ? 'Preparing your report...' : conversationComplete ? 'View your speaking report' : 'Finish & get feedback'}<ArrowUpRight size={18} /></button><p>Your feedback is saved to your panel.</p></div>
        </aside>
      </section>}
      {view === 'dashboard' && <ProgressPanel user={user} dashboard={dashboard} scenarios={scenarios} practice={() => navigate('stage')} signOut={signOut} openReport={openSavedReport} />}
      {view === 'assessment' && report && <section className="assessment"><button className="back" onClick={() => navigate('dashboard')}><ArrowLeft size={17} />Back to your panel</button><header className="assessment-head"><div><p className="eyebrow">Your speaking snapshot · {level}</p><h1>{report.cefr_label || 'A clear picture of your speaking'}</h1><p>{report.summary}</p></div><div className="score"><div><small>CEFR</small><b>{report.cefr_level}</b></div><div><small>Your score</small><strong>{report.overall_score}</strong><span>/100</span></div></div></header><section className="skills">{Object.entries(report.pillars || {}).map(([name, value]) => <div key={name}><section><b>{name.replace(/_/g, ' ')}</b><p>{value.feedback}</p></section><aside><i style={{ '--score': `${value.score}%` }} /><b>{value.score}</b><small>/100</small></aside></div>)}</section><div className="feedback"><section><i><Check size={20} /></i><h2>What landed</h2><ul>{(report.strengths || []).map(item => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul></section><section><i><ArrowUpRight size={20} /></i><h2>Try next</h2><ul>{(report.actionable_drills || []).map(item => <li key={item}><span />{item}</li>)}</ul></section></div><section className="corrections"><p className="eyebrow">Corrections from your response</p><h2>Small changes, clearer English.</h2>{report.corrections?.length ? report.corrections.map((item, index) => <article key={index}><div><small>You said</small><p>{item.original}</p></div><ChevronRight size={19} /><div><small>Try instead</small><p>{item.improved}</p></div><em>{item.explanation}</em></article>) : <p className="empty">No major corrections were found. Keep building range through longer answers.</p>}</section><button className="primary again" onClick={() => navigate('stage')}>Practice again<ArrowUpRight size={18} /></button></section>}
    </main>
    <AnimatePresence>{pendingScenario && <StudioDialog close={() => setPendingScenario(null)} title="Choose your practice level" className="level-picker"><div className="level-room-image" style={{ backgroundImage: `url(${partnerPortraits[pendingScenario.id] || roomImages[pendingScenario.id] || roomImages.tech_interview})` }} /><div className="level-body"><span className="eyebrow">{pendingScenario.category} practice</span><h2>Find your<br /><span>comfort zone.</span></h2><p>Choose your level. Your partner will meet you there.</p><div className="level-options">{levels.map((item, index) => <button key={item} aria-pressed={level === item} className={level === item ? 'selected' : ''} onClick={() => setLevel(item)}><span className="level-bars">{[0, 1, 2].map(bar => <i key={bar} className={bar <= index ? 'filled' : ''} />)}</span><span><strong>{item}</strong><small>{item === 'Beginner' ? 'A helping hand to get you talking.' : item === 'Intermediate' ? 'Keep it natural. Go a little deeper.' : 'Nuance, precision, and a real challenge.'}</small></span><span className="level-count">{sessionRules[item].questions} questions</span><span className="level-check">{level === item && <Check size={13} />}</span></button>)}</div><p className="level-reassurance"><Mic size={14} />Voice or text. Up to 3 attempts per question. No timer.</p><footer><button className="primary" onClick={start}>Enter the conversation<ArrowUpRight size={18} /></button></footer></div></StudioDialog>}</AnimatePresence>
    <AnimatePresence>{settingsOpen && <StudioDialog close={() => setSettingsOpen(false)} title="Practice settings" className="settings-dialog"><span className="section-kicker"><Settings size={17} /> Make yourself comfortable</span><h2>Practice settings</h2><label>Partner voice<select value={voice} onChange={event => changeVoice(event.target.value)}>{voiceOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><p className="field-help">Your voice choice saves automatically.</p><details className="connection-settings"><summary>Connection settings<ChevronRight size={16} /></summary><label>Groq API key<input type="password" value={key} placeholder="gsk_..." onChange={event => setKey(event.target.value)} /></label><label>Google Colab URL<input type="url" value={colab} placeholder="https://your-backend.example.com" onChange={event => setColab(event.target.value)} /></label></details><footer><button className="secondary" onClick={() => setSettingsOpen(false)}>Close</button><button className="primary" onClick={saveSettings}>Save settings<Check size={17} /></button></footer></StudioDialog>}</AnimatePresence>
  </div>;
}
