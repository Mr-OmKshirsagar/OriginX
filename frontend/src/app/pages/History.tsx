import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Filter, Download, ExternalLink, Calendar, Database, ChevronDown, Check } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useDarkMode } from '../components/DarkModeContext';

interface HistoryItem {
  id: number;
  claim: string;
  credibilityScore: number;
  date: string;
  sourcesFound: number;
  status: 'Verified True' | 'Likely True' | 'Uncertain' | 'Likely False' | 'Verified False';
}

export function History() {
  const { isDarkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Verified True', label: 'Verified True' },
    { value: 'Likely True', label: 'Likely True' },
    { value: 'Uncertain', label: 'Uncertain' },
    { value: 'Likely False', label: 'Likely False' },
    { value: 'Verified False', label: 'Verified False' }
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

  const historyData: HistoryItem[] = [
    {
      id: 1,
      claim: 'Government banned petrol cars in 2026',
      credibilityScore: 82,
      date: 'March 11, 2026',
      sourcesFound: 12,
      status: 'Likely True'
    },
    {
      id: 2,
      claim: 'New vaccine prevents all respiratory diseases',
      credibilityScore: 23,
      date: 'March 10, 2026',
      sourcesFound: 8,
      status: 'Likely False'
    },
    {
      id: 3,
      claim: 'Tech company announces major layoffs',
      credibilityScore: 91,
      date: 'March 9, 2026',
      sourcesFound: 24,
      status: 'Verified True'
    },
    {
      id: 4,
      claim: 'Climate summit delayed to 2027',
      credibilityScore: 56,
      date: 'March 8, 2026',
      sourcesFound: 6,
      status: 'Uncertain'
    },
    {
      id: 5,
      claim: 'New tax policy implemented this month',
      credibilityScore: 78,
      date: 'March 7, 2026',
      sourcesFound: 15,
      status: 'Likely True'
    },
    {
      id: 6,
      claim: 'Cryptocurrency becomes legal tender worldwide',
      credibilityScore: 18,
      date: 'March 6, 2026',
      sourcesFound: 4,
      status: 'Verified False'
    },
    {
      id: 7,
      claim: 'New renewable energy breakthrough announced',
      credibilityScore: 85,
      date: 'March 5, 2026',
      sourcesFound: 19,
      status: 'Verified True'
    },
    {
      id: 8,
      claim: 'Global internet outage expected next week',
      credibilityScore: 12,
      date: 'March 4, 2026',
      sourcesFound: 2,
      status: 'Verified False'
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#22C55E';
    if (score >= 40) return '#FBBF24';
    return '#EF4444';
  };

  const getStatusColor = (status: string) => {
    if (status.includes('True')) return '#22C55E';
    if (status.includes('False')) return '#EF4444';
    return '#FBBF24';
  };

  const getScoreStyles = (score: number) => {
    const color = getScoreColor(score);
    return {
      text: color,
      border: `${color}33`,
      shadow: `0 0 0 1px ${color}22, 0 8px 20px ${color}12`
    };
  };

  const getStatusStyles = (status: string) => {
    const color = getStatusColor(status);
    return {
      text: color,
      border: `${color}3D`,
      shadow: `0 0 16px ${color}12`
    };
  };

  const selectedStatusLabel = statusOptions.find(option => option.value === filterStatus)?.label || 'All Status';

  const filteredData = historyData.filter(item => {
    const matchesSearch = item.claim.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'}`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Verification History</h1>
            <p className={`transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Browse and manage your past verifications</p>
          </div>

          {/* Filters and Search */}
          <div className={`rounded-2xl border p-6 mb-6 transition-all duration-300 ${
            isDarkMode
              ? 'bg-[#1F2937] border-[#374151] shadow-lg shadow-[#3B82F6]/5 hover:shadow-[#3B82F6]/15'
              : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search claims..."
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all ${
                      isDarkMode ? 'bg-[#0F172A] border-[#334155] text-white placeholder:text-[#64748B]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8]'
                    }`}
                  />
                </div>
              </div>

              {/* Filter */}
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

                <button className="px-4 py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-all">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
              isDarkMode
                ? 'bg-[#1E293B] border-[#334155] hover:shadow-lg hover:shadow-[#3B82F6]/15 hover:border-[#3B82F6]/40'
                : 'bg-white border-[#E2E8F0] hover:shadow-md hover:border-[#CBD5E1]'
            }`}>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Total Verifications</p>
              <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{historyData.length}</p>
            </div>
            <div className={`rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
              isDarkMode
                ? 'bg-[#1E293B] border-[#334155] hover:shadow-lg hover:shadow-[#22C55E]/15 hover:border-[#22C55E]/40'
                : 'bg-white border-[#E2E8F0] hover:shadow-md hover:border-[#CBD5E1]'
            }`}>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>True Claims</p>
              <p className="text-2xl text-[#22C55E]">
                {historyData.filter(item => item.status.includes('True')).length}
              </p>
            </div>
            <div className={`rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
              isDarkMode
                ? 'bg-[#1E293B] border-[#334155] hover:shadow-lg hover:shadow-[#EF4444]/15 hover:border-[#EF4444]/40'
                : 'bg-white border-[#E2E8F0] hover:shadow-md hover:border-[#CBD5E1]'
            }`}>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>False Claims</p>
              <p className="text-2xl text-[#EF4444]">
                {historyData.filter(item => item.status.includes('False')).length}
              </p>
            </div>
            <div className={`rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
              isDarkMode
                ? 'bg-[#1E293B] border-[#334155] hover:shadow-lg hover:shadow-[#FBBF24]/15 hover:border-[#FBBF24]/40'
                : 'bg-white border-[#E2E8F0] hover:shadow-md hover:border-[#CBD5E1]'
            }`}>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Uncertain</p>
              <p className="text-2xl text-[#FBBF24]">
                {historyData.filter(item => item.status === 'Uncertain').length}
              </p>
            </div>
          </div>

          {/* History Table */}
          <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
            isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b transition-colors ${
                  isDarkMode ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}>
                  <tr>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Claim</th>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Credibility Score</th>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Status</th>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Date</th>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Sources</th>
                    <th className={`text-left px-6 py-4 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
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
                              textShadow: scoreStyle.shadow
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
                            boxShadow: statusStyle.shadow
                          }}
                        >
                          {item.status}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                          <Calendar className="w-4 h-4" />
                          <span>{item.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{item.sourcesFound}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 text-sm">
                          View
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
                <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>No verifications found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Showing {filteredData.length} of {historyData.length} verifications
              </p>

              <div className="flex items-center gap-2">
                <button className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                  isDarkMode ? 'border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}>
                  Previous
                </button>
                <button className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-sm hover:bg-[#2563EB] transition-colors">
                  1
                </button>
                <button className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                  isDarkMode ? 'border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}>
                  2
                </button>
                <button className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                  isDarkMode ? 'border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}>
                  3
                </button>
                <button className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                  isDarkMode ? 'border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}>
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Dataset Panel */}
          <div className="mt-8 bg-gradient-to-br from-[#3B82F6]/5 to-[#22D3EE]/5 border border-[#3B82F6]/20 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-xl flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Dataset Information</h3>
                <p className={`mb-4 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  Misinformation pattern analysis using <strong className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>1,700 LinkedIn posts</strong>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                    isDarkMode ? 'bg-[#1E293B] hover:shadow-lg hover:shadow-[#3B82F6]/10' : 'bg-white hover:shadow-md'
                  }`}>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Total Posts Analyzed</p>
                    <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>1,700</p>
                  </div>
                  <div className={`rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                    isDarkMode ? 'bg-[#1E293B] hover:shadow-lg hover:shadow-[#EF4444]/10' : 'bg-white hover:shadow-md'
                  }`}>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Misinformation Detected</p>
                    <p className="text-2xl text-[#EF4444]">342</p>
                  </div>
                  <div className={`rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                    isDarkMode ? 'bg-[#1E293B] hover:shadow-lg hover:shadow-[#22C55E]/10' : 'bg-white hover:shadow-md'
                  }`}>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Accuracy Rate</p>
                    <p className="text-2xl text-[#22C55E]">94.7%</p>
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