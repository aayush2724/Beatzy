import { useTheme } from '../context/ThemeContext';
import { Tooltip } from './ui';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip content={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-full border border-glass-border hover:bg-white/5 transition-colors flex items-center justify-center ${className}`}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-on-surface" />
        ) : (
          <Moon className="w-4 h-4 text-on-surface" />
        )}
      </button>
    </Tooltip>
  );
}
