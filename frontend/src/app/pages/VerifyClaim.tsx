import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Globe,
  Facebook,
  Newspaper,
  Instagram,
  ShieldCheck,
  ShieldAlert,
  Clock3,
  Bot,
  BadgeCheck,
  ScanSearch,
  CalendarClock
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { CredibilityGauge } from '../components/CredibilityGauge';
import { NetworkBackground } from '../components/NetworkBackground';
import { useDarkMode } from '../components/DarkModeContext';

interface Article {
  id: number;
  title: string;
  source: string;
  date: string;
  similarity: number;
  url: string;
  logo: string;
}

interface TimelineEvent {
  date: string;
  event: string;
  source: string;
}

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  note: string;
  accent: string;
  glow: string;
  isDarkMode: boolean;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

function AnimatedCounter({ value, decimals = 0, prefix = '', suffix = '', duration = 1200 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setDisplayValue(value * progress);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [duration, value]);

  return <>{prefix}{displayValue.toFixed(decimals)}{suffix}</>;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  accent,
  glow,
  isDarkMode,
  decimals = 0,
  prefix = '',
  suffix = ''
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
        isDarkMode
          ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.72))] border-white/8 backdrop-blur-xl'
          : 'bg-white/90 border-[#E2E8F0] backdrop-blur-xl'
      }`}
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 18px 40px ${glow}` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] mb-3 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{label}</p>
          <p className={`text-3xl mb-1 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
            <AnimatedCounter value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
          </p>
          <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{note}</p>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: `${accent}18`, boxShadow: `0 0 22px ${glow}` }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
    </motion.div>
  );
}

export function VerifyClaim() {
  const location = useLocation();
  const navigationState = location.state as { claim?: string; autoAnalyze?: boolean } | null;
  const initialClaim = navigationState?.claim || '';
  const shouldAutoAnalyze = Boolean(navigationState?.autoAnalyze && initialClaim.trim());
  const { isDarkMode } = useDarkMode();

  const [claim, setClaim] = useState(initialClaim);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const resultsRef = useRef<HTMLDivElement>(null);

  // Mock data
  const credibilityScore = 82;
  const articles: Article[] = [
    {
      id: 1,
      title: 'Government Announces New Electric Vehicle Initiative for 2026',
      source: 'Reuters',
      date: 'March 8, 2026',
      similarity: 0.89,
      url: '#',
      logo: '🗞️'
    },
    {
      id: 2,
      title: 'Major Policy Shift in Transportation Sector Expected',
      source: 'BBC News',
      date: 'March 9, 2026',
      similarity: 0.82,
      url: '#',
      logo: '📰'
    },
    {
      id: 3,
      title: 'Electric Vehicle Mandate Delayed Until 2028',
      source: 'Associated Press',
      date: 'March 10, 2026',
      similarity: 0.79,
      url: '#',
      logo: '📡'
    },
    {
      id: 4,
      title: 'BREAKING: Petrol Cars Banned Starting Today',
      source: 'UnverifiedNews.com',
      date: 'March 11, 2026',
      similarity: 0.24,
      url: '#',
      logo: '⚠️'
    }
  ];

  const timeline: TimelineEvent[] = [
    { date: 'Jan 4, 2026', event: 'Initial online mention detected', source: 'Social Media' },
    { date: 'Jan 5, 2026', event: 'First trusted verification published', source: 'Reuters' },
    { date: 'Jan 6, 2026', event: 'Secondary confirmation and analysis', source: 'BBC' },
    { date: 'Jan 7, 2026', event: 'Low-credibility amplification wave', source: 'Blogs & Aggregators' }
  ];

  const averageSimilarity = Math.round(
    (articles.reduce((total, article) => total + article.similarity, 0) / articles.length) * 100
  );

  const getAverageMatchMeta = (similarity: number) => {
    if (similarity >= 85) {
      return {
        label: 'Fully Matching',
        container: 'bg-gradient-to-br from-[#22C55E]/12 to-[#22C55E]/5 border-[#22C55E]/20',
        title: isDarkMode ? 'text-[#86EFAC]' : 'text-[#166534]',
        value: isDarkMode ? 'text-[#F0FDF4]' : 'text-[#14532D]'
      };
    }

    if (similarity >= 70) {
      return {
        label: 'Mostly Matching',
        container: 'bg-gradient-to-br from-[#FBBF24]/12 to-[#FBBF24]/5 border-[#FBBF24]/20',
        title: isDarkMode ? 'text-[#FDE68A]' : 'text-[#A16207]',
        value: isDarkMode ? 'text-[#FFFBEB]' : 'text-[#854D0E]'
      };
    }

    if (similarity >= 40) {
      return {
        label: 'Partially Matching',
        container: 'bg-gradient-to-br from-[#F97316]/12 to-[#F97316]/5 border-[#F97316]/20',
        title: isDarkMode ? 'text-[#FDBA74]' : 'text-[#C2410C]',
        value: isDarkMode ? 'text-[#FFF7ED]' : 'text-[#9A3412]'
      };
    }

    return {
      label: 'Not Matching',
      container: 'bg-gradient-to-br from-[#EF4444]/12 to-[#EF4444]/5 border-[#EF4444]/20',
      title: isDarkMode ? 'text-[#FCA5A5]' : 'text-[#B91C1C]',
      value: isDarkMode ? 'text-[#FEF2F2]' : 'text-[#7F1D1D]'
    };
  };

  const getSimilarityMeta = (similarity: number) => {
    if (similarity >= 0.75) {
      return {
        label: 'Strong Match',
        color: '#22C55E',
        background: isDarkMode ? 'bg-[#052E1A]' : 'bg-[#DCFCE7]',
        text: isDarkMode ? 'text-[#4ADE80]' : 'text-[#15803D]'
      };
    }

    if (similarity >= 0.5) {
      return {
        label: 'Moderate Match',
        color: '#FBBF24',
        background: isDarkMode ? 'bg-[#3B2F08]' : 'bg-[#FEF3C7]',
        text: isDarkMode ? 'text-[#FCD34D]' : 'text-[#B45309]'
      };
    }

    return {
      label: 'Weak Match',
      color: '#EF4444',
      background: isDarkMode ? 'bg-[#3F0D15]' : 'bg-[#FEE2E2]',
      text: isDarkMode ? 'text-[#F87171]' : 'text-[#B91C1C]'
    };
  };

  const analyzedTimestamp = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(new Date());

  const trustedSources = articles.filter((article) => article.similarity >= 0.7);
  const suspiciousSources = articles.filter((article) => article.similarity < 0.7);

  const verificationVerdict = credibilityScore >= 75
    ? {
        label: 'Likely True',
        status: 'Active Analysis',
        accent: '#22C55E',
        glow: 'rgba(34,197,94,0.18)',
        badge: 'Multi-Source Verified'
      }
    : credibilityScore >= 50
      ? {
          label: 'Uncertain',
          status: 'Needs Review',
          accent: '#3B82F6',
          glow: 'rgba(59,130,246,0.18)',
          badge: 'Mixed Signal Pattern'
        }
      : {
          label: 'Likely False',
          status: 'High Risk Signal',
          accent: '#EF4444',
          glow: 'rgba(239,68,68,0.18)',
          badge: 'Conflicting Evidence'
        };

  const trustIndicators = [
    { icon: BadgeCheck, label: 'Multi-Source Verified', accent: '#22C55E' },
    { icon: ScanSearch, label: 'High Similarity', accent: '#22D3EE' },
    { icon: ShieldCheck, label: 'Trusted Publishers', accent: '#3B82F6' }
  ];

  const metricCards = [
    {
      icon: ShieldCheck,
      label: 'Trusted Sources Found',
      value: 12,
      note: 'Independent publishers aligned',
      accent: '#22C55E',
      glow: 'rgba(34,197,94,0.18)'
    },
    {
      icon: ShieldAlert,
      label: 'Suspicious Sources',
      value: 3,
      note: 'Domains flagged for low trust',
      accent: '#EF4444',
      glow: 'rgba(239,68,68,0.18)'
    },
    {
      icon: Clock3,
      label: 'Verification Time',
      value: 2.3,
      decimals: 1,
      suffix: 's',
      note: 'Full pipeline completion',
      accent: '#22D3EE',
      glow: 'rgba(34,211,238,0.18)'
    },
    {
      icon: Bot,
      label: 'AI Confidence Level',
      value: 94,
      suffix: '%',
      note: 'Model certainty rating',
      accent: '#3B82F6',
      glow: 'rgba(59,130,246,0.18)'
    }
  ];

  const explanationPoints = [
    {
      title: 'Multiple trusted publishers report the same core event',
      body: 'Reuters, BBC News, and Associated Press independently describe the same policy movement with closely aligned facts and timing.'
    },
    {
      title: 'High semantic similarity across reliable sources',
      body: 'Similarity scores above 79% indicate that the main details in the submitted claim strongly overlap with trusted reporting.'
    },
    {
      title: 'Limited conflicting evidence from low-credibility outlets',
      body: 'The contradictory headline is concentrated in one unverified source, suggesting exaggeration rather than a broad factual dispute.'
    }
  ];

  const getSourceRating = (similarity: number) => {
    if (similarity >= 0.85) return 'A+';
    if (similarity >= 0.75) return 'A';
    if (similarity >= 0.6) return 'B';
    if (similarity >= 0.4) return 'C';
    return 'D';
  };

  const handleAnalyze = async () => {
    if (!claim.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
    setShowResults(true);
  };

  useEffect(() => {
    if (!shouldAutoAnalyze) return;

    let isMounted = true;

    const autoAnalyze = async () => {
      setIsAnalyzing(true);
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!isMounted) return;

      setIsAnalyzing(false);
      setShowResults(true);
    };

    void autoAnalyze();

    return () => {
      isMounted = false;
    };
  }, [shouldAutoAnalyze]);

  useEffect(() => {
    if (!showResults) return;
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showResults]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setClaim('Government banned petrol cars in 2026');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Verify Claim</h1>
            <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Enter a news claim or upload an image to verify its authenticity</p>
          </div>

          {/* Input Section */}
          <div className={`rounded-2xl border p-8 mb-8 shadow-sm transition-colors ${
            isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <div className="mb-6">
              <label className={`text-sm mb-2 block ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Claim to Verify</label>
              <div className="relative">
                <textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="Enter a news claim to verify..."
                  className={`w-full px-6 py-4 border rounded-xl outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all resize-none ${
                    isDarkMode ? 'bg-[#0F172A] border-[#334155] text-white placeholder:text-[#64748B]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8]'
                  }`}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !claim.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Analyze Claim</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>or</div>

              <label className={`px-6 py-3 border-2 border-dashed rounded-xl hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all flex items-center gap-2 cursor-pointer ${
                isDarkMode ? 'border-[#475569] text-[#94A3B8]' : 'border-[#CBD5E1] text-[#64748B]'
              }`}>
                <Upload className="w-5 h-5" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Results */}
          {showResults && (
            <motion.div
              id="verification-results"
              ref={resultsRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Credibility Score */}
              <div className={`relative overflow-hidden rounded-[28px] border p-8 shadow-sm transition-colors ${
                isDarkMode
                  ? 'bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] border-white/8 shadow-[0_28px_80px_rgba(2,6,23,0.5)]'
                  : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-[#22D3EE]/10 blur-3xl" />
                <div className="absolute left-0 top-0 h-px w-full bg-[linear-gradient(90deg,transparent,#22D3EE,transparent)] opacity-40" />

                <div className="relative space-y-8">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/25 bg-[#22D3EE]/10 px-4 py-1.5 mb-4">
                        <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                        <span className="text-sm text-[#22D3EE]">TruthSeeker AI Verification Dashboard</span>
                      </div>
                      <h2 className={`text-2xl mb-3 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Verification Result</h2>
                      <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>
                        High-clarity intelligence summary built for fact-checkers, newsroom researchers, and trust & safety teams.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {trustIndicators.map((indicator) => {
                        const Icon = indicator.icon;

                        return (
                          <div
                            key={indicator.label}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md"
                            style={{ boxShadow: `0 0 18px ${indicator.accent}14` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: indicator.accent }} />
                            <span className={isDarkMode ? 'text-[#E2E8F0]' : 'text-[#0F172A]'}>{indicator.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1.08fr,0.92fr] gap-6">
                    <div className="space-y-6">
                      <div className={`rounded-2xl border p-6 ${
                        isDarkMode
                          ? 'bg-white/5 border-white/8 backdrop-blur-xl shadow-[0_18px_40px_rgba(2,6,23,0.26)]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0]'
                      }`}>
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Analyzed Claim</p>
                            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{claim}</p>
                          </div>
                          <div className="min-w-[220px] rounded-2xl border border-white/10 bg-[#0B1120]/70 p-4 backdrop-blur-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-60"></span>
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]"></span>
                              </span>
                              <p className="text-sm text-[#22C55E]">{verificationVerdict.status}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                              <CalendarClock className="w-4 h-4 text-[#22D3EE]" />
                              <span>{analyzedTimestamp}</span>
                            </div>
                            <div className="mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs"
                              style={{ borderColor: `${verificationVerdict.accent}44`, color: verificationVerdict.accent, backgroundColor: `${verificationVerdict.accent}18` }}>
                              {verificationVerdict.badge}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-2xl border p-6 ${
                        isDarkMode
                          ? 'bg-[linear-gradient(180deg,rgba(8,15,31,0.94),rgba(17,24,39,0.9))] border-white/8 backdrop-blur-xl'
                          : 'bg-[#F8FAFC] border-[#E2E8F0]'
                      }`}>
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <p className={`text-xs uppercase tracking-[0.18em] mb-1 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Credibility Visualization</p>
                            <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>Hollow shield confidence meter</p>
                          </div>
                          <div
                            className="rounded-full px-3 py-1 text-sm"
                            style={{ backgroundColor: `${verificationVerdict.accent}18`, color: verificationVerdict.accent, boxShadow: `0 0 22px ${verificationVerdict.glow}` }}
                          >
                            {verificationVerdict.label}
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <CredibilityGauge score={credibilityScore} />
                          <div className="w-full max-w-xs space-y-3">
                            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-md">
                              <p className={`text-xs uppercase tracking-[0.16em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Verdict</p>
                              <p className="text-2xl" style={{ color: verificationVerdict.accent }}>{verificationVerdict.label}</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-md">
                              <p className={`text-xs uppercase tracking-[0.16em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Primary Signal</p>
                              <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>High similarity across trusted publishers</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {metricCards.map((metric) => (
                        <MetricCard
                          key={metric.label}
                          icon={metric.icon}
                          label={metric.label}
                          value={metric.value}
                          note={metric.note}
                          accent={metric.accent}
                          glow={metric.glow}
                          isDarkMode={isDarkMode}
                          decimals={metric.decimals}
                          prefix={metric.prefix}
                          suffix={metric.suffix}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Explanation */}
              <div className={`rounded-2xl border p-8 ${
                isDarkMode
                  ? 'bg-[linear-gradient(180deg,rgba(8,15,31,0.94),rgba(15,23,42,0.9))] border-white/8 backdrop-blur-xl shadow-[0_18px_45px_rgba(2,6,23,0.35)]'
                  : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#22D3EE]/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 space-y-5">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>AI Reasoning Panel</p>
                      <h3 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Why TruthSeeker considers this claim credible</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {explanationPoints.map((point, index) => (
                        <motion.div
                          key={point.title}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.12 }}
                          className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}
                        >
                          <p className={`mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{point.title}</p>
                          <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{point.body}</p>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="rounded-2xl border border-[#22D3EE]/15 bg-gradient-to-br from-[#3B82F6]/10 to-[#22D3EE]/5 p-5"
                    >
                      <p className={`leading-relaxed ${isDarkMode ? 'text-[#E2E8F0]' : 'text-[#334155]'}`}>
                        Verdict summary: the submitted claim is consistent with reporting from major publishers, carries a high semantic overlap with trusted source narratives, and does not show strong conflicting evidence beyond a small set of low-credibility amplifiers.
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Evidence Articles */}
              <div className={`rounded-2xl border p-8 shadow-sm transition-colors ${
                isDarkMode
                  ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.84))] border-white/8'
                  : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex flex-col gap-3 mb-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Evidence Sources</p>
                    <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Source Intelligence Breakdown</h2>
                  </div>
                  <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Verified publishers and suspicious amplifiers are separated for faster review.</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#0B1120]/80 border-[#22C55E]/20' : 'bg-[#F8FAFC] border-[#BBF7D0]'}`}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-sm text-[#22C55E]">Verified Trusted Sources</p>
                        <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{trustedSources.length} publishers aligned</p>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                    </div>
                    <div className="space-y-4">
                      {trustedSources.map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className="rounded-2xl border border-[#22C55E]/15 bg-gradient-to-br from-[#22C55E]/12 to-[#22C55E]/5 p-5"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{article.logo}</span>
                                <div>
                                  <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{article.source}</p>
                                  <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{article.date}</p>
                                </div>
                              </div>
                              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>{article.title}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl text-[#22C55E]">{Math.round(article.similarity * 100)}%</p>
                              <p className="text-xs uppercase tracking-[0.16em] text-[#86EFAC]">Similarity</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#22C55E]/20 bg-[#22C55E]/10 px-3 py-1 text-xs text-[#4ADE80]">Credibility {getSourceRating(article.similarity)}</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#94A3B8]">Published {article.date}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#0B1120]/80 border-[#EF4444]/20' : 'bg-[#F8FAFC] border-[#FECACA]'}`}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-sm text-[#EF4444]">Suspicious or Low Credibility Sources</p>
                        <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{suspiciousSources.length} amplifiers require caution</p>
                      </div>
                      <ShieldAlert className="w-5 h-5 text-[#EF4444]" />
                    </div>
                    <div className="space-y-4">
                      {suspiciousSources.map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className={`rounded-2xl border p-5 ${
                            article.similarity >= 0.5
                              ? 'border-[#FBBF24]/20 bg-gradient-to-br from-[#FBBF24]/10 to-[#FBBF24]/5'
                              : 'border-[#EF4444]/20 bg-gradient-to-br from-[#EF4444]/12 to-[#EF4444]/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{article.logo}</span>
                                <div>
                                  <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{article.source}</p>
                                  <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{article.date}</p>
                                </div>
                              </div>
                              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>{article.title}</p>
                            </div>
                            <div className="text-right">
                              <p className={article.similarity >= 0.5 ? 'text-2xl text-[#FBBF24]' : 'text-2xl text-[#EF4444]'}>{Math.round(article.similarity * 100)}%</p>
                              <p className={`text-xs uppercase tracking-[0.16em] ${article.similarity >= 0.5 ? 'text-[#FCD34D]' : 'text-[#FCA5A5]'}`}>Similarity</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs ${article.similarity >= 0.5 ? 'border-[#FBBF24]/20 bg-[#FBBF24]/10 text-[#FCD34D]' : 'border-[#EF4444]/20 bg-[#EF4444]/10 text-[#FCA5A5]'}`}>
                              Credibility {getSourceRating(article.similarity)}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#94A3B8]">Published {article.date}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Similarity Visualization */}
              <div className={`rounded-2xl border p-8 shadow-sm transition-colors ${
                isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className={`text-xl mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Source Similarity Comparison</h2>
                    <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>
                      Compare how closely each source aligns with the core claim and supporting evidence.
                    </p>
                  </div>

                  <div className="flex items-stretch gap-3 lg:flex-nowrap lg:justify-end">
                    <div className="min-w-[170px] rounded-xl px-4 py-3 border bg-gradient-to-br from-[#3B82F6]/12 to-[#3B82F6]/5 border-[#3B82F6]/20">
                      <p className={`text-xs uppercase tracking-[0.18em] ${isDarkMode ? 'text-[#93C5FD]' : 'text-[#1D4ED8]'}`}>Sources Compared</p>
                      <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{articles.length}</p>
                    </div>
                    <div className={`min-w-[170px] rounded-xl px-4 py-3 border ${getAverageMatchMeta(averageSimilarity).container}`}>
                      <p className={`text-xs uppercase tracking-[0.18em] ${getAverageMatchMeta(averageSimilarity).title}`}>Average Match</p>
                      <p className={`text-lg ${getAverageMatchMeta(averageSimilarity).value}`}>{averageSimilarity}%</p>
                      <p className={`text-xs mt-1 ${getAverageMatchMeta(averageSimilarity).title}`}>{getAverageMatchMeta(averageSimilarity).label}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {articles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.35 }}
                      className={`rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${
                        isDarkMode
                          ? 'bg-[#0F172A] border-[#334155] hover:border-[#3B82F6]/30 hover:shadow-lg hover:shadow-[#3B82F6]/10'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                        <div className="flex items-center gap-4 lg:min-w-[290px]">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm ${
                            isDarkMode ? 'bg-[#1E293B] text-white' : 'bg-white text-[#0F172A]'
                          }`}>
                            #{index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{article.source}</p>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${getSimilarityMeta(article.similarity).background} ${getSimilarityMeta(article.similarity).text}`}>
                                {getSimilarityMeta(article.similarity).label}
                              </span>
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{article.date}</p>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Similarity score</span>
                            <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{article.similarity.toFixed(2)}</span>
                          </div>
                          <div className={`relative h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#111827]' : 'bg-white'}`}>
                            <div className="absolute inset-0 opacity-60 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]"></div>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${article.similarity * 100}%` }}
                              transition={{ delay: index * 0.08 + 0.15, duration: 0.7 }}
                              className="h-full rounded-full"
                              style={{
                                background: `linear-gradient(90deg, ${getSimilarityMeta(article.similarity).color}, ${getSimilarityMeta(article.similarity).color}CC)`
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between lg:block lg:min-w-[90px] lg:text-right">
                          <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                            {(article.similarity * 100).toFixed(0)}%
                          </p>
                          <p className={`text-xs uppercase tracking-[0.14em] ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                            Match
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* News Timeline */}
              <div className={`rounded-2xl border p-8 shadow-sm transition-colors ${
                isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex flex-col gap-3 mb-8 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Spread Pattern</p>
                    <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>News Timeline Visualization</h2>
                  </div>
                  <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Track the origin and amplification path from first mention to broader propagation.</p>
                </div>

                <div className="relative">
                  <div className="absolute left-8 right-8 top-9 hidden h-px bg-gradient-to-r from-[#3B82F6] via-[#22D3EE] to-[#22C55E] lg:block"></div>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {timeline.map((event, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative rounded-2xl border p-5 ${isDarkMode ? 'bg-[#0F172A] border-white/8' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] text-white shadow-lg shadow-[#22D3EE]/20">
                            {index + 1}
                          </div>
                          <div>
                            <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{event.source}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{event.date}</p>
                          </div>
                        </div>
                        <p className={`leading-relaxed ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>{event.event}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fake Website Detection */}
              <div className="bg-gradient-to-br from-[#FEE2E2] to-[#FEF2F2] border-2 border-[#FCA5A5] rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#EF4444] rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg text-[#991B1B] mb-3">Suspicious Domain Detected</h3>
                    
                    <div className="bg-white rounded-xl p-4 mb-4">
                      <p className="text-sm text-[#64748B] mb-1">Domain:</p>
                      <p className="text-[#EF4444] font-mono">fakepoliticsnews.com</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4">
                        <p className="text-sm text-[#64748B] mb-1">Status:</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#EF4444] rounded-full animate-pulse"></div>
                          <p className="text-[#EF4444]">Suspicious Domain</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4">
                        <p className="text-sm text-[#64748B] mb-1">VirusTotal Score:</p>
                        <p className="text-[#EF4444]">2/10</p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-white rounded-xl">
                      <p className="text-sm text-[#64748B]">
                        This domain has been flagged by our threat intelligence system. It's known for spreading misinformation 
                        and has a low credibility rating. We recommend verifying information from this source with trusted news outlets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Language Translation */}
              <div className={`rounded-2xl border p-8 shadow-sm transition-colors ${
                isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center gap-2 mb-6">
                  <Globe className="w-5 h-5 text-[#3B82F6]" />
                  <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Language Translation</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Select Language:</p>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all ${
                        isDarkMode ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'
                      }`}
                    >
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Arabic</option>
                      <option>Chinese</option>
                      <option>Japanese</option>
                    </select>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#3B82F6]/5 to-[#22D3EE]/5 border border-[#3B82F6]/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className={`text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Auto-Translation Enabled</p>
                        <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                          Claims are automatically translated before verification analysis to ensure accurate results across all supported languages.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cross-Platform Verification */}
              <div className={`rounded-2xl border p-8 shadow-sm transition-colors ${
                isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <h2 className={`text-xl mb-6 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Cross-Platform Verification</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-[#1DA1F2]/10 to-[#1DA1F2]/5 border border-[#1DA1F2]/20 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1DA1F2]/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <span className="text-white text-lg font-semibold leading-none">X</span>
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>X</p>
                        <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>47 Mentions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#22C55E] rounded-full"></div>
                      <p className="text-sm text-[#22C55E]">Verified</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-[#1877F2]/10 to-[#1877F2]/5 border border-[#1877F2]/20 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1877F2]/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#1877F2] rounded-xl flex items-center justify-center">
                        <Facebook className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Facebook</p>
                        <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>89 Shares</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#EF4444] rounded-full"></div>
                      <p className="text-sm text-[#EF4444]">Mixed Sources</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-[#E1306C]/10 to-[#F77737]/5 border border-[#E1306C]/20 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#E1306C]/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#E1306C] rounded-xl flex items-center justify-center">
                        <Instagram className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Instagram</p>
                        <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>63 Posts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#FBBF24] rounded-full"></div>
                      <p className="text-sm text-[#FBBF24]">Monitoring</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-[#FF6B00]/10 to-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#FF6B00]/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#FF6B00] rounded-xl flex items-center justify-center">
                        <Newspaper className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>News Sources</p>
                        <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>124 Articles</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#22C55E] rounded-full"></div>
                      <p className="text-sm text-[#22C55E]">Verified</p>
                    </div>
                  </motion.div>
                </div>

                <div className={`mt-6 p-4 rounded-xl ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    <strong className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>Cross-platform analysis:</strong> This claim has been detected across multiple social media platforms and news sources.
                    The verification engine monitors news websites, Instagram posts, and social media mentions to provide comprehensive fact-checking coverage.
                  </p>
                </div>
              </div>

              {/* Image Verification (if image uploaded) */}
              {uploadedImage && (
                <div className={`rounded-2xl border p-8 shadow-sm transition-colors ${
                  isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="flex items-center gap-2 mb-6">
                    <ImageIcon className="w-5 h-5 text-[#3B82F6]" />
                    <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Image Claim Verification</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Uploaded Image:</p>
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className={`w-full rounded-xl border ${isDarkMode ? 'border-[#334155]' : 'border-[#E2E8F0]'}`}
                      />
                    </div>

                    <div>
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Extracted Text:</p>
                      <div className={`rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
                        <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{claim}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-[#22C55E]/10 to-[#22C55E]/5 border border-[#22C55E]/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-[#22C55E] mb-1">Text Successfully Extracted</p>
                            <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                              The claim has been extracted and analyzed against our database of trusted sources.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Empty State */}
          {!showResults && !isAnalyzing && (
            <div className={`rounded-2xl border-2 border-dashed p-16 text-center transition-colors ${
              isDarkMode ? 'bg-[#1E293B] border-[#475569]' : 'bg-white border-[#CBD5E1]'
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'
              }`}>
                <Sparkles className="w-8 h-8 text-[#94A3B8]" />
              </div>
              <h3 className={`text-xl mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Ready to Verify</h3>
              <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Enter a claim above or upload an image to start the verification process</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}