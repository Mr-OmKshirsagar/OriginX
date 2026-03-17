import { Link, useLocation } from 'react-router';
import { useMemo, useState, useEffect } from 'react';
import { LayoutDashboard, Search, History, Settings, Sparkles, Moon, Sun, Newspaper, Link2 } from 'lucide-react';
import { useDarkMode } from './DarkModeContext';
import { useLanguage } from './LanguageContext';
import { getMonthlyVerificationCount } from '../services/api';

export function Sidebar() {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { t, locale } = useLanguage();
  const [monthlyCount, setMonthlyCount] = useState<number | null>(null);
  const [monthLabel, setMonthLabel] = useState('');

  const formatMonthLabel = (rawLabel: string): string => {
    const trimmed = rawLabel.trim();
    if (!trimmed) return '';

    const normalized = /^\d{4}-\d{2}$/.test(trimmed)
      ? `${trimmed}-01`
      : /^[A-Za-z]+\s+\d{4}$/.test(trimmed)
        ? `${trimmed} 1`
        : trimmed;

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return trimmed;
    }

    return parsed.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    let cancelled = false;
    const fetchCount = () => {
      getMonthlyVerificationCount()
        .then((data) => {
          if (!cancelled) {
            setMonthlyCount(data.count);
            setMonthLabel(data.month);
          }
        })
        .catch(() => {/* keep last value on error */});
    };
    fetchCount();
    const id = window.setInterval(fetchCount, 30_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);
  
  const navItems = useMemo(() => [
    { id: 'nav-dashboard', icon: LayoutDashboard, label: t('navDashboard'), path: '/dashboard' },
    { id: 'nav-trending', icon: Newspaper, label: t('navTrending'), path: '/trending' },
    { id: 'nav-verify', icon: Search, label: t('navVerify'), path: '/verify' },
    { id: 'nav-history', icon: History, label: t('navHistory'), path: '/history' },
    { id: 'nav-url-investigation', icon: Link2, label: t('navUrlInvestigation'), path: '/url-investigation' },
    { id: 'nav-settings', icon: Settings, label: t('navSettings'), path: '/settings' },
  ], [t]);
  
  return (
    <div className={`h-screen w-64 border-r fixed left-0 top-0 flex flex-col transition-all duration-300 ${
      isDarkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-[#E2E8F0]'
    }`}>
      <div className={`p-6 border-b transition-all duration-300 ${isDarkMode ? 'border-[#1F2937]' : 'border-[#E2E8F0]'}`}>
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-lg flex items-center justify-center shadow-lg shadow-[#3B82F6]/20 group-hover:shadow-[#3B82F6]/40 transition-all">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xl font-semibold transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>OriginX</span>
        </Link>
        <p className={`text-xs mt-1 transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#94A3B8]'}`}>{t('appTagline')}</p>
      </div>
      
      <nav className="flex-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 border transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? isDarkMode 
                    ? 'bg-gradient-to-r from-[#3B82F6]/20 to-[#22D3EE]/20 text-[#22D3EE] border-white/25 shadow-lg shadow-[#3B82F6]/10 hover:border-white/80' 
                    : 'bg-[#F1F5F9] text-[#3B82F6] border-[#BFDBFE] hover:border-white'
                  : isDarkMode 
                    ? 'text-[#9CA3AF] border-transparent hover:bg-[#1F2937] hover:text-[#F9FAFB] hover:border-white/80' 
                    : 'text-[#64748B] border-transparent hover:bg-[#F8FAFC] hover:text-[#0F172A] hover:border-white'
              }`}
            >
              {isActive && isDarkMode && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 to-[#22D3EE]/10 blur-xl"></div>
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10 flex items-center gap-2 justify-between w-full">
                <span>{item.label}</span>
                {item.id === 'nav-trending' && <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.7)]" />}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 border-t transition-all duration-300 ${isDarkMode ? 'border-[#1F2937]' : 'border-[#E2E8F0]'}`}>
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg mb-3 transition-all duration-200 group ${
            isDarkMode ? 'bg-[#1F2937] text-[#F9FAFB] hover:bg-[#374151]' : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <span className="flex items-center gap-3">
            {isDarkMode ? (
              <Moon className="w-5 h-5 text-[#22D3EE]" />
            ) : (
              <Sun className="w-5 h-5 text-[#FBBF24]" />
            )}
            <span className="text-sm">{isDarkMode ? t('darkMode') : t('lightMode')}</span>
          </span>
          <div className={`w-10 h-6 rounded-full p-1 transition-all duration-300 ${
            isDarkMode ? 'bg-gradient-to-r from-[#3B82F6] to-[#22D3EE]' : 'bg-[#CBD5E1]'
          }`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
              isDarkMode ? 'translate-x-4 shadow-lg shadow-[#3B82F6]/50' : 'translate-x-0'
            }`}></div>
          </div>
        </button>

        <div className={`rounded-lg p-4 border transition-all duration-300 ${  
          isDarkMode 
            ? 'bg-gradient-to-br from-[#3B82F6]/10 to-[#22D3EE]/10 border-[#3B82F6]/20 shadow-lg shadow-[#3B82F6]/5' 
            : 'bg-gradient-to-br from-[#3B82F6]/10 to-[#22D3EE]/10 border-[#3B82F6]/20'
        }`}>
          <p className="text-xs text-[#22D3EE] mb-1 font-medium">{t('totalVerifications')}</p>
          <p className={`text-2xl font-bold transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
            {monthlyCount !== null ? monthlyCount.toLocaleString(locale) : '—'}
          </p>
          <p className={`text-xs mt-1 transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#94A3B8]'}`}>
            {monthLabel ? t('completedIn', { month: formatMonthLabel(monthLabel) }) : t('completedThisMonth')}
          </p>
        </div>
      </div>
    </div>
  );
}