import { useTheme } from './ThemeContext';

// Dark | Light segmented switch — both options always visible
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const base = 'px-2.5 h-7 rounded-md text-xs font-mono flex items-center gap-1 cursor-pointer transition-all';
  const active = 'bg-c00f076 text-c080d0a font-bold';
  const idle = 'text-c8fa392 hover:text-cffaa00';

  return (
    <div
      role="group"
      aria-label="Theme switch"
      className="flex items-center gap-0.5 p-0.5 rounded-lg bg-c141c17 border border-c26372b"
    >
      <button onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'} title="Dark theme"
        className={`${base} ${theme === 'dark' ? active : idle}`}>
        <span>🌙</span><span className="hidden sm:inline">Dark</span>
      </button>
      <button onClick={() => setTheme('light')} aria-pressed={theme === 'light'} title="Light theme"
        className={`${base} ${theme === 'light' ? active : idle}`}>
        <span>☀️</span><span className="hidden sm:inline">Light</span>
      </button>
    </div>
  );
}
