import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Filter, Download, ExternalLink, Calendar, Database, ChevronDown, Check } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useDarkMode } from '../components/DarkModeContext';
import { useLanguage } from '../components/LanguageContext';
import { getHistoryVerifications, type HistoryVerificationItem } from '../services/api';

interface HistoryItem {
  id: string;
  claim: string;
  credibilityScore: number;
  createdAt: string;
  sourcesFound: number;
  status: 'likelyTrue' | 'likelyFalse' | 'uncertain';
}

export function History() {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState(30);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: 'all', label: t('historyFilterAllStatus') },
    { value: 'likelyTrue', label: t('historyStatusLikelyTrue') },
    { value: 'uncertain', label: t('historyStatusUncertain') },
    { value: 'likelyFalse', label: t('historyStatusLikelyFalse') },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!statusDropdownRef.current?.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const normalizeStatus = (item: HistoryVerificationItem, score: number): HistoryItem['status'] => {
    const normalizedVerdict = (item.verdict || '').toLowerCase().trim();
    if (normalizedVerdict.includes('false')) return 'likelyFalse';
    if (normalizedVerdict.includes('true')) return 'likelyTrue';
    if (normalizedVerdict.includes('uncertain')) return 'uncertain';

    const normalizedResult = (item.verification_result || '').toLowerCase();
    if (normalizedResult === 'true') return 'likelyTrue';
    if (normalizedResult === 'false') return 'likelyFalse';

    if (score >= 70) return 'likelyTrue';
    if (score >= 40) return 'uncertain';
    return 'likelyFalse';
  };

  const getStatusLabel = (status: HistoryItem['status']): string => {
    if (status === 'likelyTrue') return t('historyStatusLikelyTrue');
    if (status === 'likelyFalse') return t('historyStatusLikelyFalse');
    return t('historyStatusUncertain');
  };

  const formatDisplayDate = (isoDate: string): string => {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return t('commonUnknownDate');
    return parsed.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const response = await getHistoryVerifications({ limit: 500 });
      const mapped: HistoryItem[] = response.items.map((item) => {
        const score = Number.isFinite(Number(item.credibility_score))
          ? Math.round(Number(item.credibility_score))
          : 50;

        return {
          id: item.id,
          claim: item.claim_text,
          credibilityScore: score,
          createdAt: item.created_at,
          sourcesFound: item.sources_count,
          status: normalizeStatus(item, score),
        };
      });

      setHistoryData(mapped);
      setRefreshIntervalSeconds(response.refresh_interval_seconds || 30);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : t('historyLoadError'));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadHistory();

    const intervalId = window.setInterval(() => {
      void loadHistory();
    }, Math.max(5, refreshIntervalSeconds) * 1000);

    return () => window.clearInterval(intervalId);
  }, [refreshIntervalSeconds]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#22C55E';
    if (score >= 40) return '#FBBF24';
    return '#EF4444';
  };

  const getStatusColor = (status: HistoryItem['status']) => {
    if (status === 'likelyTrue') return '#22C55E';
    if (status === 'likelyFalse') return '#EF4444';
    return '#FBBF24';
  };

  const getScoreStyles = (score: number) => {
    const color = getScoreColor(score);
    return {
      text: color,
      border: `${color}33`,
      shadow: `0 0 0 1px ${color}22, 0 8px 20px ${color}12`,
    };
  };

  const getStatusStyles = (status: HistoryItem['status']) => {
    const color = getStatusColor(status);
    return {
      text: color,
      border: `${color}3D`,
      shadow: `0 0 16px ${color}12`,
    };
  };

  const selectedStatusLabel = statusOptions.find((option) => option.value === filterStatus)?.label || t('historyFilterAllStatus');
  const itemsPerPage = 8;

  const filteredData = historyData
    .filter((item) => {
      const matchesSearch = item.claim.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.credibilityScore - a.credibilityScore;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const trueCount = historyData.filter((item) => item.status === 'likelyTrue').length;
  const falseCount = historyData.filter((item) => item.status === 'likelyFalse').length;
  const uncertainCount = historyData.filter((item) => item.status === 'uncertain').length;
  const accuracyRate = historyData.length ? `${((trueCount / historyData.length) * 100).toFixed(1)}%` : '0.0%';

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'}`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 transition-colors flex items-center gap-3 ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${isDarkMode ? 'bg-[#1E293B] text-[#22D3EE]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
                <Database className="w-5 h-5" />
              </span>
              {t('historyTitle')}
            </h1>
            <p className={`transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>{t('historySubtitle')}</p>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
              {t('historyLiveSync', { seconds: refreshIntervalSeconds })}
            </p>
          </div>

          {historyError && (
            <div className="mb-6 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
              {historyError}
            </div>
          )}

          {isLoadingHistory && !historyData.length && (
            <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${isDarkMode ? 'border-[#334155] bg-[#0F172A] text-[#93C5FD]' : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'}`}>
              {t('historyLoading')}
            </div>
          )}

          <div className={`rounded-2xl border p-6 mb-6 transition-all duration-300 ${
            isDarkMode
              ? 'bg-[#1F2937] border-[#374151] shadow-lg shadow-[#3B82F6]/5 hover:shadow-[#3B82F6]/15'
              : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('historySearchPlaceholder')}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all ${
                      isDarkMode
                        ? 'bg-[#0F172A] border-[#334155] text-white placeholder:text-[#64748B]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative" ref={statusDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                    className={`w-full pl-10 pr-10 py-3 border rounded-xl outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all text-left flex items-center ${
                      isDarkMode
                        ? 'bg-[#0F172A] border-[#334155] text-white hover:border-[#3B82F6]/40'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:border-[#3B82F6]/40'
                    }`}
                    aria-expanded={isStatusDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <span>{selectedStatusLabel}</span>
                    <ChevronDown
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${
                        isStatusDropdownOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isStatusDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -6 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`absolute top-full mt-2 left-0 w-full rounded-xl border shadow-2xl overflow-hidden z-30 origin-top ${
                          isDarkMode
                            ? 'bg-[#111827] border-[#334155] shadow-[#3B82F6]/20'
                            : 'bg-white border-[#E2E8F0] shadow-black/10'
                        }`}
                        role="listbox"
                      >
                        <div className="py-1">
                          {statusOptions.map((option) => {
                            const isSelected = filterStatus === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setFilterStatus(option.value);
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                                  isDarkMode
                                    ? 'text-[#F9FAFB] hover:bg-[#1E293B]'
                                    : 'text-[#0F172A] hover:bg-[#F8FAFC]'
                                } ${isSelected ? (isDarkMode ? 'bg-[#1E293B]/80' : 'bg-[#EFF6FF]') : ''}`}
                                role="option"
                                aria-selected={isSelected}
                              >
                                <span>{option.label}</span>
                                {isSelected && <Check className="w-4 h-4 text-[#3B82F6]" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button title={t('historyExportTitle')} className="px-4 py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-all">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
              isDarkMode
                ? 'bg-[#1E293B] border-[#334155] hover:shadow-lg hover:shadow-[#3B82F6]/15 hover:border-[#3B82F6]/40'
                : 'bg-white border-[#E2E8F0] hover:shadow-md hover:border-[#CBD5E1]'
            }`}>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('totalVerifications')}</p>
              <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{historyData.length}</p>
            </div>
            <div className={`rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
              isDarkMode
                ? 'bg-[#1E293B] border-[#334155] hover:shadow-lg hover:shadow-[#22C55E]/15 hover:border-[#22C55E]/40'
                : 'bg-white border-[#E2E8F0] hover:shadow-md hover:border-[#CBD5E1]'
            }`}>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('historyStatusLikelyTrue')}</p>
              <p className="text-2xl text-[#22C55E]">{trueCount}</p>
            </div>
            <div className={`rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
              isDarkMode
                ? 'bg-[#1E293B] border-[#334155] hover:shadow-lg hover:shadow-[#EF4444]/15 hover:border-[#EF4444]/40'
                : 'bg-white border-[#E2E8F0] hover:shadow-md hover:border-[#CBD5E1]'
            }`}>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('historyStatusLikelyFalse')}</p>
              <p className="text-2xl text-[#EF4444]">{falseCount}</p>
            </div>
            <div className={`rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
              isDarkMode
                ? 'bg-[#1E293B] border-[#334155] hover:shadow-lg hover:shadow-[#FBBF24]/15 hover:border-[#FBBF24]/40'
                : 'bg-white border-[#E2E8F0] hover:shadow-md hover:border-[#CBD5E1]'
            }`}>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('historyStatusUncertain')}</p>
              <p className="text-2xl text-[#FBBF24]">{uncertainCount}</p>
            </div>
          </div>

          <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
            isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b transition-colors ${
                  isDarkMode ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}>
                  <tr>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('historyHeaderClaim')}</th>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('historyHeaderCredibilityScore')}</th>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('historyHeaderStatus')}</th>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('historyHeaderDate')}</th>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('historyHeaderSources')}</th>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('historyHeaderAction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b transition-colors ${
                        isDarkMode ? 'border-[#334155] hover:bg-[#0F172A]' : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {(() => {
                        const scoreStyle = getScoreStyles(item.credibilityScore);
                        const statusStyle = getStatusStyles(item.status);

                        return (
                          <>
                            <td className="px-6 py-4">
                              <p className={`max-w-md ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{item.claim}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className="text-xl"
                                  style={{
                                    color: scoreStyle.text,
                                    textShadow: scoreStyle.shadow,
                                  }}
                                >
                                  {item.credibilityScore}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className="inline-flex px-5 py-2 rounded-full text-sm border backdrop-blur-sm"
                                style={{
                                  background: 'transparent',
                                  color: statusStyle.text,
                                  borderColor: statusStyle.border,
                                  boxShadow: statusStyle.shadow,
                                }}
                              >
                                {getStatusLabel(item.status)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                                <Calendar className="w-4 h-4" />
                                <span>{formatDisplayDate(item.createdAt)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{item.sourcesFound}</span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => navigate('/verify', { state: { claimText: item.claim, source: 'history' } })}
                                className="text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 text-sm transition-colors"
                              >
                                {t('historyActionView')}
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        );
                      })()}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="py-16 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'
                }`}>
                  <Search className="w-8 h-8 text-[#94A3B8]" />
                </div>
                <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{t('historyNoResults')}</p>
              </div>
            )}
          </div>

          {filteredData.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                {t('historyShowingResults', {
                  from: startIndex + 1,
                  to: Math.min(startIndex + itemsPerPage, filteredData.length),
                  total: filteredData.length,
                })}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                    currentPage === 1
                      ? isDarkMode
                        ? 'border-[#374151] text-[#6B7280] bg-[#111827] cursor-not-allowed'
                        : 'border-[#E2E8F0] text-[#94A3B8] bg-[#F8FAFC] cursor-not-allowed'
                      : isDarkMode
                        ? 'border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {t('historyPrevious')}
                </button>

                {Array.from({ length: totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  const isActive = pageNumber === currentPage;

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                          : isDarkMode
                            ? 'border border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]'
                            : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                    currentPage === totalPages
                      ? isDarkMode
                        ? 'border-[#374151] text-[#6B7280] bg-[#111827] cursor-not-allowed'
                        : 'border-[#E2E8F0] text-[#94A3B8] bg-[#F8FAFC] cursor-not-allowed'
                      : isDarkMode
                        ? 'border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {t('historyNext')}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 bg-gradient-to-br from-[#3B82F6]/5 to-[#22D3EE]/5 border border-[#3B82F6]/20 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-xl flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('historyDatasetInfoTitle')}</h3>
                <p className={`mb-4 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  {t('historyDatasetInfoDesc')} <strong className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{t('historyDatasetInfoDescEm')}</strong>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                    isDarkMode ? 'bg-[#1E293B] hover:shadow-lg hover:shadow-[#3B82F6]/10' : 'bg-white hover:shadow-md'
                  }`}>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('totalVerifications')}</p>
                    <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{historyData.length}</p>
                  </div>
                  <div className={`rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                    isDarkMode ? 'bg-[#1E293B] hover:shadow-lg hover:shadow-[#EF4444]/10' : 'bg-white hover:shadow-md'
                  }`}>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('historyDatasetMisinfo')}</p>
                    <p className="text-2xl text-[#EF4444]">{falseCount}</p>
                  </div>
                  <div className={`rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                    isDarkMode ? 'bg-[#1E293B] hover:shadow-lg hover:shadow-[#22C55E]/10' : 'bg-white hover:shadow-md'
                  }`}>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('historyDatasetAccuracy')}</p>
                    <p className="text-2xl text-[#22C55E]">{accuracyRate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
