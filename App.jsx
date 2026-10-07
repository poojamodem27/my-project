import { useState, useEffect, useRef } from 'react';
import soundFx from './soundEngine';
import ThreeUIBackground from './ThreeUIBackground';
import ElectricLogoCanvas from './ElectricLogoCanvas';
import GlassmorphismCTA from './GlassmorphismCTA';
import ThreeAudioVisualizer from './ThreeAudioVisualizer';
import ThemeToggle from './ThemeToggle';
import { useTheme } from './ThemeContext';
import { PALETTE } from './palette';

const WORKFLOW_STEPS = [
  { id: 'landing', num: 1, label: '1. Landing', title: 'Landing Page', actionHint: 'Click "Login to Student Account" or "Start Learning" to advance.', color: 'rgb(var(--c00f076))' },
  { id: 'auth', num: 2, label: '2. Login', title: 'Student Sign In', actionHint: 'Review your credentials and click "Confirm & Enter Dashboard".', color: 'rgb(var(--cffaa00))' },
  { id: 'dashboard', num: 3, label: '3. Dashboard', title: 'Student Dashboard', actionHint: 'Review your stats and click "Start New Lecture Session +".', color: 'rgb(var(--c00f076))' },
  { id: 'create-lecture', num: 4, label: '4. Setup', title: 'Session Setup', actionHint: 'Pick your audio channel (YouTube/Mic) and click "Launch Live 3D Session".', color: 'rgb(var(--cffaa00))' },
  { id: 'live-recording', num: 5, label: '5. Live 3D', title: 'Live Recording Hub', actionHint: 'Use Start/Pause/Stop and MARK IMPORTANT, then click Stop to proceed.', color: 'rgb(var(--cf43f5e))' },
  { id: 'generated-notes', num: 6, label: '6. AI Notes', title: 'Synthesized Notes', actionHint: 'Review textbook notes created by AI, then click "Open Document Editor".', color: 'rgb(var(--c00f076))' },
  { id: 'edit-notes', num: 7, label: '7. Editor', title: 'Note Editor', actionHint: 'Format notes and click "Save & Add to Lecture Archive".', color: 'rgb(var(--cffaa00))' },
  { id: 'my-lectures', num: 8, label: '8. Library', title: 'Lecture Archive', actionHint: 'Browse all recorded lectures, then click "Proceed to Keyword Revision".', color: 'rgb(var(--c00f076))' },
  { id: 'revision', num: 9, label: '9. Revision', title: 'Keyword Search', actionHint: 'Search any concept to jump directly to timestamps. Flow is complete!', color: 'rgb(var(--cffaa00))' },
];

