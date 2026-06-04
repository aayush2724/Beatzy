import { useTheme } from '../context/ThemeContext';
import { Tooltip } from './ui';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip content={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-full border border-glass-border hover:bg-white/5 transition-colors ${className}`}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span className="material-symbols-outlined text-lg text-on-surface">
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
    </Tooltip>
  );
}
