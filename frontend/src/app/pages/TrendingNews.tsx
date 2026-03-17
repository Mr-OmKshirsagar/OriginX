import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Globe, ArrowUpRight, Clock3, RefreshCw, Timer } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useDarkMode } from '../components/DarkModeContext';
import { useLanguage } from '../components/LanguageContext';
import { getTrendingNews, type TrendingNewsResponse } from '../services/api';

interface TrendingNewsItem {
  id: number;
  headline: string;
  source: string;
  region: string;
  category: string;
  published: string;
  momentum: string;
  url: string;
}

const COUNTRY_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: 'global', labelKey: 'trendingCountryGlobal' },
  { value: 'us', labelKey: 'trendingCountryUs' },
  { value: 'in', labelKey: 'trendingCountryIn' },
  { value: 'gb', labelKey: 'trendingCountryGb' },
  { value: 'au', labelKey: 'trendingCountryAu' },
  { value: 'ca', labelKey: 'trendingCountryCa' },
  { value: 'de', labelKey: 'trendingCountryDe' },
  { value: 'fr', labelKey: 'trendingCountryFr' },
  { value: 'jp', labelKey: 'trendingCountryJp' },
  { value: 'sg', labelKey: 'trendingCountrySg' },
];

const CATEGORY_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: 'all', labelKey: 'trendingCategoryAll' },
  { value: 'business', labelKey: 'trendingCategoryBusiness' },
  { value: 'entertainment', labelKey: 'trendingCategoryEntertainment' },
  { value: 'general', labelKey: 'trendingCategoryGeneral' },
  { value: 'health', labelKey: 'trendingCategoryHealth' },
  { value: 'science', labelKey: 'trendingCategoryScience' },
  { value: 'sports', labelKey: 'trendingCategorySports' },
  { value: 'technology', labelKey: 'trendingCategoryTechnology' },
];

const TRENDING_COUNTRY_STORAGE_KEY = 'originx.trending.country';
const TRENDING_CATEGORY_STORAGE_KEY = 'originx.trending.category';
const GEOLOCATION_TIMEOUT_MS = 7000;
const REVERSE_GEOCODE_TIMEOUT_MS = 5000;

function detectCountryFromLocale(): string {
  const locales = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
  for (const locale of locales) {
    const parts = locale.split('-');
    if (parts.length >= 2) {
      const country = parts[1].toLowerCase();
      if (country.length === 2 && /^[a-z]+$/.test(country)) {
        return country;
      }
    }
  }
  return 'us';
}

function formatCountryName(countryCode: string, locale: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const normalized = (countryCode || '').toLowerCase();
  const fromOptions = COUNTRY_OPTIONS.find((option) => option.value === normalized);
  if (fromOptions) {
    return t(fromOptions.labelKey);
  }

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
      const fullName = displayNames.of(normalized.toUpperCase());
      if (fullName) {
        return fullName;
      }
    }
  } catch {
    // Ignore formatting failures and fall through to code.
  }

  return normalized.toUpperCase() || 'US';
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is unavailable in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: 30 * 60 * 1000,
    });
  });
}

async function detectCountryFromBrowserLocation(): Promise<string> {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REVERSE_GEOCODE_TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        { signal: controller.signal }
      );

      if (response.ok) {
        const payload = (await response.json()) as { countryCode?: string };
        const countryCode = (payload.countryCode || '').toLowerCase();
        if (countryCode.length === 2 && /^[a-z]+$/.test(countryCode)) {
          return countryCode;
        }
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  } catch {
    // Fall back gracefully if permission is denied or lookup fails.
  }

  return detectCountryFromLocale();
}

