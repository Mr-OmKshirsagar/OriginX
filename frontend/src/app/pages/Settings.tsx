import { Globe, Moon, Sun } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useDarkMode } from '../components/DarkModeContext';
import { useLanguage } from '../components/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../i18n/config';

export function Settings() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'}`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
              {t('settingsTitle')}
            </h1>
            <p className={`transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>
              {t('settingsSubtitle')}
            </p>
          </div>

          <div className={`rounded-2xl border p-8 mb-6 transition-all duration-300 ${
            isDarkMode
              ? 'bg-[#1F2937] border-[#374151] shadow-lg shadow-[#3B82F6]/5'
              : 'bg-white border-[#E2E8F0] shadow-sm'
          }`}>
            <h2 className={`text-xl font-bold mb-6 transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
              {t('appearanceTitle')}
            </h2>

            <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
              isDarkMode ? 'bg-[#111827]' : 'bg-[#F8FAFC]'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-[#1F2937]' : 'bg-[#0F172A]'
                }`}>
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-[#22D3EE]" />
                  ) : (
                    <Sun className="w-5 h-5 text-[#FBBF24]" />
                  )}
                </div>
                <div>
                  <p className={`mb-1 font-medium transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
                    {t('darkModeLabel')}
                  </p>
                  <p className={`text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>
                    {isDarkMode ? t('darkModeDescDark') : t('darkModeDescLight')}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`w-14 h-8 rounded-full transition-all duration-300 relative ${
                  isDarkMode ? 'bg-gradient-to-r from-[#3B82F6] to-[#22D3EE]' : 'bg-[#CBD5E1]'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                  isDarkMode ? 'left-7 shadow-lg shadow-[#3B82F6]/50' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border p-8 transition-all duration-300 ${
            isDarkMode
              ? 'bg-[#1F2937] border-[#374151] shadow-lg shadow-[#3B82F6]/5'
              : 'bg-white border-[#E2E8F0] shadow-sm'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
                  {t('languageTitle')}
                </h2>
                <p className={`text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>
                  {t('languageHint')}
                </p>
              </div>
            </div>

            <label className={`text-sm mb-2 block font-medium transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>
              {t('languageLabel')}
            </label>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as typeof language)}
              className={`w-full px-4 py-3 border rounded-xl outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-200 ${
                isDarkMode
                  ? 'bg-[#111827] border-[#374151] text-[#F9FAFB]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'
              }`}
            >
              {SUPPORTED_LANGUAGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`languageName_${option.value}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}