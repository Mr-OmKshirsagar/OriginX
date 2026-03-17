import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useDarkMode } from '../components/DarkModeContext';
import { getDashboardSummary, type DashboardSummaryResponse } from '../services/api';

export function Dashboard() {
  const { isDarkMode } = useDarkMode();
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const stats = useMemo(() => {
    const totals = dashboardData?.totals;
    const changes = dashboardData?.changes;
    return [
      {
        label: 'Total Verifications',
        value: String(totals?.total_verifications ?? 0),
        change: changes?.total_verifications ?? '+0.0%',
        trend: (changes?.total_verifications || '+0.0%').startsWith('-') ? 'down' : 'up',
        icon: Activity,
        color: '#3B82F6',
      },
      {
        label: 'True Claims',
        value: String(totals?.true_claims ?? 0),
        change: changes?.true_claims ?? '+0.0%',
        trend: (changes?.true_claims || '+0.0%').startsWith('-') ? 'down' : 'up',
        icon: CheckCircle2,
        color: '#22C55E',
      },
      {
        label: 'False Claims',
        value: String(totals?.false_claims ?? 0),
        change: changes?.false_claims ?? '+0.0%',
        trend: (changes?.false_claims || '+0.0%').startsWith('-') ? 'down' : 'up',
        icon: XCircle,
        color: '#EF4444',
      },
      {
        label: 'Uncertain',
        value: String(totals?.uncertain_claims ?? 0),
        change: changes?.uncertain_claims ?? '+0.0%',
        trend: (changes?.uncertain_claims || '+0.0%').startsWith('-') ? 'down' : 'up',
        icon: AlertCircle,
        color: '#FBBF24',
      },
    ] as const;
  }, [dashboardData]);

  const recentVerifications = dashboardData?.recent_verifications ?? [];
  const trendingTopics = dashboardData?.trending_topics ?? [];

  const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Unknown date';
    }
    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getDashboardSummary({ limit: 500 });
      setDashboardData(response);
      setLastRefresh(new Date());
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();

    const pollingIntervalSeconds = dashboardData?.refresh_interval_seconds ?? 30;
    const intervalId = window.setInterval(() => {
      void fetchDashboard();
    }, pollingIntervalSeconds * 1000);

    return () => window.clearInterval(intervalId);
  }, [dashboardData?.refresh_interval_seconds]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#22C55E';
    if (score >= 40) return '#FBBF24';
    return '#EF4444';
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'}`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 transition-colors flex items-center gap-3 ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${isDarkMode ? 'bg-[#1E293B] text-[#22D3EE]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
                <Activity className="w-5 h-5" />
              </span>
              Dashboard
            </h1>
            <p className={`transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Overview of your verification activity</p>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
              Real-time database sync every {dashboardData?.refresh_interval_seconds ?? 30}s
              {lastRefresh ? ` | Last refresh: ${lastRefresh.toLocaleTimeString()}` : ''}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
              {error}
            </div>
          )}

          {isLoading && !dashboardData && (
            <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${isDarkMode ? 'border-[#334155] bg-[#0F172A] text-[#93C5FD]' : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'}`}>
              Loading live dashboard metrics...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer relative overflow-hidden group ${
                    isDarkMode
                      ? 'bg-[#1F2937] border-[#374151] shadow-lg shadow-[#3B82F6]/5 hover:shadow-[#3B82F6]/20'
                      : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md'
                  }`}
                >
                  {isDarkMode && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          isDarkMode ? 'shadow-lg' : ''
                        }`}
                        style={{
                          backgroundColor: `${stat.color}15`,
                          boxShadow: isDarkMode ? `0 0 20px ${stat.color}40` : 'none',
                        }}
                      >
                        <Icon className="w-6 h-6" style={{ color: stat.color }} />
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                        {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{stat.change}</span>
                      </div>
                    </div>

                    <p className={`text-3xl font-bold mb-1 transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>{stat.value}</p>
                    <p className={`text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className={`rounded-2xl border p-6 transition-all duration-300 ${
                isDarkMode
                  ? 'bg-[#1F2937] border-[#374151] shadow-lg shadow-[#3B82F6]/5'
                  : 'bg-white border-[#E2E8F0] shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold transition-colors flex items-center gap-2 ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${isDarkMode ? 'bg-[#1E293B] text-[#22D3EE]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    Recent Verifications
                  </h2>
                  <Link to="/history" className="text-sm text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 font-medium transition-colors">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="space-y-4">
                  {recentVerifications.map((verification, index) => (
                    <motion.div
                      key={verification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border rounded-xl p-4 transition-all duration-300 hover:shadow-xl relative overflow-hidden group ${
                        isDarkMode
                          ? 'border-[#374151] bg-[#111827] hover:bg-[#1F2937] hover:border-[#3B82F6]/30'
                          : 'border-[#E2E8F0] hover:shadow-md'
                      }`}
                    >
                      {isDarkMode && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      )}
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <p className={`flex-1 font-medium transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>{verification.claim}</p>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                isDarkMode ? 'shadow-lg' : ''
                              }`}
                              style={{
                                backgroundColor: `${getScoreColor(verification.score)}20`,
                                color: getScoreColor(verification.score),
                                boxShadow: isDarkMode ? `0 0 15px ${getScoreColor(verification.score)}30` : 'none',
                              }}
                            >
                              {verification.score}%
                            </div>
                          </div>
                        </div>

                        <div className={`flex items-center gap-4 text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>
                          <span>{formatDate(verification.created_at)}</span>
                          <span>•</span>
                          <span>{verification.sources} sources</span>
                          <span>•</span>
                          <span className="font-medium" style={{ color: getScoreColor(verification.score) }}>
                            {verification.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {!recentVerifications.length && !isLoading && (
                    <div className={`rounded-xl border px-4 py-5 text-sm ${isDarkMode ? 'border-[#374151] bg-[#111827] text-[#9CA3AF]' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]'}`}>
                      No verification history found in the database yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className={`rounded-2xl border p-6 mb-6 transition-all duration-300 ${
                isDarkMode
                  ? 'bg-[#1F2937] border-[#374151] shadow-lg shadow-[#3B82F6]/5'
                  : 'bg-white border-[#E2E8F0] shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold transition-colors flex items-center gap-2 ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${isDarkMode ? 'bg-[#1E293B] text-[#22D3EE]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
                      <TrendingUp className="w-4 h-4" />
                    </span>
                    Trending Topics
                  </h2>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#EF4444]/20 bg-[#EF4444]/10 px-3 py-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-[ping_1.4s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-[#EF4444] opacity-70"></span>
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#EF4444] animate-[pulse_1.4s_ease-in-out_infinite] shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                    </span>
                    <span className="text-sm font-medium text-[#EF4444] animate-[pulse_1.4s_ease-in-out_infinite]">LIVE</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {trendingTopics.map((topic, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${topic.trend === 'up' ? 'bg-[#22C55E]/10' : 'bg-[#EF4444]/10'}`}>
                          {topic.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-[#EF4444]" />
                          )}
                        </div>
                        <span className={`transition-colors group-hover:text-[#3B82F6] ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>{topic.topic}</span>
                      </div>
                      <span className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>{topic.count}</span>
                    </motion.div>
                  ))}

                  {!trendingTopics.length && !isLoading && (
                    <div className={`rounded-xl border px-4 py-5 text-sm ${isDarkMode ? 'border-[#374151] bg-[#111827] text-[#9CA3AF]' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]'}`}>
                      Not enough records to identify trending topics yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className={`rounded-2xl p-8 border transition-all duration-300 ${
              isDarkMode
                ? 'bg-gradient-to-br from-[#1F2937] to-[#111827] border-[#374151] shadow-lg'
                : 'bg-gradient-to-br from-[#F8FAFC] to-white border-[#E2E8F0]'
            }`}>
              <h2 className={`text-xl font-bold mb-6 transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Quick Actions</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/verify"
                  className={`p-6 border rounded-xl transition-all duration-300 hover:shadow-2xl group relative overflow-hidden ${
                    isDarkMode
                      ? 'bg-[#1F2937] border-[#374151] hover:border-[#3B82F6]'
                      : 'bg-white border-[#E2E8F0] hover:border-[#3B82F6] hover:shadow-md'
                  }`}
                >
                  {isDarkMode && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-[#3B82F6]/30">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={`mb-2 font-semibold group-hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Verify New Claim</h3>
                    <p className={`text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Start a new verification process</p>
                  </div>
                </Link>

                <Link
                  to="/history"
                  className={`p-6 border rounded-xl transition-all duration-300 hover:shadow-2xl group relative overflow-hidden ${
                    isDarkMode
                      ? 'bg-[#1F2937] border-[#374151] hover:border-[#3B82F6]'
                      : 'bg-white border-[#E2E8F0] hover:border-[#3B82F6] hover:shadow-md'
                  }`}
                >
                  {isDarkMode && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-[#3B82F6]/30">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={`mb-2 font-semibold group-hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>View History</h3>
                    <p className={`text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Browse past verifications</p>
                  </div>
                </Link>

                <Link
                  to="/settings"
                  className={`p-6 border rounded-xl transition-all duration-300 hover:shadow-2xl group relative overflow-hidden ${
                    isDarkMode
                      ? 'bg-[#1F2937] border-[#374151] hover:border-[#3B82F6]'
                      : 'bg-white border-[#E2E8F0] hover:border-[#3B82F6] hover:shadow-md'
                  }`}
                >
                  {isDarkMode && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-[#3B82F6]/30">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={`mb-2 font-semibold group-hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Settings</h3>
                    <p className={`text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Manage your preferences</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