// --- Main NoteTap 3D Application Component ---
function App() {
  const { theme } = useTheme();
  const logoColor = PALETTE[theme].primary;
  const logoGlow = PALETTE[theme].secondary;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(1390); // 00:23:10
  const [activeCategory, setActiveCategory] = useState('Important');
  const [audioChannel, setAudioChannel] = useState('YouTube Tab');
  const [soundMuted, setSoundMuted] = useState(false);
  const [notesText, setNotesText] = useState(`# DBMS: Database Normalization Notes\nCourse: B.Tech CSE | Student: Pooja\n\n## 1. Overview\nDatabase normalization minimizes duplicate data and prevents anomalies:\n- Insertion Anomaly\n- Deletion Anomaly\n- Update Anomaly\n\n## 2. Normal Forms Hierarchy\n1. 1NF: Atomic values only. No repeating columns.\n2. 2NF: 1NF + No partial dependency (non-prime on part of candidate key).\n3. 3NF: 2NF + No transitive dependency (non-prime on another non-prime).\n4. BCNF: For every functional dependency X -> Y, X must be a super key.`);
  
  const [markedPoints, setMarkedPoints] = useState([
    { id: 1, time: '00:08:32', type: 'Definition', text: 'Normalization is the process of organizing data in tables to reduce redundancy.' },
    { id: 2, time: '00:15:48', type: 'Concept', text: 'A table is in 2NF if it has no partial dependency on candidate keys.' },
    { id: 3, time: '00:23:10', type: 'Important', text: 'Third Normal Form (3NF) eliminates transitive functional dependencies.' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto timer during live recording
  useEffect(() => {
    let interval;
    if (currentStepIndex === 4 && isLiveActive && !isPaused) { // Live recording step
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStepIndex, isLiveActive, isPaused]);

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentStep = WORKFLOW_STEPS[currentStepIndex];
  const currentPage = currentStep.id;

  // Sequential navigation handlers
  const goToStep = (index) => {
    window.dispatchEvent(new CustomEvent('notetap-pulse', { detail: 0.7 }));
    soundFx.playTap();
    setCurrentStepIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => {
    if (currentStepIndex < WORKFLOW_STEPS.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      goToStep(0); // Loop back to landing
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  // Recording Control Handlers
  const handleTogglePause = () => {
    soundFx.playTap();
    setIsPaused(prev => !prev);
  };

  const handleStartOrResume = () => {
    soundFx.playTap();
    setIsLiveActive(true);
    setIsPaused(false);
  };

  const handleStopRecording = () => {
    soundFx.playMark();
    setIsLiveActive(false);
    setIsPaused(false);
    // Automatically advances to Step 6: AI Synthesized Notes!
    nextStep();
  };

  const handleAddMark = () => {
    soundFx.playMark();
    const newPt = {
      id: Date.now(),
      time: formatTime(recordingSeconds),
      type: activeCategory,
      text: `Marked [${activeCategory}] at ${formatTime(recordingSeconds)}: Crucial exam point captured by student.`
    };
    setMarkedPoints(prev => [newPt, ...prev]);
  };

  const toggleSound = () => {
    soundFx.enabled = soundMuted;
    setSoundMuted(!soundMuted);
    if (soundMuted) soundFx.playTap();
  };

  return (
    <div className="min-h-screen bg-transparent text-cded8c7 flex flex-col font-sans relative pb-10 selection:bg-cffaa00/30 selection:text-cffaa00">
      
      {/* ThreeUI Spatial Starfield Background */}
      <ThreeUIBackground />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-c233328 bg-c0a0e0c/70 backdrop-blur-xl px-4 sm:px-8 h-16 flex items-center justify-between">
        <div
          aria-hidden="true"
          className="absolute left-0 bottom-0 h-[2px] bg-gradient-to-r from-c00f076 to-cffaa00 transition-all duration-700"
          style={{ width: `${((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100}%` }}
        />
        
        {/* Left: Electric Logo Brand */}
        <div onClick={() => goToStep(0)} className="flex items-center gap-3 cursor-pointer group select-none">
          <div className="w-11 h-11 rounded-xl bg-c0b130e border border-c00f076/50 flex items-center justify-center shadow-soft group-hover:border-cffaa00/80 group-hover:shadow-soft transition-all duration-300 overflow-hidden relative">
            <ElectricLogoCanvas size={44} color={logoColor} glowColor={logoGlow} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-ce8e4d8">Note<span className="text-cffaa00">Tap</span></span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-c1b2620 text-c00f076 border border-c00f076/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-c00f076 animate-pulse" />
                <span>3D ELECTRIC</span>
              </span>
            </div>
            <span className="text-[10px] text-c7a8f7e -mt-1 hidden sm:block">Acoustic WebGL Engine</span>
          </div>
        </div>

        {/* Right: Sound Toggle + Prominent Login / Next Step Button */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            onClick={toggleSound}
            title={soundMuted ? "Unmute Audio" : "Mute Audio"}
            className="w-9 h-9 rounded-lg bg-c141c17 border border-c26372b hover:border-cffaa00/50 text-c8fa392 hover:text-cffaa00 flex items-center justify-center transition-all cursor-pointer text-xs"
          >
            {soundMuted ? '🔇' : '🔊'}
          </button>

          {/* Header Direct Login Button */}
          <button
            onClick={() => goToStep(1)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-2 ${
              currentStepIndex === 1
                ? 'bg-cffaa00 text-c080d0a border-cffaa00 shadow-soft'
                : 'bg-c15231a text-c00f076 border-c00f076/40 hover:bg-c00f076 hover:text-c080d0a'
            }`}
          >
            <span>👤 Student Login</span>
            <span>&rarr;</span>
          </button>
        </div>
      </header>

      {/* Sequential Order Workflow Progress Banner */}
      <div className="bg-c0c120f/95 border-b border-c203024 px-4 sm:px-8 py-3 sticky top-16 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Step indicator chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto md:flex-1 min-w-0 pb-1 md:pb-0 no-scrollbar">
            {WORKFLOW_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => goToStep(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                  currentStepIndex === idx
                    ? 'bg-c00f076 text-c080d0a font-bold shadow-soft'
                    : idx < currentStepIndex
                    ? 'bg-c142219 text-c00f076 border border-c00f076/40'
                    : 'bg-c101713 text-c718576 hover:text-ce8e4d8 border border-transparent'
                }`}
              >
                <span>{idx + 1}.</span>
                <span>{step.label.split('. ')[1]}</span>
                {idx < currentStepIndex && <span className="text-[10px]">✓</span>}
              </button>
            ))}
          </div>

          {/* Next/Prev Navigation Buttons */}
          <div className="flex items-center justify-between w-full md:w-auto md:shrink-0 whitespace-nowrap gap-3 text-xs font-mono">
            <span className="text-c8e9f92 hidden sm:inline">
              Step {currentStepIndex + 1} of 9: <span className="text-cffaa00 font-bold">{currentStep.title}</span>
            </span>

            <div className="flex items-center gap-2 ml-auto">
              {currentStepIndex > 0 && (
                <button
                  onClick={prevStep}
                  className="px-3 py-1.5 rounded-lg bg-c141f18 border border-c27382d hover:border-c00f076 text-cded8c7 cursor-pointer transition-all flex items-center gap-1"
                >
                  <span>&larr;</span>
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={nextStep}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-c00f076 to-cffaa00 text-c080d0a font-bold cursor-pointer transition-all flex items-center gap-1 shadow-soft hover:scale-105"
              >
                <span>{currentStepIndex < 8 ? `Next: Step ${currentStepIndex + 2}` : 'Restart Tour'}</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Hint Prompt */}
        <div className="max-w-7xl mx-auto mt-1 text-[11px] font-mono text-c7a8f7f flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cffaa00 animate-ping" />
          <span>Flow Guide: {currentStep.actionHint}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PAGE 1: LANDING PAGE                                     */}
      {/* ======================================================== */}
      {currentPage === 'landing' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-c141d18 border border-c00f076/30 text-xs font-mono text-c00f076">
              <span className="w-2 h-2 rounded-full bg-c00f076 animate-pulse" />
              <span>STEP 1: NOTE TAP ACOUSTIC ENGINE</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-4xl sm:text-6xl font-extrabold text-ce8e4d8 leading-[1.1]">
                You listen.
              </h1>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-c00f076 leading-[1.1] drop-shadow-soft">
                You mark.
              </h1>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-cffaa00 leading-[1.1] drop-shadow-soft">
                NoteTap remembers.
              </h1>
            </div>

            <p className="text-base sm:text-lg text-c9caaa0 leading-relaxed">
              Record online lectures and mark important points with a single click. NoteTap converts marked audio into textbook-quality revision notes.
            </p>

            {/* Primary Action Buttons: Directly opens Step 2 (Login) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              
              {/* Dedicated Login Glassmorphism CTA Button */}
              <GlassmorphismCTA
                onClick={() => goToStep(1)}
                title="Login to Student Account"
                subtitle="Proceed to Step 2 (Sign In)"
                shimmerColor="rgba(212, 160, 162, 0.85)"
                glowColor="rgba(212, 160, 162, 0.35)"
              />

              {/* Start Learning CTA Button */}
              <GlassmorphismCTA
                onClick={nextStep}
                title="Start Learning"
                subtitle="Begin 9-Step Sequential Flow"
                shimmerColor="rgba(230, 205, 184, 0.75)"
                glowColor="rgba(230, 205, 184, 0.35)"
              />

              {/* Quick Jump to Step 5 Button */}
              <button
                onClick={() => goToStep(4)}
                className="px-5 py-3 rounded-full bg-c141d18/90 border border-c27382d hover:border-cffaa00/70 text-cded8c7 hover:text-cffaa00 text-xs font-semibold cursor-pointer transition-all shadow-soft"
              >
                Direct Jump to Step 5: Live 3D &rarr;
              </button>
            </div>

            {/* Feature highlight cards */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="p-3.5 rounded-xl bg-c111713/80 border border-c203024">
                <div className="text-c00f076 font-bold text-xs font-mono">⚡ Sub-Second Marking</div>
                <div className="text-[11px] text-c8c9c8e mt-1">One tap acoustic bookmarking with zero lag.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-c111713/80 border border-c203024">
                <div className="text-cffaa00 font-bold text-xs font-mono">📖 AI Textbook Synthesis</div>
                <div className="text-[11px] text-c8c9c8e mt-1">Structured notes generated from marked audio.</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Hologram + Interactive Mark Button Preview */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <ThreeAudioVisualizer size="large" />

            <div className="w-full max-w-md mt-4 rounded-2xl bg-c111713/90 border border-c273a2d p-5 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center pb-3 border-b border-c202d24">
                <span className="font-semibold text-sm text-ce8e4d8">Live Stream: DBMS Normalization</span>
                <span className="text-xs font-mono text-cffaa00 bg-c19241d px-2 py-0.5 rounded border border-c26382c">00:23:10</span>
              </div>

              <div className="mt-4">
                {/* Interactive MARK IMPORTANT Button with 3D Conic Gradient & Sound */}
                <button
                  onClick={handleAddMark}
                  className="w-full py-4 px-6 rounded-2xl relative overflow-hidden cursor-pointer group 
                    bg-gradient-to-b from-c221808/90 via-c161208/92 to-c0c0d0a/95
                    border border-cffaa00/40 hover:border-c00f076/60
                    backdrop-blur-xl shadow-soft hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                    <div 
                      className="absolute inset-[-200%] w-[400%] h-[400%]"
                      style={{ animation: 'rotate-gradient 4s linear infinite' }}
                    >
                      <div 
                        className="absolute inset-0"
                        style={{ background: 'conic-gradient(from 225deg, transparent 0, rgba(212, 160, 162, 0.7) 90deg, rgba(230, 205, 184, 0.7) 120deg, transparent 150deg)' }}
                      />
                    </div>
                  </div>

                  <div 
                    style={{
                      position: 'absolute',
                      content: "''",
                      display: 'block',
                      width: '220%',
                      height: '220%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), rgba(212, 160, 162, 0.4), rgba(230, 205, 184, 0.4), transparent)',
                      animation: 'borderBeamRotation 3.5s infinite linear',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                    }}
                  />

                  <div className="absolute inset-[1.5px] rounded-2xl bg-c0d120f/85 backdrop-blur-md pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cffaa00 to-cd97706 flex items-center justify-center text-c080d0a font-black text-sm">
                        ⚡
                      </div>
                      <div className="text-left">
                        <div className="font-black font-sans uppercase text-base text-cfef3c7 tracking-wider">MARK IMPORTANT</div>
                        <div className="text-[10px] font-mono text-c00f076">Instant Acoustic Bookmark • Sound ON</div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-c00f076/20 border border-c00f076/40 flex items-center justify-center text-c00f076 text-xs">
                      ✓
                    </div>
                  </div>
                </button>
                <div className="text-center text-[10px] text-c718576 font-mono mt-2">
                  Click the button above to hear synthesized chime &amp; test bookmarking
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* PAGE 2: STUDENT SIGN IN / LOGIN                          */}
      {/* ======================================================== */}
      {currentPage === 'auth' && (
        <main className="max-w-md mx-auto my-auto px-4 sm:px-6 py-12 flex-1 flex flex-col justify-center relative z-10">
          <div className="p-8 rounded-3xl bg-c111713/90 border border-c233529 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-block p-3 rounded-2xl bg-c152319 border border-cffaa00/40 text-cffaa00 text-2xl">
                👤
              </div>
              <h2 className="text-2xl font-bold text-ce8e4d8">Step 2: Student Sign In</h2>
              <p className="text-xs text-c8c9c8e">One-click instant login configured for your academic profile</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-c9caaa0 mb-1">Student Full Name</label>
                <input type="text" defaultValue="Pooja" className="w-full px-4 py-2.5 rounded-xl bg-c0b100d border border-c223326 text-ce8e4d8 text-sm focus:border-c00f076 outline-none font-mono" />
              </div>
              <div>
                <label className="block text-xs font-mono text-c9caaa0 mb-1">Student Roll Number / ID</label>
                <input type="text" defaultValue="2026-CSE-042" className="w-full px-4 py-2.5 rounded-xl bg-c0b100d border border-c223326 text-ce8e4d8 text-sm focus:border-c00f076 outline-none font-mono" />
              </div>
              <div>
                <label className="block text-xs font-mono text-c9caaa0 mb-1">Branch / Specialization</label>
                <select className="w-full px-4 py-2.5 rounded-xl bg-c0b100d border border-c223326 text-ce8e4d8 text-sm focus:border-c00f076 outline-none">
                  <option>B.Tech Computer Science &amp; Engineering (CSE)</option>
                  <option>Information Technology (IT)</option>
                  <option>Electronics &amp; Communication (ECE)</option>
                </select>
              </div>

              {/* Primary Guided Button: Opens Step 3 (Dashboard) */}
              <div className="pt-2">
                <GlassmorphismCTA
                  onClick={nextStep}
                  title="Confirm & Enter Dashboard"
                  subtitle="Proceed to Step 3 (Student Hub)"
                  className="w-full justify-center"
                  shimmerColor="rgba(230, 205, 184, 0.85)"
                  glowColor="rgba(230, 205, 184, 0.4)"
                />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* PAGE 3: STUDENT DASHBOARD                                */}
      {/* ======================================================== */}
      {currentPage === 'dashboard' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 flex-1 space-y-8 relative z-10 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-c1f2e24">
            <div>
              <h2 className="text-3xl font-extrabold text-ce8e4d8">Step 3: Welcome back, <span className="text-c00f076">Pooja</span></h2>
              <p className="text-xs font-mono text-c8c9c8e mt-1">B.Tech CSE &bull; Roll: 2026-CSE-042 &bull; Ready to record a new session</p>
            </div>
            
            {/* Primary Guided Button: Opens Step 4 (Setup) */}
            <GlassmorphismCTA
              onClick={nextStep}
              title="Start New Lecture Session +"
              subtitle="Proceed to Step 4 (Session Setup)"
              shimmerColor="rgba(212, 160, 162, 0.85)"
              glowColor="rgba(212, 160, 162, 0.35)"
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Total Lectures Recorded', val: '18 Sessions', color: 'rgb(var(--c00f076))', sub: 'Across 4 Subjects' },
              { label: 'Marked Exam Points', val: '142 Bookmarks', color: 'rgb(var(--cffaa00))', sub: 'Sub-second Timestamps' },
              { label: 'Synthesized Notes', val: '18 Documents', color: 'rgb(var(--c00f076))', sub: 'Ready for Revision' }
            ].map((st, i) => (
              <div key={i} className="p-5 rounded-2xl bg-c111713/80 border border-c213025 space-y-1">
                <span className="text-xs font-mono text-c8c9c8e">{st.label}</span>
                <div className="text-2xl font-bold font-mono" style={{ color: st.color }}>{st.val}</div>
                <span className="text-[11px] text-c6d7f71 font-mono">{st.sub}</span>
              </div>
            ))}
          </div>

          {/* Recent Recorded Lectures List */}
          <div className="p-6 rounded-3xl bg-c101612/80 border border-c213025 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-ce8e4d8">Recent Recorded Lectures</h3>
              <span className="text-xs font-mono text-c00f076">Active Semester Archive</span>
            </div>
            <div className="space-y-3">
              {[
                { title: 'DBMS &mdash; Normalization (1NF, 2NF, 3NF, BCNF)', date: 'Today, 10:30 AM', marks: 8, dur: '42:15' },
                { title: 'Operating Systems &mdash; CPU Scheduling Algorithms', date: 'Yesterday', marks: 12, dur: '56:20' },
                { title: 'Computer Networks &mdash; TCP/IP vs OSI 7-Layer Model', date: '03 Oct 2026', marks: 6, dur: '38:00' }
              ].map((lec, i) => (
                <div key={i} className="p-4 rounded-xl bg-c152019 border border-c233528 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-ce8e4d8" dangerouslySetInnerHTML={{ __html: lec.title }} />
                    <div className="text-xs font-mono text-c7a8e80">{lec.date} &bull; {lec.dur} duration</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-cffaa00 bg-c1a251e px-2.5 py-1 rounded-lg border border-c2b3d30">
                      {lec.marks} Marked
                    </span>
                    <button onClick={() => goToStep(5)} className="px-3 py-1.5 rounded-lg bg-c00f076/20 border border-c00f076/40 text-c00f076 text-xs font-mono hover:bg-c00f076 hover:text-c080d0a transition-all cursor-pointer">
                      View Notes &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* PAGE 4: CREATE LECTURE (SETUP)                           */}
      {/* ======================================================== */}
      {currentPage === 'create-lecture' && (
        <main className="max-w-2xl mx-auto my-auto px-4 sm:px-6 py-10 flex-1 flex flex-col justify-center relative z-10 w-full">
          <div className="p-8 rounded-3xl bg-c111713/90 border border-c233529 shadow-2xl space-y-6">
            <div>
              <div className="text-xs font-mono text-cffaa00 uppercase">Step 4: Session Setup</div>
              <h2 className="text-2xl font-bold text-ce8e4d8 mt-1">Configure Audio Stream &amp; Subject</h2>
              <p className="text-xs text-c8c9c8e mt-1">Select your input source and launch the live 3D recording console</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-c9caaa0 mb-1">Lecture Topic</label>
                <input type="text" defaultValue="DBMS &mdash; Normalization (1NF, 2NF, 3NF)" className="w-full px-4 py-2.5 rounded-xl bg-c0b100d border border-c223326 text-ce8e4d8 text-sm focus:border-c00f076 outline-none font-mono" />
              </div>
              <div>
                <label className="block text-xs font-mono text-c9caaa0 mb-1">Subject</label>
                <select className="w-full px-4 py-2.5 rounded-xl bg-c0b100d border border-c223326 text-ce8e4d8 text-sm focus:border-c00f076 outline-none">
                  <option>Database Management Systems (DBMS)</option>
                  <option>Operating Systems (OS)</option>
                  <option>Computer Networks (CN)</option>
                  <option>Design &amp; Analysis of Algorithms (DAA)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-c9caaa0 mb-1">Audio Capture Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  {['YouTube Tab', 'Microphone', 'Zoom Stream', 'Synthetic Simulation'].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setAudioChannel(ch)}
                      className={`p-3 rounded-xl border text-xs font-mono text-left transition-all cursor-pointer ${
                        audioChannel === ch ? 'bg-c1b2c20 border-c00f076 text-c00f076 shadow-soft' : 'bg-c0d1310 border-c223327 text-c8e9f92'
                      }`}
                    >
                      ▶ {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Guided Button: Opens Step 5 (Live Recording) */}
              <div className="pt-2">
                <GlassmorphismCTA
                  onClick={() => { setIsRecording(true); nextStep(); }}
                  title="Launch Live 3D Session"
                  subtitle="Proceed to Step 5 (Live Console)"
                  className="w-full justify-center"
                  shimmerColor="rgba(230, 205, 184, 0.85)"
                  glowColor="rgba(230, 205, 184, 0.4)"
                />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* PAGE 5: LIVE RECORDING HUB                               */}
      {/* ======================================================== */}
      {currentPage === 'live-recording' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 w-full">
          
          {/* Left Column: Live Audio Stream & 3D Core */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-c111713 border border-c233328 text-center relative overflow-hidden shadow-2xl">
              <div className="text-xs font-mono text-c00f076 uppercase">Step 5: Live Recording Console</div>
              <h2 className="text-2xl font-bold text-ce8e4d8 mt-1">DBMS &mdash; Database Normalization</h2>
              
              {/* Dynamic Live Status Indicator */}
              <div className="flex items-center justify-center gap-2 text-xs font-mono mt-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  !isLiveActive ? 'bg-c7a8f7e' : isPaused ? 'bg-cffaa00' : 'bg-cf43f5e animate-ping'
                }`} />
                <span className={`font-bold tracking-wide ${
                  !isLiveActive ? 'text-c7a8f7e' : isPaused ? 'text-cffaa00' : 'text-cf43f5e'
                }`}>
                  {!isLiveActive ? 'RECORDING STOPPED' : isPaused ? 'RECORDING PAUSED' : 'LIVE RECORDING ACTIVE'}
                </span>
                <span className="text-c8c9c8e hidden sm:inline">&bull; {audioChannel}</span>
              </div>

              {/* Dynamic Digital Timer Ticker */}
              <div className="text-5xl font-mono font-black text-ce8e4d8 my-3 tracking-wider drop-shadow-soft">
                {formatTime(recordingSeconds)}
              </div>

              {/* Dynamic Animated Sound Wave Bars */}
              <div className="flex items-center justify-center gap-1 mb-4 h-6">
                {[35, 70, 50, 85, 60, 30, 80, 95, 45, 65, 75, 50, 60, 80, 35].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      !isLiveActive || isPaused ? 'bg-c223326 h-1.5' : 'bg-gradient-to-t from-c00f076 to-cffaa00'
                    }`}
                    style={{
                      height: !isLiveActive || isPaused 
                        ? '4px' 
                        : `${Math.max(6, Math.floor(h * (Math.sin(recordingSeconds * 2.5 + i) * 0.4 + 0.6)))}px`,
                    }}
                  />
                ))}
              </div>

              {/* NEAT START / PAUSE / RESUME & STOP RECORDING CONTROL BUTTONS */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-c1e2e23">
                
                {/* Start / Pause / Resume Button */}
                {!isLiveActive ? (
                  <button
                    onClick={handleStartOrResume}
                    className="px-5 py-2.5 rounded-xl bg-c00f076/20 border border-c00f076 hover:bg-c00f076 text-c00f076 hover:text-c080d0a font-mono text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-soft hover:scale-105 cursor-pointer"
                  >
                    <span className="text-base">▶</span>
                    <span>Start Recording</span>
                  </button>
                ) : isPaused ? (
                  <button
                    onClick={handleTogglePause}
                    className="px-5 py-2.5 rounded-xl bg-c00f076/20 border border-c00f076 hover:bg-c00f076 text-c00f076 hover:text-c080d0a font-mono text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-soft hover:scale-105 cursor-pointer"
                  >
                    <span className="text-base">▶</span>
                    <span>Resume Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={handleTogglePause}
                    className="px-5 py-2.5 rounded-xl bg-c1a231d border border-cffaa00/70 hover:border-cffaa00 text-cffaa00 font-mono text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer hover:bg-cffaa00/15 hover:scale-105"
                  >
                    <span className="text-base">⏸</span>
                    <span>Pause Recording</span>
                  </button>
                )}

                {/* Neat Stop Recording & Generate Notes Button */}
                <button
                  onClick={handleStopRecording}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-c3b171a via-c2c1215 to-c1c0c0e border border-cf43f5e hover:border-cff4d6d text-cff6b81 hover:text-cfef9c3 font-mono text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all shadow-soft hover:scale-105 cursor-pointer"
                >
                  <span className="w-3 h-3 bg-cf43f5e rounded-xs flex-shrink-0 animate-pulse" />
                  <span>⏹ Stop Recording</span>
                </button>
              </div>

              {/* 3D Visualizer Hologram */}
              <div className="rounded-xl bg-c0b100d border border-c1e2a22 p-2 flex justify-center mt-4">
                <ThreeAudioVisualizer isRecording={isLiveActive && !isPaused} size="compact" />
              </div>
            </div>

            {/* Bookmark Category Pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {['Important', 'Definition', 'Concept', 'Formula', 'Exam Doubt'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-all ${
                    activeCategory === cat 
                      ? 'bg-cffaa00 text-c080d0a font-bold border-cffaa00 shadow-soft' 
                      : 'bg-c131b16 border-c24362a text-c8fa092 hover:text-cded8c7'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Big Glassmorphism MARK Button */}
            <button
              onClick={handleAddMark}
              className="w-full py-5 px-6 rounded-2xl relative overflow-hidden cursor-pointer group 
                bg-gradient-to-b from-c2a1c09/95 via-c181309/95 to-c0b0c0a/98
                border border-cffaa00/50 hover:border-c00f076/80
                backdrop-blur-xl shadow-soft hover:scale-[1.01] active:scale-[0.98] transition-all"
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div 
                  className="absolute inset-[-200%] w-[400%] h-[400%]"
                  style={{ animation: 'rotate-gradient 3s linear infinite' }}
                >
                  <div 
                    className="absolute inset-0"
                    style={{ background: 'conic-gradient(from 225deg, transparent 0, rgba(212, 160, 162, 0.8) 90deg, rgba(230, 205, 184, 0.8) 120deg, transparent 150deg)' }}
                  />
                </div>
              </div>

              <div 
                style={{
                  position: 'absolute',
                  content: "''",
                  display: 'block',
                  width: '220%',
                  height: '220%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), rgba(212, 160, 162, 0.5), rgba(230, 205, 184, 0.5), transparent)',
                  animation: 'borderBeamRotation 3s infinite linear',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              />

              <div className="absolute inset-[2px] rounded-2xl bg-c0c110e/90 backdrop-blur-md pointer-events-none" />

              <div className="relative z-10 flex items-center justify-center gap-3">
                <span className="text-cffaa00 text-2xl font-black">⚡</span>
                <span className="font-black font-sans uppercase text-2xl text-cfef3c7 tracking-wider drop-shadow-md">
                  MARK {activeCategory.toUpperCase()}
                </span>
                <span className="w-8 h-8 rounded-full bg-c00f076/20 border border-c00f076/40 flex items-center justify-center text-c00f076 text-sm font-bold">
                  ✓
                </span>
              </div>
            </button>

            {/* Primary Guided Button: Opens Step 6 (AI Generated Notes) */}
            <div className="pt-2">
              <GlassmorphismCTA
                onClick={handleStopRecording}
                title="Stop Session & Generate Notes"
                subtitle="Proceed to Step 6 (AI Textbook Notes)"
                className="w-full justify-center"
                shimmerColor="rgba(229, 138, 148, 0.85)"
                glowColor="rgba(229, 138, 148, 0.35)"
              />
            </div>
          </div>

          {/* Right Column: Live Captured Marked Points Feed */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-c111713 border border-c233328 space-y-4 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-c213125">
              <h3 className="font-bold text-lg text-ce8e4d8">Marked Points ({markedPoints.length})</h3>
              <span className="text-xs font-mono text-c00f076 animate-pulse">&bull; Live Captured</span>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px] pr-1">
              {markedPoints.map((pt) => (
                <div key={pt.id} className="p-3.5 rounded-xl bg-c16201a border border-c25372b text-xs space-y-1">
                  <div className="flex justify-between font-mono font-bold">
                    <span className="text-cffaa00">{pt.time}</span>
                    <span className="text-c00f076 px-2 py-0.5 rounded bg-c101c14 border border-c00f076/30">{pt.type}</span>
                  </div>
                  <p className="text-cc9c3b2">{pt.text}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* PAGE 6: AI SYNTHESIZED NOTES                             */}
      {/* ======================================================== */}
      {currentPage === 'generated-notes' && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 space-y-6 relative z-10 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-c203024 gap-4">
            <div>
              <span className="text-xs font-mono text-c00f076 uppercase">Step 6: AI Synthesized Notes</span>
              <h2 className="text-3xl font-extrabold text-ce8e4d8">DBMS &mdash; Database Normalization</h2>
            </div>
            
            {/* Primary Guided Button: Opens Step 7 (Editor) */}
            <GlassmorphismCTA
              onClick={nextStep}
              title="Open Document Editor"
              subtitle="Proceed to Step 7 (Edit Notes)"
              shimmerColor="rgba(230, 205, 184, 0.85)"
              glowColor="rgba(230, 205, 184, 0.35)"
            />
          </div>

          {/* Synthesized Textbook Notes Card */}
          <div className="p-8 rounded-3xl bg-c101612/90 border border-c203225 space-y-6 text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-bold text-cffaa00 font-sans">1. Executive Summary</h3>
              <p className="text-cc9c3b2 mt-1">
                Database normalization is the systematic technique of structuring relational tables to eliminate insertion, update, and deletion anomalies while enforcing referential integrity.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-c16211a border-l-4 border-c00f076 space-y-1">
              <div className="text-xs font-mono font-bold text-c00f076">KEY DEFINITION (Captured at 00:08:32)</div>
              <p className="text-ce8e4d8 font-semibold">
                First Normal Form (1NF): A relation is in 1NF if and only if the domain of each attribute contains only atomic (indivisible) values, and no repeating groups exist.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-c16211a border-l-4 border-cffaa00 space-y-1">
              <div className="text-xs font-mono font-bold text-cffaa00">CORE CONCEPT (Captured at 00:15:48)</div>
              <p className="text-ce8e4d8 font-semibold">
                Second Normal Form (2NF): The relation is in 1NF and no non-prime attribute is partially dependent on any candidate key of the table.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-c16211a border-l-4 border-c00f076 space-y-1">
              <div className="text-xs font-mono font-bold text-c00f076">THEORETICAL RULE (Captured at 00:23:10)</div>
              <p className="text-ce8e4d8 font-semibold">
                Third Normal Form (3NF): A relation is in 3NF if it is in 2NF and no non-prime attribute depends transitively on any candidate key.
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs font-mono text-c7a8f7e border-t border-c1c2a20">
              <span>Status: Verified &bull; 3 Audio Bookmarks Synthesized</span>
              <button 
                onClick={() => { soundFx.playTap(); alert('Notes copied to clipboard!'); }}
                className="px-3 py-1 rounded-lg bg-c141e17 border border-c24362a text-c00f076 hover:bg-c00f076 hover:text-c080d0a transition-all cursor-pointer"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* PAGE 7: EDIT NOTES INTERACTIVE CONSOLE                    */}
      {/* ======================================================== */}
      {currentPage === 'edit-notes' && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 space-y-6 relative z-10 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-c203024 gap-4">
            <div>
              <span className="text-xs font-mono text-cffaa00 uppercase">Step 7: Interactive Editor</span>
              <h2 className="text-2xl font-bold text-ce8e4d8">Edit: DBMS &mdash; Normalization</h2>
            </div>
            
            {/* Primary Guided Button: Opens Step 8 (Archive) */}
            <GlassmorphismCTA
              onClick={nextStep}
              title="Save & Add to Archive"
              subtitle="Proceed to Step 8 (Library)"
              shimmerColor="rgba(212, 160, 162, 0.85)"
              glowColor="rgba(212, 160, 162, 0.35)"
            />
          </div>

          <div className="p-6 rounded-2xl bg-c0e1410 border border-c1f2e23 space-y-4">
            {/* Formatting Toolbar */}
            <div className="flex flex-wrap gap-2 pb-3 border-b border-c1b291f text-xs font-mono text-c00f076">
              <button onClick={() => setNotesText(prev => prev + '\n**Bold Emphasis**')} className="px-2.5 py-1 rounded bg-c16231a border border-c00f076/30 hover:bg-c00f076 hover:text-c080d0a transition-all cursor-pointer">Bold (B)</button>
              <button onClick={() => setNotesText(prev => prev + '\n*Italic Note*')} className="px-2.5 py-1 rounded bg-c16231a border border-c00f076/30 hover:bg-c00f076 hover:text-c080d0a transition-all cursor-pointer">Italic (I)</button>
              <button onClick={() => setNotesText(prev => prev + '\n- New bullet point')} className="px-2.5 py-1 rounded bg-c16231a border border-c00f076/30 hover:bg-c00f076 hover:text-c080d0a transition-all cursor-pointer">Bullet &bull;</button>
              <button onClick={() => setNotesText(prev => prev + '\n```sql\nSELECT * FROM Students WHERE NormalForm = 3;\n```')} className="px-2.5 py-1 rounded bg-c16231a border border-c00f076/30 hover:bg-c00f076 hover:text-c080d0a transition-all cursor-pointer">SQL Code &lt;/&gt;</button>
            </div>

            {/* Editable Textarea */}
            <textarea
              rows="14"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              className="w-full bg-transparent text-ce8e4d8 font-mono text-xs sm:text-sm p-2 outline-none resize-none leading-relaxed"
            />

            <div className="flex justify-between items-center text-xs font-mono text-c7a8e80 pt-2 border-t border-c1a261d">
              <span>Word count: {notesText.split(/\s+/).length} words</span>
              <span className="text-c00f076">✓ Auto-saved to memory</span>
            </div>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* PAGE 8: MY RECORDED LECTURES LIBRARY                     */}
      {/* ======================================================== */}
      {currentPage === 'my-lectures' && (
        <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 flex-1 space-y-6 relative z-10 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-c203024 gap-4">
            <div>
              <span className="text-xs font-mono text-c00f076 uppercase">Step 8: Lecture Archive</span>
              <h2 className="text-3xl font-extrabold text-ce8e4d8">My Recorded Lectures</h2>
            </div>
            
            {/* Primary Guided Button: Opens Step 9 (Revision) */}
            <GlassmorphismCTA
              onClick={nextStep}
              title="Proceed to Keyword Revision"
              subtitle="Proceed to Step 9 (Search & Scrub)"
              shimmerColor="rgba(230, 205, 184, 0.85)"
              glowColor="rgba(230, 205, 184, 0.35)"
            />
          </div>

          {/* Lecture Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'DBMS &mdash; Normalization', sub: 'Database Systems', date: '05 Oct 2026', dur: '42:15', marks: 8 },
              { title: 'OS &mdash; CPU Scheduling Algorithms', sub: 'Operating Systems', date: '04 Oct 2026', dur: '56:20', marks: 12 },
              { title: 'CN &mdash; TCP/IP Handshake', sub: 'Computer Networks', date: '03 Oct 2026', dur: '38:00', marks: 6 },
              { title: 'DAA &mdash; Dynamic Programming', sub: 'Algorithms', date: '02 Oct 2026', dur: '50:45', marks: 14 },
              { title: 'AI &mdash; Heuristic Search A*', sub: 'Artificial Intelligence', date: '01 Oct 2026', dur: '45:10', marks: 9 },
              { title: 'SE &mdash; Agile Scrum Lifecycle', sub: 'Software Engineering', date: '29 Sep 2026', dur: '31:25', marks: 4 }
            ].map((lec, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-c111713/80 border border-c213025 hover:border-c00f076/40 transition-all space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-ce8e4d8" dangerouslySetInnerHTML={{ __html: lec.title }} />
                    <span className="text-xs font-mono text-c8c9c8e">{lec.sub}</span>
                  </div>
                  <span className="text-xs font-mono text-cffaa00">{lec.dur}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-c1c2920 text-xs font-mono">
                  <span className="text-c7a8e80">{lec.date} &bull; {lec.marks} points</span>
                  <button onClick={() => goToStep(5)} className="px-3 py-1 rounded bg-c16231b border border-c00f076/30 text-c00f076 hover:bg-c00f076 hover:text-c080d0a transition-all cursor-pointer">
                    Notes &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* PAGE 9: REVISION & ACOUSTIC KEYWORD SEARCH               */}
      {/* ======================================================== */}
      {currentPage === 'revision' && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 space-y-6 relative z-10 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-c203024 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono text-cffaa00 uppercase">Step 9: Final Step</span>
              <h2 className="text-3xl font-extrabold text-ce8e4d8">Acoustic Keyword Revision</h2>
            </div>

            {/* Primary Guided Button: Complete flow and return to Dashboard */}
            <GlassmorphismCTA
              onClick={() => goToStep(2)}
              title="Finish Tour &amp; Return to Dashboard"
              subtitle="Completed All 9 Steps"
              shimmerColor="rgba(230, 205, 184, 0.85)"
              glowColor="rgba(230, 205, 184, 0.35)"
            />
          </div>

          {/* Search Bar */}
          <div className="p-3.5 rounded-2xl bg-c101612 border border-c233528 flex items-center gap-3">
            <span className="text-c00f076 text-lg pl-2">🔍</span>
            <input
              type="text"
              placeholder="Type any keyword (e.g. 2NF, candidate key, CPU scheduling, TCP, transitive)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-ce8e4d8 text-sm outline-none font-mono placeholder:text-c6e8072"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs font-mono text-cffaa00 pr-2 cursor-pointer">Clear</button>
            )}
          </div>

          {/* Search Results List with Audio Jump Scrubbing */}
          <div className="space-y-3">
            {[
              { kw: '2NF', lec: 'DBMS &mdash; Normalization', time: '00:15:48', desc: 'A table is in 2NF if it has no partial dependency on candidate keys.' },
              { kw: 'Candidate Key', lec: 'DBMS &mdash; Normalization', time: '00:12:04', desc: 'A minimal super key is designated as a candidate key for functional dependency.' },
              { kw: 'Transitive Dependency', lec: 'DBMS &mdash; Normalization', time: '00:23:10', desc: '3NF removes transitive dependency where non-prime attributes rely on another non-prime.' },
              { kw: 'CPU Scheduling', lec: 'Operating Systems', time: '00:09:30', desc: 'Shortest Job First (SJF) gives minimum average waiting time for given processes.' }
            ]
            .filter(item => !searchQuery || item.kw.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((res, i) => (
              <div key={i} className="p-4 rounded-xl bg-c121914 border border-c213225 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-c18261e border border-c00f076/40 text-c00f076 font-mono text-xs font-bold">
                      {res.kw}
                    </span>
                    <span className="text-xs font-semibold text-ce8e4d8" dangerouslySetInnerHTML={{ __html: res.lec }} />
                  </div>
                  <p className="text-xs text-cc9c3b2">{res.desc}</p>
                </div>

                <button
                  onClick={() => { soundFx.playTap(); alert(`Jumping straight to audio playback at ${res.time} in ${res.lec}`); }}
                  className="px-3.5 py-1.5 rounded-lg bg-cffaa00/15 border border-cffaa00/40 text-cffaa00 text-xs font-mono whitespace-nowrap hover:bg-cffaa00 hover:text-c080d0a transition-all cursor-pointer"
                >
                  ▶ Jump {res.time}
                </button>
              </div>
            ))}
          </div>
        </main>
      )}


    </div>
  );
}

export default App;