export function TrendingNews() {
  const { isDarkMode } = useDarkMode();
  const { t, locale } = useLanguage();
  const [currentTime, setCurrentTime] = useState(() =>
    new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date())
  );
  const [newsData, setNewsData] = useState<TrendingNewsResponse | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('global');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [detectedLocalCountry, setDetectedLocalCountry] = useState('us');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const detectedLocalCountryName = formatCountryName(detectedLocalCountry, locale, t);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const intervalId = window.setInterval(() => {
      setCurrentTime(formatter.format(new Date()));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [locale]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const detected = await detectCountryFromBrowserLocation();
      if (isMounted) {
        setDetectedLocalCountry(detected);
      }
    })();

    const savedCountry = localStorage.getItem(TRENDING_COUNTRY_STORAGE_KEY);
    if (savedCountry && COUNTRY_OPTIONS.some((option) => option.value === savedCountry)) {
      setSelectedCountry(savedCountry);
    }

    const savedCategory = localStorage.getItem(TRENDING_CATEGORY_STORAGE_KEY);
    if (savedCategory && CATEGORY_OPTIONS.some((option) => option.value === savedCategory)) {
      setSelectedCategory(savedCategory);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(TRENDING_COUNTRY_STORAGE_KEY, selectedCountry);
  }, [selectedCountry]);

  useEffect(() => {
    localStorage.setItem(TRENDING_CATEGORY_STORAGE_KEY, selectedCategory);
  }, [selectedCategory]);

  const formatPublishedAgo = (publishedAt: string) => {
    const parsed = new Date(publishedAt);
    if (Number.isNaN(parsed.getTime())) return t('trendingRecentlyPublished');

    const minutes = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60000));
    if (minutes < 1) return t('trendingJustNow');
    if (minutes < 60) return t('trendingMinutesAgo', { minutes });

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('trendingHoursAgo', { hours });

    const days = Math.floor(hours / 24);
    return t('trendingDaysAgo', { days });
  };

  const fetchLatestNews = async () => {
    setIsLoadingNews(true);
    setNewsError(null);

    try {
      const response = await getTrendingNews({
        limit: 30,
        country: selectedCountry,
        category: selectedCategory,
        local_country: selectedCountry === 'global' ? detectedLocalCountry : undefined,
      });
      setNewsData(response);
      setLastRefresh(new Date());
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : t('trendingLoadError'));
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    if (!detectedLocalCountry) return;

    setNewsData(null);

    void fetchLatestNews();

    const refreshEvery30Minutes = window.setInterval(() => {
      void fetchLatestNews();
    }, 30 * 60 * 1000);

    return () => window.clearInterval(refreshEvery30Minutes);
  }, [selectedCountry, selectedCategory, detectedLocalCountry]);

  const trendingNews: TrendingNewsItem[] = (newsData?.articles || []).map((article, index) => ({
    id: index + 1,
    headline: article.title,
    source: article.source,
    region: article.region,
    category: article.category,
    published: formatPublishedAgo(article.published_at),
    momentum: `+${Math.max(8, 28 - index * 2)}%`,
    url: article.url,
  }));

  const totalPages = Math.max(1, Math.ceil(trendingNews.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTrendingNews = trendingNews.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCountry, selectedCategory]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const metrics = [
    {
      id: 'news-tracked',
      label: t('trendingMetricNewsTracked'),
      value: String(newsData?.articles_found || trendingNews.length || 0),
      icon: Flame,
      color: '#22C55E'
    },
    {
      id: 'regions-active',
      label: t('trendingMetricRegionsActive'),
      value: String(new Set(trendingNews.map((item) => item.region)).size || 1),
      icon: Globe,
      color: '#22D3EE'
    },
    {
      id: 'avg-update',
      label: t('trendingMetricAvgUpdate'),
      value: '30m',
      icon: Timer,
      color: '#EF4444'
    }
  ];

  const categoryColors: Record<string, string> = {
    business: '#3B82F6',
    entertainment: '#A855F7',
    general: '#64748B',
    health: '#22C55E',
    science: '#06B6D4',
    sports: '#22C55E',
    technology: '#8B5CF6',
  };

  const getCategoryLabel = (value: string) => {
    const normalized = (value || '').toLowerCase();
    if (normalized === 'business') return t('trendingCategoryBusiness');
    if (normalized === 'entertainment') return t('trendingCategoryEntertainment');
    if (normalized === 'general') return t('trendingCategoryGeneral');
    if (normalized === 'health') return t('trendingCategoryHealth');
    if (normalized === 'science') return t('trendingCategoryScience');
    if (normalized === 'sports') return t('trendingCategorySports');
    if (normalized === 'technology') return t('trendingCategoryTechnology');
    return value;
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F1F5F9]'}`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">

          {/* ── Header ── */}
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22C55E] to-[#16A34A] shadow-lg shadow-[#22C55E]/30 flex-shrink-0">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('trendingTitle')}</h1>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  {t('trendingSubtitle', { country: detectedLocalCountryName })}
                </p>
              </div>
            </div>

            <div className={`inline-flex items-center gap-3 rounded-2xl border px-5 py-3.5 ${
              isDarkMode
                ? 'bg-[#111827] border-white/8 shadow-lg'
                : 'bg-white border-[#E2E8F0] shadow-sm'
            }`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] shadow-md shadow-[#22D3EE]/25">
                <Clock3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-widest ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('trendingLiveFeed')}</p>
                <p className={`text-xl font-semibold tabular-nums ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{currentTime}</p>
                {lastRefresh && <p className="text-xs text-[#22D3EE]">{t('trendingRefreshedAt', { time: lastRefresh.toLocaleTimeString() })}</p>}
              </div>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className={`mb-6 rounded-2xl border p-5 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="trending-country" className={`block text-xs uppercase tracking-widest mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  {t('trendingCountryScope')}
                </label>
                <select
                  id="trending-country"
                  title={t('trendingSelectCountryTitle')}
                  value={selectedCountry}
                  onChange={(event) => setSelectedCountry(event.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all text-sm ${
                    isDarkMode
                      ? 'bg-[#0B1120] border-white/10 text-white focus:border-[#3B82F6]'
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-[#3B82F6]'
                  }`}
                >
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="trending-category" className={`block text-xs uppercase tracking-widest mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  {t('trendingCategory')}
                </label>
                <select
                  id="trending-category"
                  title={t('trendingSelectCategoryTitle')}
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all text-sm ${
                    isDarkMode
                      ? 'bg-[#0B1120] border-white/10 text-white focus:border-[#3B82F6]'
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-[#3B82F6]'
                  }`}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => { void fetchLatestNews(); }}
                disabled={isLoadingNews}
                className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all flex-shrink-0 ${
                  isLoadingNews
                    ? isDarkMode
                      ? 'border-white/8 bg-white/5 text-[#64748B] cursor-not-allowed'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed'
                    : isDarkMode
                      ? 'border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#93C5FD] hover:bg-[#3B82F6]/20 hover:border-[#3B82F6]/50'
                      : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE]'
                }`}
                title={t('trendingRefreshTitle')}
                aria-label={t('trendingRefreshAria')}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingNews ? 'animate-spin' : ''}`} />
                {isLoadingNews ? t('trendingRefreshing') : t('trendingRefresh')}
              </button>
            </div>
          </div>

          {newsError && (
            <div className="mb-6 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-5 py-3.5 text-sm text-[#FCA5A5]">
              {newsError}
            </div>
          )}

          {!!newsData && (
            <div className={`mb-6 flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm ${isDarkMode ? 'bg-[#111827] border-white/8 text-[#64748B]' : 'bg-white border-[#E2E8F0] text-[#94A3B8]'}`}>
              <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span>{t('trendingStoriesSummary', { loaded: newsData.articles_found, skipped: newsData.skipped_untrusted_count })}</span>
            </div>
          )}

          {/* ── Metric Cards ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {isLoadingNews && !newsData
              ? Array.from({ length: 3 }, (_, skIndex) => (
                  <div key={skIndex} className={`rounded-2xl border p-6 animate-pulse ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                    <div className={`h-1 w-full rounded-full mb-5 ${isDarkMode ? 'bg-white/10' : 'bg-[#E2E8F0]'}`} />
                    <div className={`h-3 w-24 rounded mb-4 ${isDarkMode ? 'bg-white/10' : 'bg-[#E2E8F0]'}`} />
                    <div className={`h-9 w-16 rounded ${isDarkMode ? 'bg-white/10' : 'bg-[#E2E8F0]'}`} />
                  </div>
                ))
              : metrics.map((metric, index) => {
                  const Icon = metric.icon;
                  const isAvgUpdateMetric = metric.id === 'avg-update';
                  return (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                        isDarkMode ? 'bg-[#111827] border-white/8 hover:border-white/80' : 'bg-white border-[#E2E8F0] hover:border-white'
                      }`}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: metric.color }} />
                      <div className="flex items-center justify-between mb-4 mt-1">
                        <p className={`text-sm ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{metric.label}</p>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={isAvgUpdateMetric
                            ? { background: 'linear-gradient(135deg, #EF4444, #DC2626)' }
                            : { backgroundColor: `${metric.color}18` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: isAvgUpdateMetric ? '#FFFFFF' : metric.color }} />
                        </div>
                      </div>
                      <p className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{metric.value}</p>
                    </motion.div>
                  );
                })
            }
          </div>

          {/* ── News Feed ── */}
          <div className="space-y-3">
            {isLoadingNews && !trendingNews.length && (
              Array.from({ length: 8 }, (_, skIndex) => (
                <div key={skIndex} className={`rounded-2xl border p-5 animate-pulse ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                  <div className="flex gap-4 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-white/10' : 'bg-[#E2E8F0]'}`} />
                    <div className="flex-1 space-y-2">
                      <div className={`h-4 w-full rounded ${isDarkMode ? 'bg-white/10' : 'bg-[#E2E8F0]'}`} />
                      <div className={`h-4 w-2/3 rounded ${isDarkMode ? 'bg-white/10' : 'bg-[#E2E8F0]'}`} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[60, 40, 72, 56].map((w, i) => (
                      <div key={i} className={`h-6 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-[#E2E8F0]'}`} style={{ width: w }} />
                    ))}
                  </div>
                </div>
              ))
            )}

            {!isLoadingNews && !trendingNews.length && !newsError && (
              <div className={`rounded-2xl border p-8 text-center ${isDarkMode ? 'bg-[#111827] border-white/8 text-[#64748B]' : 'bg-white border-[#E2E8F0] text-[#94A3B8]'}`}>
                {t('trendingNoStories')}
              </div>
            )}

            {paginatedTrendingNews.map((item, index) => {
              const catColor = categoryColors[item.category?.toLowerCase()] ?? '#64748B';
              const rank = startIndex + index + 1;
              return (
                <motion.a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer overflow-hidden block ${
                    isDarkMode
                      ? 'bg-[#111827] border-white/8 hover:border-white/16 hover:shadow-black/30'
                      : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-[#0F172A]/8'
                  }`}
                >
                  <div className="flex items-stretch">
                    {/* Left accent bar */}
                    <div className="w-1 flex-shrink-0 rounded-l-2xl" style={{ backgroundColor: catColor }} />

                    <div className="flex-1 p-5">
                      <div className="flex items-start gap-4">
                        {/* Rank badge */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5 bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25">
                          {rank}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h2 className={`text-base font-semibold leading-snug mb-3 group-hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#F1F5F9]' : 'text-[#0F172A]'}`}>
                            {item.headline}
                          </h2>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Category chip */}
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${catColor}18`, color: catColor }}>
                              {getCategoryLabel(item.category)}
                            </span>
                            {/* Source */}
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDarkMode ? 'bg-white/8 text-[#94A3B8]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                              {item.source}
                            </span>
                            {/* Region */}
                            <span className={`text-xs px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-white/5 text-[#64748B]' : 'bg-[#F8FAFC] text-[#94A3B8]'}`}>
                              <Globe className="inline w-3 h-3 mr-1 -mt-0.5" />{item.region}
                            </span>
                          </div>
                        </div>

                        {/* Right meta */}
                        <div className="flex-shrink-0 flex flex-col items-end gap-2 ml-2">
                          <div className="flex items-center gap-1 text-[#22C55E] font-semibold text-sm">
                            <ArrowUpRight className="w-4 h-4" />
                            {item.momentum}
                          </div>
                          <div className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                            <Clock3 className="w-3 h-3" />
                            {item.published}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.a>
              );
            })}

            {/* ── Pagination ── */}
            {trendingNews.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <p className={`text-sm ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  {t('trendingRangeSummary', { from: startIndex + 1, to: Math.min(startIndex + itemsPerPage, trendingNews.length), total: trendingNews.length })}
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      currentPage === 1
                        ? isDarkMode ? 'bg-white/5 text-[#4B5563] cursor-not-allowed' : 'bg-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed'
                        : isDarkMode ? 'bg-white/8 text-[#94A3B8] hover:bg-white/12 hover:text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {`<- ${t('trendingPrev')}`}
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => {
                    const p = i + 1;
                    const isActive = p === currentPage;
                    return (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30'
                            : isDarkMode ? 'bg-white/8 text-[#94A3B8] hover:bg-white/12 hover:text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      currentPage === totalPages
                        ? isDarkMode ? 'bg-white/5 text-[#4B5563] cursor-not-allowed' : 'bg-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed'
                        : isDarkMode ? 'bg-white/8 text-[#94A3B8] hover:bg-white/12 hover:text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {`${t('trendingNext')} ->`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}