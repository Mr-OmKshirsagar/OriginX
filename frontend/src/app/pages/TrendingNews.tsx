import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Globe, ArrowUpRight, Clock3 } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useDarkMode } from '../components/DarkModeContext';

interface TrendingNewsItem {
  id: number;
  headline: string;
  source: string;
  region: string;
  category: string;
  published: string;
  momentum: string;
}

export function TrendingNews() {
  const { isDarkMode } = useDarkMode();
  const [currentTime, setCurrentTime] = useState(() =>
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date())
  );

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const intervalId = window.setInterval(() => {
      setCurrentTime(formatter.format(new Date()));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const metrics = [
    {
      label: 'Stories Tracked',
      value: '147',
      icon: Flame,
      color: '#F97316'
    },
    {
      label: 'Regions Active',
      value: '38',
      icon: Globe,
      color: '#22D3EE'
    },
    {
      label: 'Avg Update Time',
      value: '4m',
      icon: Clock3,
      color: '#3B82F6'
    }
  ];

  const trendingNews: TrendingNewsItem[] = [
    {
      id: 1,
      headline: 'Global EV battery breakthrough cuts charging time to 8 minutes',
      source: 'Reuters',
      region: 'Global',
      category: 'Technology',
      published: '12 min ago',
      momentum: '+32%'
    },
    {
      id: 2,
      headline: 'WHO releases new cross-border disease early warning protocol',
      source: 'BBC News',
      region: 'Europe',
      category: 'Health',
      published: '21 min ago',
      momentum: '+21%'
    },
    {
      id: 3,
      headline: 'Major climate funding package approved at emergency summit',
      source: 'Associated Press',
      region: 'North America',
      category: 'Climate',
      published: '35 min ago',
      momentum: '+28%'
    },
    {
      id: 4,
      headline: 'New AI watermark framework adopted by top media groups',
      source: 'The Verge',
      region: 'United States',
      category: 'AI Policy',
      published: '49 min ago',
      momentum: '+17%'
    },
    {
      id: 5,
      headline: 'Election commission launches real-time misinformation response desk',
      source: 'Al Jazeera',
      region: 'Asia',
      category: 'Politics',
      published: '1h ago',
      momentum: '+25%'
    }
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'}`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className={`text-3xl font-bold mb-2 transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
                Trending News
              </h1>
              <p className={`transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>
                Fast-moving stories tracked across trusted global sources.
              </p>
            </div>

            <div className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              isDarkMode
                ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.85))] border-[#3B82F6]/20 shadow-[0_0_24px_rgba(34,211,238,0.12)]'
                : 'bg-white border-[#BFDBFE] shadow-sm'
            }`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] shadow-lg shadow-[#22D3EE]/20">
                <Clock3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-[0.18em] ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  Real Time Feed
                </p>
                <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{currentTime}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;

              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 relative overflow-hidden group cursor-pointer ${
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
                      <p className={isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}>{metric.label}</p>
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'shadow-lg' : ''}`}
                        style={{
                          backgroundColor: `${metric.color}15`,
                          boxShadow: isDarkMode ? `0 0 20px ${metric.color}40` : 'none'
                        }}
                      >
                        <Icon className="w-6 h-6" style={{ color: metric.color }} />
                      </div>
                    </div>

                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>{metric.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="space-y-4">
            {trendingNews.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`rounded-2xl border p-5 transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${
                  isDarkMode
                    ? 'bg-[#1F2937] border-[#374151] hover:border-[#3B82F6]/40 hover:shadow-lg hover:shadow-[#3B82F6]/10'
                    : 'bg-white border-[#E2E8F0] hover:border-[#3B82F6]/40 hover:shadow-md'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <h2 className={`text-lg font-semibold flex-1 ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
                    {item.headline}
                  </h2>
                  <div className="flex items-center gap-2 text-[#22C55E] font-semibold">
                    <span>{item.momentum}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-[#0F172A] text-[#94A3B8]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                    {item.source}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-[#0F172A] text-[#94A3B8]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                    {item.region}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-[#0F172A] text-[#94A3B8]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                    {item.category}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-[#0F172A] text-[#94A3B8]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                    {item.published}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}