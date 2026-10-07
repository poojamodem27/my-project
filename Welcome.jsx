import { useTheme } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
import ThreeAudioVisualizer from './ThreeAudioVisualizer';
import ElectricLogoCanvas from './ElectricLogoCanvas';
import { PALETTE } from './palette';

export default function Welcome({ onEnter }) {
  const { theme } = useTheme();
  const pal = PALETTE[theme] || PALETTE.light;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
    >
            <header className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-6">
        <div className="flex items-center gap-3">
          <ElectricLogoCanvas size={44} color={pal.primary} glowColor={pal.secondary} />
          <div className="leading-tight">
            <div className="text-xl font-bold tracking-tight">Note<span className="text-cffaa00">Tap</span></div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 grid lg:grid-cols-2 items-center gap-4 px-6 sm:px-12 pb-8 min-h-[calc(100vh-100px)]">
        <div className="max-w-xl">
          <h1 className="fade-up text-5xl sm:text-6xl font-semibold leading-[1.05]">
            You listen.<br />
            <span className="text-c00f076">You mark.</span><br />
            <span className="text-cffaa00">NoteTap remembers.</span>
          </h1>
          <div className="fade-up d2 mt-10">
            <button
              onClick={onEnter}
              className="group inline-flex items-center gap-3 rounded-full px-9 py-4 text-base font-semibold cursor-pointer shadow-soft transition-all hover:-translate-y-0.5"
              style={theme === 'dark' ? { backgroundColor: 'rgb(246 238 230)', color: 'rgb(59 42 36)' } : { backgroundColor: 'rgb(59 42 36)', color: 'rgb(251 247 241)' }}
            >
              Start Learning <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </button>
          </div>
        </div>
        <div className="fade-up d1">
          <ThreeAudioVisualizer size="large" heightClass="h-[360px] sm:h-[480px] lg:h-[580px]" />
        </div>
      </main>
    </div>
  );
}
