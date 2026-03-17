import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Facebook,
  Newspaper,
  Instagram,
  ShieldCheck,
  ShieldAlert,
  Clock3,
  Bot,
  BadgeCheck,
  ScanSearch,
  CalendarClock,
  FileBarChart2,
  Shield,
  Globe as GlobeIcon,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { CredibilityGauge } from '../components/CredibilityGauge';
import { NetworkBackground } from '../components/NetworkBackground';
import { useDarkMode } from '../components/DarkModeContext';
import { useLanguage } from '../components/LanguageContext';
import { analyzeRedditPropagation, verifyClaim, type RedditPropagationResponse, type VerifyClaimResponse } from '../services/api';

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

interface SpreadTimelineEvent {
  title: string;
  detail: string;
  time: string;
  metric: string;
  dotColor: string;
  lineColor: string;
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

interface SpreadTimelinePanelProps {
  eyebrow: string;
  heading: string;
  events: SpreadTimelineEvent[];
  isDarkMode: boolean;
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
          ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.72))] border-white/8 backdrop-blur-xl hover:border-white/20'
          : 'bg-white/90 border-[#E2E8F0] backdrop-blur-xl hover:border-[#BFDBFE]'
      }`}
      style={{ 
        boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 18px 40px ${glow}`,
        borderColor: 'inherit'
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLDivElement;
        target.style.borderColor = accent;
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLDivElement;
        target.style.borderColor = 'inherit';
      }}
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

function SpreadTimelinePanel({ eyebrow, heading, events, isDarkMode }: SpreadTimelinePanelProps) {
  return (
    <div
      className={`rounded-[28px] border overflow-hidden ${
        isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'
      }`}
    >
      <div className="p-8 pb-6 border-b border-white/10">
        <p className={`text-xs uppercase tracking-[0.24em] mb-2 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{eyebrow}</p>
        <h4 className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{heading}</h4>
      </div>

      <div className="p-8 space-y-6">
        {events.map((event, index) => {
          const isLast = index === events.length - 1;

          return (
            <motion.div
              key={`${event.title}-${event.time}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
              className="flex gap-4"
            >
              <div className="relative flex flex-col items-center pt-1">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: event.dotColor,
                    borderColor: `${event.dotColor}4d`,
                    boxShadow: `0 0 18px ${event.dotColor}66`
                  }}
                />
                {!isLast && (
                  <div
                    className="w-0.5 h-20 mt-2"
                    style={{ background: `linear-gradient(180deg, ${event.lineColor}66, ${event.lineColor}12)` }}
                  />
                )}
              </div>
              <div className={isLast ? '' : 'pb-6'}>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{event.title}</p>
                <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{event.detail}</p>
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{event.time} • {event.metric}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function VerifyClaim() {
  const location = useLocation();
  const navigationState = location.state as { claim?: string; claimText?: string; autoAnalyze?: boolean; source?: string } | null;
  const initialClaim = navigationState?.claim || navigationState?.claimText || '';
  const shouldAutoAnalyze = Boolean((navigationState?.autoAnalyze || navigationState?.source === 'history') && initialClaim.trim());
  const { isDarkMode } = useDarkMode();
  const { t, locale } = useLanguage();
  const navigate = useNavigate();

  const [claim, setClaim] = useState(initialClaim);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<VerifyClaimResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<Date | null>(null);
  const [lastAnalyzedClaim, setLastAnalyzedClaim] = useState(initialClaim);
  const [activePlatform, setActivePlatform] = useState<'reddit' | 'x' | 'facebook' | 'instagram' | 'news' | null>(null);
  const [redditData, setRedditData] = useState<RedditPropagationResponse | null>(null);
  const [redditError, setRedditError] = useState<string | null>(null);
  const [isLoadingReddit, setIsLoadingReddit] = useState(false);
  const [isLoadingX, setIsLoadingX] = useState(false);
  const [isLoadingFacebook, setIsLoadingFacebook] = useState(false);
  const [isLoadingInstagram, setIsLoadingInstagram] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const articles: Article[] = verificationData?.sources?.length
    ? verificationData.sources.map((source, index) => {
        const similarityRaw = typeof source.similarity_score === 'number' ? source.similarity_score : 45;
        const similarity = similarityRaw > 1 ? similarityRaw / 100 : similarityRaw;

        return {
          id: index + 1,
          title: source.title || source.description || t('verifyEvidenceItem', { index: index + 1 }),
          source: source.source || t('verifyUnknownSource'),
          date: analyzedAt
            ? analyzedAt.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })
            : t('verifyLiveNow'),
          similarity: Math.max(0, Math.min(similarity, 1)),
          url: source.url || '#',
          logo: '📰'
        };
      })
    : [];

  const timeline: TimelineEvent[] = [
    { date: 'Jan 4, 2026', event: t('verifyTimelineEventInitialMention'), source: t('verifyTimelineSourceSocialMedia') },
    { date: 'Jan 5, 2026', event: t('verifyTimelineEventFirstTrusted'), source: t('verifyTimelineSourceReuters') },
    { date: 'Jan 6, 2026', event: t('verifyTimelineEventSecondaryConfirmation'), source: t('verifyTimelineSourceBBC') },
    { date: 'Jan 7, 2026', event: t('verifyTimelineEventAmplificationWave'), source: t('verifyTimelineSourceBlogs') }
  ];

  const averageSimilarity = articles.length
    ? Math.round((articles.reduce((total, article) => total + article.similarity, 0) / articles.length) * 100)
    : 0;

  const getAverageMatchMeta = (similarity: number) => {
    if (similarity >= 85) {
      return {
        label: t('verifyAverageFullyMatching'),
        container: 'bg-gradient-to-br from-[#22C55E]/12 to-[#22C55E]/5 border-[#22C55E]/20',
        title: isDarkMode ? 'text-[#86EFAC]' : 'text-[#166534]',
        value: isDarkMode ? 'text-[#F0FDF4]' : 'text-[#14532D]'
      };
    }

    if (similarity >= 70) {
      return {
        label: t('verifyAverageMostlyMatching'),
        container: 'bg-gradient-to-br from-[#FBBF24]/12 to-[#FBBF24]/5 border-[#FBBF24]/20',
        title: isDarkMode ? 'text-[#FDE68A]' : 'text-[#A16207]',
        value: isDarkMode ? 'text-[#FFFBEB]' : 'text-[#854D0E]'
      };
    }

    if (similarity >= 40) {
      return {
        label: t('verifyAveragePartiallyMatching'),
        container: 'bg-gradient-to-br from-[#F97316]/12 to-[#F97316]/5 border-[#F97316]/20',
        title: isDarkMode ? 'text-[#FDBA74]' : 'text-[#C2410C]',
        value: isDarkMode ? 'text-[#FFF7ED]' : 'text-[#9A3412]'
      };
    }

    return {
      label: t('verifyAverageNotMatching'),
      container: 'bg-gradient-to-br from-[#EF4444]/12 to-[#EF4444]/5 border-[#EF4444]/20',
      title: isDarkMode ? 'text-[#FCA5A5]' : 'text-[#B91C1C]',
      value: isDarkMode ? 'text-[#FEF2F2]' : 'text-[#7F1D1D]'
    };
  };

  const getSimilarityMeta = (similarity: number) => {
    if (similarity >= 0.75) {
      return {
        label: t('verifyStrongMatch'),
        color: '#22C55E',
        background: isDarkMode ? 'bg-[#052E1A]' : 'bg-[#DCFCE7]',
        text: isDarkMode ? 'text-[#4ADE80]' : 'text-[#15803D]'
      };
    }

    if (similarity >= 0.5) {
      return {
        label: t('verifyModerateMatch'),
        color: '#FBBF24',
        background: isDarkMode ? 'bg-[#3B2F08]' : 'bg-[#FEF3C7]',
        text: isDarkMode ? 'text-[#FCD34D]' : 'text-[#B45309]'
      };
    }

    return {
      label: t('verifyWeakMatch'),
      color: '#EF4444',
      background: isDarkMode ? 'bg-[#3F0D15]' : 'bg-[#FEE2E2]',
      text: isDarkMode ? 'text-[#F87171]' : 'text-[#B91C1C]'
    };
  };

  const analyzedTimestamp = new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(analyzedAt || new Date());

  const credibilityScore = Math.round(Number(verificationData?.credibility_score ?? 82));

  const trustedSources = articles.filter((article) => article.similarity >= 0.7);
  const suspiciousSources = articles.filter((article) => article.similarity < 0.7);
  const hasThreatSignal = suspiciousSources.length > 0 || credibilityScore < 50;
  const threatPanelTheme = hasThreatSignal
    ? {
        eyebrow: t('verifyThreatIntelligence'),
        headline: t('verifyThreatHeadlineSuspicious'),
        description: t('verifyThreatDescriptionSuspicious'),
        badge: t('verifyThreatBadgeHighRisk'),
        domainText: t('verifyThreatDomainRisk'),
        statusText: t('verifyThreatStatusSuspicious'),
        score: 2,
        topBar: 'linear-gradient(90deg, #EF4444, #F97316, #CA8A04)',
        orbTop: 'rgba(239,68,68,0.12)',
        orbBottom: 'linear-gradient(90deg, rgba(239,68,68,0.08), transparent)',
        panelBorderDark: 'border-white/8',
        panelBorderLight: 'border-[#E2E8F0]',
        iconSurface: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))',
        iconColor: '#F87171',
        eyebrowDark: 'text-[#F87171]',
        eyebrowLight: 'text-[#DC2626]',
        badgeBorder: 'rgba(239,68,68,0.3)',
        badgeSurface: 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
        badgeText: '#EF4444',
        metricCardDark: 'bg-gradient-to-br from-[#1F2937] to-[#111827] border-[#374151]/60 hover:border-[#F87171]/40 hover:shadow-[0_16px_32px_rgba(239,68,68,0.12)]',
        metricCardLight: 'bg-gradient-to-br from-white to-[#F9FAFB] border-[#E5E7EB] hover:border-[#FCA5A5] hover:shadow-lg',
        metricIconSurface: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))',
        metricIconHoverSurface: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.2))',
        metricAccent: '#EF4444',
        metricMutedDark: 'text-[#9CA3AF]',
        metricMutedLight: 'text-[#6B7280]',
        buttonDark: 'bg-gradient-to-r from-[#EF4444]/12 to-[#F97316]/8 border-[#EF4444]/30 hover:border-[#EF4444]/60 hover:shadow-[0_20px_40px_rgba(239,68,68,0.15)]',
        buttonLight: 'bg-gradient-to-r from-[#FEE2E2] to-[#FEF3C7] border-[#FCA5A5] hover:border-[#F87171] hover:shadow-lg',
        buttonIcon: 'linear-gradient(135deg, #EF4444, #F97316)',
        buttonTitleLight: 'text-[#7F1D1D]',
        buttonSubtitleLight: 'text-[#B45309]',
        actionText: '#EF4444',
      }
    : {
        eyebrow: t('verifyThreatIntelligence'),
        headline: t('verifyThreatHeadlineSafe'),
        description: t('verifyThreatDescriptionSafe'),
        badge: t('verifyThreatBadgeLowRisk'),
        domainText: t('verifyThreatDomainSafe'),
        statusText: t('verifyThreatStatusSafe'),
        score: 8,
        topBar: 'linear-gradient(90deg, #22C55E, #10B981, #14B8A6)',
        orbTop: 'rgba(34,197,94,0.12)',
        orbBottom: 'linear-gradient(90deg, rgba(34,197,94,0.08), transparent)',
        panelBorderDark: 'border-white/8',
        panelBorderLight: 'border-[#D1FAE5]',
        iconSurface: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))',
        iconColor: '#22C55E',
        eyebrowDark: 'text-[#4ADE80]',
        eyebrowLight: 'text-[#15803D]',
        badgeBorder: 'rgba(34,197,94,0.28)',
        badgeSurface: 'linear-gradient(90deg, rgba(34,197,94,0.16), rgba(16,185,129,0.06))',
        badgeText: '#22C55E',
        metricCardDark: 'bg-gradient-to-br from-[#14231C] to-[#111827] border-[#2C4A3A]/70 hover:border-[#4ADE80]/45 hover:shadow-[0_16px_32px_rgba(34,197,94,0.12)]',
        metricCardLight: 'bg-gradient-to-br from-white to-[#F0FDF4] border-[#BBF7D0] hover:border-[#4ADE80] hover:shadow-lg',
        metricIconSurface: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))',
        metricIconHoverSurface: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.18))',
        metricAccent: '#22C55E',
        metricMutedDark: 'text-[#9CA3AF]',
        metricMutedLight: 'text-[#6B7280]',
        buttonDark: 'bg-gradient-to-r from-[#22C55E]/14 to-[#14B8A6]/10 border-[#22C55E]/30 hover:border-[#4ADE80]/60 hover:shadow-[0_20px_40px_rgba(34,197,94,0.14)]',
        buttonLight: 'bg-gradient-to-r from-[#DCFCE7] to-[#CCFBF1] border-[#86EFAC] hover:border-[#22C55E] hover:shadow-lg',
        buttonIcon: 'linear-gradient(135deg, #22C55E, #14B8A6)',
        buttonTitleLight: 'text-[#14532D]',
        buttonSubtitleLight: 'text-[#0F766E]',
        actionText: '#22C55E',
      };
  const ThreatPanelIcon = hasThreatSignal ? AlertTriangle : ShieldCheck;

  const fallbackVerdictLabel = credibilityScore >= 75
    ? t('verifyFallbackVerdictTrue')
    : credibilityScore >= 50
      ? t('historyStatusUncertain')
      : t('verifyFallbackVerdictFalse');
  const verdictLabel = verificationData?.verdict || fallbackVerdictLabel;

  const verificationVerdict = credibilityScore >= 75
    ? {
        label: verdictLabel,
        status: verificationData ? t('verifyLiveBackendAnalysis') : t('verifyActiveAnalysis'),
        accent: '#22C55E',
        glow: 'rgba(34,197,94,0.18)',
        badge: verificationData?.status === 'found' ? t('verifyServedHistory') : t('verifyMultiSourceVerified')
      }
    : credibilityScore >= 50
      ? {
          label: verdictLabel,
          status: verificationData ? t('verifyLiveBackendAnalysis') : t('verifyNeedsReview'),
          accent: '#3B82F6',
          glow: 'rgba(59,130,246,0.18)',
          badge: verificationData?.status === 'found' ? t('verifyServedHistory') : t('verifyMixedSignalPattern')
        }
      : {
          label: verdictLabel,
          status: verificationData ? t('verifyLiveBackendAnalysis') : t('verifyHighRiskSignal'),
          accent: '#EF4444',
          glow: 'rgba(239,68,68,0.18)',
          badge: verificationData?.status === 'found' ? t('verifyServedHistory') : t('verifyConflictingEvidence')
        };

  const trustIndicators = [
    { icon: BadgeCheck, label: t('verifyMultiSourceVerified'), accent: '#22C55E' },
    { icon: ScanSearch, label: t('verifyHighSimilarity'), accent: '#22D3EE' },
    { icon: ShieldCheck, label: t('verifyTrustedPublishers'), accent: '#3B82F6' }
  ];

  const metricCards = [
    {
      icon: ShieldCheck,
      label: t('verifyTrustedSourcesFound'),
      value: trustedSources.length,
      note: t('verifyLiveEvidenceBackend'),
      accent: '#22C55E',
      glow: 'rgba(34,197,94,0.18)'
    },
    {
      icon: ShieldAlert,
      label: t('verifySuspiciousSources'),
      value: suspiciousSources.length,
      note: t('verifyNeedsAdditionalVerification'),
      accent: '#EF4444',
      glow: 'rgba(239,68,68,0.18)'
    },
    {
      icon: Clock3,
      label: t('verifyVerificationTime'),
      value: 2.3,
      decimals: 1,
      suffix: 's',
      note: verificationData?.status === 'found' ? t('verifyServedCacheHistory') : t('verifyFullBackendPipeline'),
      accent: '#22D3EE',
      glow: 'rgba(34,211,238,0.18)'
    },
    {
      icon: Bot,
      label: t('verifyAiConfidenceLevel'),
      value: credibilityScore,
      suffix: '%',
      note: t('verifyModelCertainty'),
      accent: '#3B82F6',
      glow: 'rgba(59,130,246,0.18)'
    }
  ];

  const summaryText = verificationData?.summary || t('verifySummaryFallback');
  const summaryParts = summaryText.split(/(?<=[.!?])\s+/).filter(Boolean);

  const explanationPoints = [
    {
      title: t('verifySystemSummaryInsight'),
      body: summaryParts[0] || summaryText
    },
    {
      title: t('verifyCrossSourceConsistency'),
      body: summaryParts[1] || t('verifyCrossSourceConsistencyBody')
    },
    {
      title: t('verifyConflictingEvidenceCheck'),
      body: summaryParts[2] || t('verifyConflictingEvidenceBody')
    }
  ];

  const redditSpreadNodes = redditData?.analysis.spread_nodes ?? 0;
  const redditEventsCount = redditData?.events_count ?? 0;
  const redditPatientZero = redditData?.analysis.patient_zero ?? t('verifyNoPrimarySource');
  const redditSuperSpreader = redditData?.analysis.super_spreader ?? t('verifyNoAmplificationLeader');

  const platformSpreadTimelines = {
    reddit: {
      eyebrow: t('verifyNarrativeSpreadTimeline'),
      heading: t('verifyPropagationEvents'),
      events: [
        {
          title: t('verifyTimelineClaimPosted'),
          detail: t('verifyTimelineClaimPostedDetail'),
          time: t('verifyTimeHoursAgo', { n: 3 }),
          metric: t('verifyMetricOneNode'),
          dotColor: '#FF4500',
          lineColor: '#FF4500'
        },
        {
          title: t('verifyTimelineInitialSpread'),
          detail: t('verifyTimelineInitialSpreadDetail'),
          time: t('verifyTimeHoursAgo', { n: 2 }),
          metric: t('verifyMetricNodes', { count: 4 }),
          dotColor: '#FFB366',
          lineColor: '#FFB366'
        },
        {
          title: t('verifyTimelinePeakEngagement'),
          detail: t('verifyTimelinePeakEngagementDetail'),
          time: t('verifyTimeOneHourAgo'),
          metric: t('verifyMetricNodes', { count: 6 }),
          dotColor: '#FF8A5B',
          lineColor: '#FF8A5B'
        },
        {
          title: t('verifyTimelineCurrentStatus'),
          detail: t('verifyTimelineCurrentStatusDetailReddit'),
          time: t('verifyNow'),
          metric: t('verifyTotalNodesTracked', { count: redditSpreadNodes || 11 }),
          dotColor: '#FBBF24',
          lineColor: '#FBBF24'
        }
      ]
    },
    x: {
      eyebrow: t('verifyNarrativeSpreadTimeline'),
      heading: t('verifyPostVelocityX'),
      events: [
        {
          title: t('verifyTimelineFirstPostDetected'),
          detail: t('verifyTimelineFirstPostDetectedDetail'),
          time: t('verifyTimeHoursAgo', { n: 4 }),
          metric: t('verifyMetricOnePost'),
          dotColor: '#1DA1F2',
          lineColor: '#1DA1F2'
        },
        {
          title: t('verifyTimelineRetweetBurst'),
          detail: t('verifyTimelineRetweetBurstDetail'),
          time: t('verifyTimeHoursAgo', { n: 3 }),
          metric: t('verifyMetricRetweets', { count: 24 }),
          dotColor: '#60A5FA',
          lineColor: '#60A5FA'
        },
        {
          title: t('verifyTimelineReplyVolumeRose'),
          detail: t('verifyTimelineReplyVolumeRoseDetail'),
          time: t('verifyTimeMinutesAgo', { n: 90 }),
          metric: t('verifyMetricReplies', { count: 57 }),
          dotColor: '#38BDF8',
          lineColor: '#38BDF8'
        },
        {
          title: t('verifyTimelineCurrentStatus'),
          detail: t('verifyTimelineCurrentStatusDetailX'),
          time: t('verifyNow'),
          metric: t('verifyMentionsLive', { count: 47 }),
          dotColor: '#22C55E',
          lineColor: '#22C55E'
        }
      ]
    },
    facebook: {
      eyebrow: t('verifyNarrativeSpreadTimeline'),
      heading: t('verifyCommunityDistributionFlow'),
      events: [
        {
          title: t('verifyTimelineInitialShare'),
          detail: t('verifyTimelineInitialShareDetail'),
          time: t('verifyTimeHoursAgo', { n: 5 }),
          metric: t('verifyMetricOneShare'),
          dotColor: '#1877F2',
          lineColor: '#1877F2'
        },
        {
          title: t('verifyTimelinePageToGroupSpread'),
          detail: t('verifyTimelinePageToGroupSpreadDetail'),
          time: t('verifyTimeDecimalHoursAgo', { n: '3.5' }),
          metric: t('verifyMetricShares', { count: 28 }),
          dotColor: '#60A5FA',
          lineColor: '#60A5FA'
        },
        {
          title: t('verifyTimelineReactionSurge'),
          detail: t('verifyTimelineReactionSurgeDetail'),
          time: t('verifyTimeHoursAgo', { n: 2 }),
          metric: t('verifyMetricComments', { count: 124 }),
          dotColor: '#93C5FD',
          lineColor: '#93C5FD'
        },
        {
          title: t('verifyTimelineCurrentStatus'),
          detail: t('verifyTimelineCurrentStatusDetailFacebook'),
          time: t('verifyNow'),
          metric: t('verifySharesTracked', { count: 89 }),
          dotColor: '#EF4444',
          lineColor: '#EF4444'
        }
      ]
    },
    instagram: {
      eyebrow: t('verifyNarrativeSpreadTimeline'),
      heading: t('verifyVisualPropagationSequence'),
      events: [
        {
          title: t('verifyTimelineStoryUpload'),
          detail: t('verifyTimelineStoryUploadDetail'),
          time: t('verifyTimeHoursAgo', { n: 6 }),
          metric: t('verifyMetricOneStory'),
          dotColor: '#E1306C',
          lineColor: '#E1306C'
        },
        {
          title: t('verifyTimelineReelReposts'),
          detail: t('verifyTimelineReelRepostsDetail'),
          time: t('verifyTimeHoursAgo', { n: 4 }),
          metric: t('verifyMetricReposts', { count: 18 }),
          dotColor: '#F472B6',
          lineColor: '#F472B6'
        },
        {
          title: t('verifyTimelineCommentSpike'),
          detail: t('verifyTimelineCommentSpikeDetail'),
          time: t('verifyTimeHoursAgo', { n: 2 }),
          metric: t('verifyMetricComments', { count: 421 }),
          dotColor: '#FB7185',
          lineColor: '#FB7185'
        },
        {
          title: t('verifyTimelineCurrentStatus'),
          detail: t('verifyTimelineCurrentStatusDetailInstagram'),
          time: t('verifyNow'),
          metric: t('verifyPostsActive', { count: 63 }),
          dotColor: '#FBBF24',
          lineColor: '#FBBF24'
        }
      ]
    },
    news: {
      eyebrow: t('verifyNarrativeSpreadTimeline'),
      heading: t('verifyCoverageExpansionTimeline'),
      events: [
        {
          title: t('verifyTimelineFirstPickup'),
          detail: t('verifyTimelineFirstPickupDetail'),
          time: t('verifyTimeHoursAgo', { n: 8 }),
          metric: t('verifyMetricOneArticle'),
          dotColor: '#FF6B00',
          lineColor: '#FF6B00'
        },
        {
          title: t('verifyTimelineWireDistribution'),
          detail: t('verifyTimelineWireDistributionDetail'),
          time: t('verifyTimeHoursAgo', { n: 5 }),
          metric: t('verifyMetricArticles', { count: 22 }),
          dotColor: '#FB923C',
          lineColor: '#FB923C'
        },
        {
          title: t('verifyTimelineTieredCoverageSplit'),
          detail: t('verifyTimelineTieredCoverageSplitDetail'),
          time: t('verifyTimeHoursAgo', { n: 3 }),
          metric: t('verifyMetricTierOneMentions', { count: 47 }),
          dotColor: '#FDBA74',
          lineColor: '#FDBA74'
        },
        {
          title: t('verifyTimelineCurrentStatus'),
          detail: t('verifyTimelineCurrentStatusDetailNews'),
          time: t('verifyNow'),
          metric: t('verifyArticlesTracked', { count: 124 }),
          dotColor: '#22C55E',
          lineColor: '#22C55E'
        }
      ]
    }
  } as const;

  const explanationHeadline = credibilityScore >= 75
    ? t('verifyExplanationHeadlineHigh')
    : credibilityScore >= 50
      ? t('verifyExplanationHeadlineMedium')
      : t('verifyExplanationHeadlineLow');

  const practicalTakeaway = credibilityScore >= 75
    ? t('verifyPracticalTakeawayHigh')
    : credibilityScore >= 50
      ? t('verifyPracticalTakeawayMedium')
      : t('verifyPracticalTakeawayLow');

  const hasPendingClaimChanges = Boolean(showResults && lastAnalyzedClaim.trim() && claim.trim() !== lastAnalyzedClaim.trim());

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
    setShowResults(false);
    setAnalysisError(null);
    setActivePlatform(null);
    setRedditData(null);
    setRedditError(null);

    try {
      const response = await verifyClaim(claim.trim());
      setVerificationData(response);
      setAnalyzedAt(new Date());
      setLastAnalyzedClaim(claim.trim());
      setShowResults(true);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : t('verifyBackendError'));
      setShowResults(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const imageData = loadEvent.target?.result;

      if (typeof imageData === 'string') {
        setUploadedImage(imageData);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleClaimKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();

    if (!isAnalyzing && claim.trim()) {
      void handleAnalyze();
    }
  };

  const handleOpenPlatform = async (platform: 'reddit' | 'x' | 'facebook' | 'instagram' | 'news') => {
    setActivePlatform(activePlatform === platform ? null : platform);

    if (activePlatform === platform) return;

    if (platform === 'reddit' && !claim.trim()) return;

    if (platform === 'reddit' && !isLoadingReddit && !redditData) {
      setIsLoadingReddit(true);
      try {
        const response = await analyzeRedditPropagation({
          query: claim.trim(),
          limit: 10,
          include_comments: true,
          comments_per_post: 5,
        });
        setRedditData(response);
      } catch (error) {
        // Error handled in UI
      } finally {
        setIsLoadingReddit(false);
      }
    } else if (platform === 'x' && !isLoadingX) {
      setIsLoadingX(true);
      setTimeout(() => setIsLoadingX(false), 500);
    } else if (platform === 'facebook' && !isLoadingFacebook) {
      setIsLoadingFacebook(true);
      setTimeout(() => setIsLoadingFacebook(false), 500);
    } else if (platform === 'instagram' && !isLoadingInstagram) {
      setIsLoadingInstagram(true);
      setTimeout(() => setIsLoadingInstagram(false), 500);
    } else if (platform === 'news' && !isLoadingNews) {
      setIsLoadingNews(true);
      setTimeout(() => setIsLoadingNews(false), 500);
    }
  };

  useEffect(() => {
    if (!shouldAutoAnalyze) return;

    void handleAnalyze();
  }, [shouldAutoAnalyze]);

  useEffect(() => {
    if (!showResults) return;
    const frame = window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [showResults]);

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl mb-2 flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${isDarkMode ? 'bg-[#1E293B] text-[#22D3EE]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
                <ScanSearch className="w-5 h-5" />
              </span>
              {t('verifyTitle')}
            </h1>
            <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{t('verifySubtitle')}</p>
          </div>

          {/* Input Section */}
          <div className={`relative mb-8 overflow-hidden rounded-3xl border p-6 sm:p-8 transition-colors ${
            isDarkMode
              ? 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_42%),linear-gradient(135deg,rgba(9,16,34,0.98),rgba(21,32,52,0.95))] border-white/10 shadow-[0_28px_80px_rgba(2,6,23,0.5)]'
              : 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_42%),linear-gradient(180deg,#FFFFFF,#F8FAFC)] border-[#E2E8F0] shadow-[0_16px_45px_rgba(15,23,42,0.09)]'
          }`}>
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#3B82F6]/14 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[#22D3EE]/10 blur-3xl" />
            <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-[linear-gradient(90deg,transparent,#22D3EE,transparent)] opacity-40" />

            <div className="relative space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-[20px] font-semibold uppercase tracking-[0.12em] flex items-center gap-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${isDarkMode ? 'bg-[#1E293B] text-[#22D3EE]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    {t('verifyCredibilityVisualization')}
                  </p>
                </div>
                <div className={`rounded-full border px-3 py-1 text-xs ${isDarkMode ? 'border-white/10 bg-white/5 text-[#93C5FD]' : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'}`}>
                  {t('verifyFactCheckAssistant')}
                </div>
              </div>

              <div className={`rounded-2xl border p-3 ${isDarkMode ? 'bg-[#0A1226]/90 border-[#1E293B]' : 'bg-white/95 border-[#E2E8F0]'}`}>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.14em] ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyClaimToVerify')}</label>
                <textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  onKeyDown={handleClaimKeyDown}
                  placeholder={t('verifyClaimPlaceholder')}
                  className={`w-full resize-none rounded-xl border px-4 py-4 text-[15px] leading-relaxed outline-none transition-all focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 ${
                    isDarkMode
                      ? 'bg-[#0B1120] border-[#1E293B] text-white placeholder:text-[#475569] focus:bg-[#0D1526]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8]'
                  }`}
                  rows={4}
                />
                <p className={`mt-2 text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  {t('verifyEnterHint')}
                </p>
              </div>

              {hasPendingClaimChanges && !isAnalyzing && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${
                  isDarkMode
                    ? 'border-[#22D3EE]/25 bg-[#22D3EE]/10 text-[#BAE6FD]'
                    : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
                }`}>
                  {t('verifyPendingChanges')}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => void handleAnalyze()}
                  disabled={isAnalyzing || !claim.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] px-6 py-3 font-medium text-white transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-[#3B82F6]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none sm:w-auto"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>{t('verifyAnalyzing')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>{t('verifyAnalyzeClaim')}</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <div className={`hidden text-sm sm:block ${isDarkMode ? 'text-[#475569]' : 'text-[#CBD5E1]'}`}>{t('verifyOr')}</div>

                <label className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-5 py-3 font-medium transition-all hover:border-[#3B82F6] hover:text-[#3B82F6] sm:w-auto ${
                  isDarkMode
                    ? 'border-[#1E293B] bg-[#0B1120] text-[#64748B] hover:bg-[#0D1526]'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:bg-white'
                }`}>
                  <Upload className="h-4 w-4" />
                  <span>{t('verifyUploadImage')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {analysisError && (
                <div className="mt-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
                  {analysisError}
                </div>
              )}

              {verificationData?.warning && (
                <div className="mt-4 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-3 text-sm text-[#FCD34D]">
                  {verificationData.warning}
                </div>
              )}
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
                <div className="absolute left-0 top-0 h-px w-full bg-[linear-gradient(90deg,transparent,#FACC15,transparent)] opacity-70" />

                <div className="relative space-y-8">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/25 bg-[#22D3EE]/10 px-4 py-1.5 mb-4">
                        <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                        <span className="text-sm text-[#22D3EE]">{t('verifyAiDashboardLabel')}</span>
                      </div>
                      <h2 className={`text-2xl mb-3 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyResultTitle')}</h2>
                      <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>
                        {t('verifyResultSubtitle')}
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
                            <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyAnalyzedClaim')}</p>
                            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{claim}</p>
                          </div>
                          <div className={`min-w-[220px] rounded-2xl border p-4 ${
                            isDarkMode
                              ? 'border-white/10 bg-[#0B1120]/70 backdrop-blur-xl'
                              : 'border-[#CBD5E1] bg-white shadow-sm'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-60"></span>
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]"></span>
                              </span>
                              <p className={`text-sm ${isDarkMode ? 'text-[#22C55E]' : 'text-[#16A34A]'}`}>{verificationVerdict.status}</p>
                            </div>
                            <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                              <CalendarClock className={`w-4 h-4 ${isDarkMode ? 'text-[#22D3EE]' : 'text-[#0891B2]'}`} />
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
                            <p className={`text-xs uppercase tracking-[0.18em] mb-1 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyCredibilityVisualization')}</p>
                            <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{t('verifyCredibilityMeterTitle')}</p>
                          </div>
                          <div
                            className="rounded-full px-3 py-1 text-sm"
                            style={{ backgroundColor: `${verificationVerdict.accent}18`, color: verificationVerdict.accent, boxShadow: `0 0 22px ${verificationVerdict.glow}` }}
                          >
                            {verificationVerdict.label}
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <CredibilityGauge score={credibilityScore} isDarkMode={isDarkMode} />
                          <div className="w-full max-w-xs space-y-3">
                            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-md">
                              <p className={`text-xs uppercase tracking-[0.16em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyVerdictLabel')}</p>
                              <p className="text-2xl" style={{ color: verificationVerdict.accent }}>{verificationVerdict.label}</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-md">
                              <p className={`text-xs uppercase tracking-[0.16em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyPrimarySignal')}</p>
                              <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{summaryParts[0] || t('verifyPrimarySignalFallback')}</p>
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
              <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#22D3EE]">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.18em] ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyExplanationSummary')}</p>
                    <h2 className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{t('verifyAiExplanation')}</h2>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[#22D3EE]/15 bg-gradient-to-br from-[#3B82F6]/10 to-[#22D3EE]/5 p-5"
                >
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#93C5FD]' : 'text-[#1D4ED8]'}`}>{t('verifyAiVerdict')}</p>
                        <h3 className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                          {explanationHeadline}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-3 py-1 text-xs text-[#F59E0B]">{t('verifyConfidenceLabel', { score: credibilityScore })}</span>
                        <span
                          className="inline-flex items-center rounded-full border px-3 py-1 text-xs"
                          style={{ borderColor: `${verificationVerdict.accent}33`, color: verificationVerdict.accent, backgroundColor: `${verificationVerdict.accent}18` }}
                        >
                          {t('verifyVerdictBadge', { verdict: verificationVerdict.label })}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-[#22C55E]/20 bg-[#22C55E]/10 px-3 py-1 text-xs text-[#22C55E]">{t('verifyTrustedSourcesBadge', { count: trustedSources.length })}</span>
                        <span className="inline-flex items-center rounded-full border border-[#EF4444]/20 bg-[#EF4444]/10 px-3 py-1 text-xs text-[#EF4444]">{t('verifyConflictingSourcesBadge', { count: suspiciousSources.length })}</span>
                      </div>
                    </div>

                    <p className={`leading-relaxed ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                      {summaryText}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {explanationPoints.map((point) => (
                        <div
                          key={point.title}
                          className={`rounded-xl border p-4 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white/80 border-[#E2E8F0]'}`}
                        >
                          <p className={`mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{point.title}</p>
                          <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{point.body}</p>
                        </div>
                      ))}
                    </div>

                    <p className={`leading-relaxed ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                      {practicalTakeaway}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Evidence Articles */}
              <div className={`rounded-2xl border p-8 shadow-sm transition-colors ${
                isDarkMode
                  ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.84))] border-white/8'
                  : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex flex-col gap-3 mb-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyEvidenceSources')}</p>
                    <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifySourceIntelligenceBreakdown')}</h2>
                  </div>
                  <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{t('verifyEvidenceSplitHint')}</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#0B1120]/80 border-[#22C55E]/20' : 'bg-[#F8FAFC] border-[#BBF7D0]'}`}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-sm text-[#22C55E]">{t('verifyTrustedSourcesSection')}</p>
                        <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{t('verifyTrustedSourcesAligned', { count: trustedSources.length })}</p>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                    </div>
                    <div className="space-y-4">
                      {trustedSources.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <p className={`text-sm ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyNoTrustedSources')}</p>
                        </div>
                      ) : trustedSources.map((article, index) => (
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
                              <p className="text-xs uppercase tracking-[0.16em] text-[#86EFAC]">{t('verifySimilarity')}</p>
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
                        <p className="text-sm text-[#EF4444]">{t('verifySuspiciousSourcesSection')}</p>
                        <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{t('verifySuspiciousSourcesCaution', { count: suspiciousSources.length })}</p>
                      </div>
                      <ShieldAlert className="w-5 h-5 text-[#EF4444]" />
                    </div>
                    <div className="space-y-4">
                      {suspiciousSources.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <p className={`text-sm ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyNoSuspiciousSources')}</p>
                        </div>
                      ) : suspiciousSources.map((article, index) => (
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
                              <p className={`text-xs uppercase tracking-[0.16em] ${article.similarity >= 0.5 ? 'text-[#FCD34D]' : 'text-[#FCA5A5]'}`}>{t('verifySimilarity')}</p>
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
                    <h2 className={`text-xl mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifySourceSimilarityComparison')}</h2>
                    <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>
                      {t('verifySimilarityHint')}
                    </p>
                  </div>

                  <div className="flex items-stretch gap-3 lg:flex-nowrap lg:justify-end">
                    <div 
                      className="min-w-[170px] rounded-xl px-4 py-3 border bg-gradient-to-br from-[#3B82F6]/12 to-[#3B82F6]/5 border-[#3B82F6]/20 transition-all duration-300 cursor-pointer hover:border-[#3B82F6]/60"
                      style={{ borderColor: '#3B82F6' + '33' }}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget as HTMLDivElement;
                        target.style.borderColor = '#3B82F6';
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget as HTMLDivElement;
                        target.style.borderColor = '#3B82F6' + '33';
                      }}
                    >
                      <p className={`text-xs uppercase tracking-[0.18em] ${isDarkMode ? 'text-[#93C5FD]' : 'text-[#1D4ED8]'}`}>{t('verifySourcesCompared')}</p>
                      <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{articles.length}</p>
                    </div>
                    <div 
                      className={`min-w-[170px] rounded-xl px-4 py-3 border transition-all duration-300 cursor-pointer ${getAverageMatchMeta(averageSimilarity).container}`}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget as HTMLDivElement;
                        const meta = getAverageMatchMeta(averageSimilarity);
                        // Extract accent color from container class
                        if (averageSimilarity >= 70) {
                          target.style.borderColor = '#22C55E';
                        } else if (averageSimilarity >= 40) {
                          target.style.borderColor = '#F59E0B';
                        } else {
                          target.style.borderColor = '#EF4444';
                        }
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget as HTMLDivElement;
                        if (averageSimilarity >= 70) {
                          target.style.borderColor = '#22C55E' + '33';
                        } else if (averageSimilarity >= 40) {
                          target.style.borderColor = '#F59E0B' + '33';
                        } else {
                          target.style.borderColor = '#EF4444' + '33';
                        }
                      }}
                    >
                      <p className={`text-xs uppercase tracking-[0.18em] ${getAverageMatchMeta(averageSimilarity).title}`}>{t('verifyAverageMatch')}</p>
                      <p className={`text-lg ${getAverageMatchMeta(averageSimilarity).value}`}>{averageSimilarity}%</p>
                      <p className={`text-xs mt-1 ${getAverageMatchMeta(averageSimilarity).title}`}>{getAverageMatchMeta(averageSimilarity).label}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {articles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className={`text-sm ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyNoArticlesToCompare')}</p>
                    </div>
                  ) : articles.map((article, index) => (
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
                            <span className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifySimilarityScore')}</span>
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
                            {t('verifyMatch')}
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
                    <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifySpreadPattern')}</p>
                    <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyNewsTimelineVisualization')}</h2>
                  </div>
                  <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{t('verifyTimelineHint')}</p>
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
              <div className={`relative overflow-hidden rounded-[28px] border ${
                isDarkMode
                  ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94))] border-white/8 shadow-[0_24px_60px_rgba(2,6,23,0.35)]'
                  : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] border-[#E2E8F0] shadow-sm'
              }`}>
                <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: threatPanelTheme.topBar }} />
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: threatPanelTheme.orbTop }} />
                <div className="absolute -left-20 bottom-0 h-40 w-64 rounded-full blur-3xl pointer-events-none" style={{ background: threatPanelTheme.orbBottom }} />

                <div className="relative p-8 sm:p-10">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-5 flex-1">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl ring-1 flex-shrink-0"
                        style={{ background: threatPanelTheme.iconSurface, color: threatPanelTheme.iconColor, borderColor: threatPanelTheme.badgeBorder }}
                      >
                        <ThreatPanelIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-widest ${isDarkMode ? threatPanelTheme.eyebrowDark : threatPanelTheme.eyebrowLight}`}>
                          {hasThreatSignal ? '⚠ ' : '✓ '}{t('verifyThreatIntelligence')}
                        </p>
                        <h3 className={`mt-2 text-2xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                          {threatPanelTheme.headline}
                        </h3>
                        <p className={`mt-3 max-w-2xl text-sm leading-relaxed ${isDarkMode ? 'text-[#A1A5B0]' : 'text-[#6B7280]'}`}>
                          {threatPanelTheme.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className="inline-flex items-center gap-2.5 self-start rounded-full border px-4 py-2 text-xs font-semibold backdrop-blur-sm"
                      style={{ borderColor: threatPanelTheme.badgeBorder, background: threatPanelTheme.badgeSurface, color: threatPanelTheme.badgeText }}
                    >
                      <span className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ backgroundColor: threatPanelTheme.badgeText }} />
                      {threatPanelTheme.badge}
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.9fr_0.85fr]">
                    <div className={`group rounded-2xl border p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                      isDarkMode
                        ? threatPanelTheme.metricCardDark
                        : threatPanelTheme.metricCardLight
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl transition-all" style={{ background: threatPanelTheme.metricIconSurface, color: threatPanelTheme.metricAccent }}>
                          <GlobeIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? threatPanelTheme.metricMutedDark : threatPanelTheme.metricMutedLight}`}>
                            {t('verifyDomain')}
                          </p>
                          <p className="mt-2.5 truncate font-mono text-lg font-bold" style={{ color: threatPanelTheme.metricAccent }}>{threatPanelTheme.domainText}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`group rounded-2xl border p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                      isDarkMode
                        ? threatPanelTheme.metricCardDark
                        : threatPanelTheme.metricCardLight
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl transition-all" style={{ background: threatPanelTheme.metricIconSurface, color: threatPanelTheme.metricAccent }}>
                          <Shield className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? threatPanelTheme.metricMutedDark : threatPanelTheme.metricMutedLight}`}>
                            {t('verifyStatus')}
                          </p>
                          <div className="mt-2.5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold border" style={{ background: threatPanelTheme.badgeSurface, color: threatPanelTheme.metricAccent, borderColor: threatPanelTheme.badgeBorder }}>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: threatPanelTheme.metricAccent }} />
                            {threatPanelTheme.statusText}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`group rounded-2xl border p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                      isDarkMode
                        ? threatPanelTheme.metricCardDark
                        : threatPanelTheme.metricCardLight
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl transition-all" style={{ background: threatPanelTheme.metricIconSurface, color: threatPanelTheme.metricAccent }}>
                          <FileBarChart2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? threatPanelTheme.metricMutedDark : threatPanelTheme.metricMutedLight}`}>
                            {t('verifyRiskScore')}
                          </p>
                          <p className={`mt-2.5 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                            <span style={{ color: threatPanelTheme.metricAccent }}>{threatPanelTheme.score}</span>
                            <span className={isDarkMode ? 'text-[#4B5563]' : 'text-[#9CA3AF]'}>/10</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/url-investigation', {
                      state: {
                        initialUrl: 'https://fakepoliticsnews.com',
                        source: 'verify-claim',
                      },
                    })}
                    className={`mt-8 flex w-full items-center justify-between rounded-2xl border px-6 py-5 text-left transition-all duration-300 hover:-translate-y-1 font-semibold ${
                      isDarkMode
                        ? threatPanelTheme.buttonDark
                        : threatPanelTheme.buttonLight
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: threatPanelTheme.buttonIcon, boxShadow: `0 12px 24px ${threatPanelTheme.badgeBorder}` }}>
                        <ScanSearch className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`text-base font-bold ${isDarkMode ? 'text-white' : threatPanelTheme.buttonTitleLight}`}>
                          {t('verifyRunDeepUrlInvestigation')}
                        </p>
                        <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#9CA3AF]' : threatPanelTheme.buttonSubtitleLight}`}>
                          {t('verifyDeepUrlHint')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: threatPanelTheme.actionText }}>
                      {t('verifyInvestigate')}
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${threatPanelTheme.actionText}18` }}>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Cross-Platform Verification */}
              <div className={`rounded-2xl border p-8 shadow-sm transition-colors ${
                isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <h2 className={`text-xl mb-6 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyCrossPlatformVerification')}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => void handleOpenPlatform('reddit')}
                    className={`bg-gradient-to-br from-[#FF6A33]/10 to-[#FF4500]/5 border rounded-xl p-6 text-left cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#FF4500]/10 ${
                      activePlatform === 'reddit' ? 'border-[#FF4500]/50 shadow-[0_0_0_1px_rgba(255,69,0,0.24)]' : 'border-[#FF4500]/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#FF4500] rounded-xl flex items-center justify-center">
                        <span className="text-white text-sm font-semibold leading-none">r/</span>
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyPlatformReddit')}</p>
                        <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                          {isLoadingReddit ? t('verifyLoading') : t('verifyNodesCount', { count: redditSpreadNodes })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${redditError ? 'bg-[#EF4444]' : isLoadingReddit ? 'bg-[#FBBF24]' : 'bg-[#22C55E]'}`}></div>
                      <p className={`text-sm ${redditError ? 'text-[#EF4444]' : isLoadingReddit ? 'text-[#FBBF24]' : 'text-[#22C55E]'}`}>
                        {redditError ? t('verifyLoadFailed') : isLoadingReddit ? t('verifyScanningReddit') : t('verifyPropagationReady')}
                      </p>
                    </div>
                  </motion.button>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setActivePlatform('x')}
                    className={`bg-gradient-to-br from-[#1DA1F2]/10 to-[#1DA1F2]/5 border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1DA1F2]/10 ${
                      activePlatform === 'x' ? 'border-[#1DA1F2]/50 shadow-[0_0_0_1px_rgba(29,161,242,0.2)]' : 'border-[#1DA1F2]/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <span className="text-white text-lg font-semibold leading-none">X</span>
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyPlatformX')}</p>
                        <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyMentionsCount', { count: 47 })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#22C55E] rounded-full"></div>
                      <p className="text-sm text-[#22C55E]">{t('verifyVerified')}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => setActivePlatform('facebook')}
                    className={`bg-gradient-to-br from-[#1877F2]/10 to-[#1877F2]/5 border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1877F2]/10 ${
                      activePlatform === 'facebook' ? 'border-[#1877F2]/50 shadow-[0_0_0_1px_rgba(24,119,242,0.2)]' : 'border-[#1877F2]/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#1877F2] rounded-xl flex items-center justify-center">
                        <Facebook className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyPlatformFacebook')}</p>
                        <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifySharesCount', { count: 89 })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#EF4444] rounded-full"></div>
                      <p className="text-sm text-[#EF4444]">{t('verifyMixedSources')}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setActivePlatform('instagram')}
                    className={`bg-gradient-to-br from-[#E1306C]/10 to-[#F77737]/5 border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#E1306C]/10 ${
                      activePlatform === 'instagram' ? 'border-[#E1306C]/50 shadow-[0_0_0_1px_rgba(225,48,108,0.2)]' : 'border-[#E1306C]/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#E1306C] rounded-xl flex items-center justify-center">
                        <Instagram className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyPlatformInstagram')}</p>
                        <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyPostsCount', { count: 63 })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#FBBF24] rounded-full"></div>
                      <p className="text-sm text-[#FBBF24]">{t('verifyMonitoring')}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => setActivePlatform('news')}
                    className={`bg-gradient-to-br from-[#FF6B00]/10 to-[#FF6B00]/5 border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#FF6B00]/10 ${
                      activePlatform === 'news' ? 'border-[#FF6B00]/50 shadow-[0_0_0_1px_rgba(255,107,0,0.2)]' : 'border-[#FF6B00]/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#FF6B00] rounded-xl flex items-center justify-center">
                        <Newspaper className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyPlatformNewsSources')}</p>
                        <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyArticlesCount', { count: 124 })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#22C55E] rounded-full"></div>
                      <p className="text-sm text-[#22C55E]">{t('verifyVerified')}</p>
                    </div>
                  </motion.div>
                </div>

                {activePlatform === 'reddit' && (
                  <div className={`mt-6 rounded-[28px] border p-8 relative overflow-hidden ${
                    isDarkMode
                      ? 'bg-[linear-gradient(180deg,rgba(8,15,31,0.94),rgba(15,23,42,0.9))] border-white/8 shadow-[0_18px_45px_rgba(2,6,23,0.35)]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}>
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#FF4500]/10 blur-3xl" />
                    <div className="relative space-y-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyRedditPropagation')}</p>
                          <h3 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyNarrativeSpreadNetwork')}</h3>
                        </div>
                        <div className="inline-flex items-center rounded-full border border-[#FF4500]/20 bg-[#FF4500]/10 px-3 py-1 text-xs text-[#FF8A5B]">
                          {t('verifyQueryPrefix')} {claim.length > 48 ? `${claim.slice(0, 48)}...` : claim}
                        </div>
                      </div>

                      {redditError && (
                        <div className="rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
                          {redditError}
                        </div>
                      )}

                      <div className={`rounded-[28px] border overflow-hidden ${
                        isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'
                      }`}>
                        {/* Network Graph Header */}
                        <div className="flex items-center justify-between gap-4 p-8 pb-6 border-b border-white/10">
                          <div>
                            <p className={`text-xs uppercase tracking-[0.24em] mb-2 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyNarrativeSpreadNodes')}</p>
                            <p className={`text-3xl leading-none ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                              {isLoadingReddit ? '...' : redditSpreadNodes}
                            </p>
                          </div>
                          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#FF4500]/10">
                            <ShieldAlert className="w-8 h-8 text-[#FF8A5B]" />
                          </div>
                        </div>

                        {/* Network Graph Visualization */}
                        <div className="h-[350px] relative overflow-hidden p-6">
                          {/* Background grid effect */}
                          <div className="absolute inset-0 opacity-5">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <defs>
                                <pattern id="grid-reddit" width="10" height="10" patternUnits="userSpaceOnUse">
                                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                </pattern>
                              </defs>
                              <rect width="100" height="100" fill="url(#grid-reddit)" />
                            </svg>
                          </div>

                          {/* Network nodes visualization */}
                          <div className="relative w-full h-full">
                            {/* Center node */}
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                            >
                              <div className="w-8 h-8 rounded-full bg-[#FF4500] shadow-lg shadow-[#FF4500]/50 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-white/30" />
                              </div>
                            </motion.div>

                            {/* Orbiting nodes */}
                            {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
                              const rad = (angle * Math.PI) / 180;
                              const x = 50 + 30 * Math.cos(rad);
                              const y = 50 + 30 * Math.sin(rad);
                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: 0.15 + idx * 0.05 }}
                                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-5"
                                  style={{ transform: `translate(calc(-50% + ${x - 50}%), calc(-50% + ${y - 50}%))` }}
                                >
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md ${
                                    idx % 2 === 0
                                      ? 'bg-[#FF8A5B]/40'
                                      : 'bg-[#FFB366]/40'
                                  }`}>
                                    <div className={`w-2 h-2 rounded-full ${idx % 2 === 0 ? 'bg-[#FF8A5B]' : 'bg-[#FFB366]'}`} />
                                  </div>
                                </motion.div>
                              );
                            })}

                            {/* Connection lines */}
                            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                              {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
                                const rad = (angle * Math.PI) / 180;
                                const x = 50 + 30 * Math.cos(rad);
                                const y = 50 + 30 * Math.sin(rad);
                                return (
                                  <line
                                    key={idx}
                                    x1="50%"
                                    y1="50%"
                                    x2={`${x}%`}
                                    y2={`${y}%`}
                                    stroke={idx % 2 === 0 ? 'rgba(255, 138, 91, 0.3)' : 'rgba(255, 179, 102, 0.3)'}
                                    strokeWidth="1"
                                  />
                                );
                              })}
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyEventsCaptured')}</p>
                          <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{isLoadingReddit ? t('verifyLoading') : redditEventsCount}</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyPatientZero')}</p>
                          <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{isLoadingReddit ? t('verifyAnalyzingRedditThreads') : redditPatientZero}</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyTopAmplifier')}</p>
                          <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{isLoadingReddit ? t('verifyMeasuringAmplification') : redditSuperSpreader}</p>
                        </div>
                      </div>

                      <SpreadTimelinePanel
                        isDarkMode={isDarkMode}
                        eyebrow={platformSpreadTimelines.reddit.eyebrow}
                        heading={platformSpreadTimelines.reddit.heading}
                        events={platformSpreadTimelines.reddit.events}
                      />
                    </div>
                  </div>
                )}

                {activePlatform === 'x' && (
                  <div className={`mt-6 rounded-[28px] border p-8 relative overflow-hidden ${
                    isDarkMode
                      ? 'bg-[linear-gradient(180deg,rgba(8,15,31,0.94),rgba(15,23,42,0.9))] border-white/8 shadow-[0_18px_45px_rgba(2,6,23,0.35)]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}>
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#1DA1F2]/10 blur-3xl" />
                    <div className="relative space-y-5">
                      <div>
                        <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyXMonitoring')}</p>
                        <h3 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyXPlatformMentions')}</h3>
                      </div>
                      <div className={`rounded-[28px] border p-8 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={`text-xs uppercase tracking-[0.24em] mb-4 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyTotalMentions')}</p>
                            <p className={`text-6xl leading-none mb-8 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>47</p>
                            <p className={`text-xl ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyLiveEngagementMetrics')}</p>
                          </div>
                          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#1DA1F2]/10">
                            <span className="text-5xl">𝕏</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyRetweets')}</p>
                          <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>142</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyReplies')}</p>
                          <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>89</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyStatus')}</p>
                          <p className={`text-2xl text-[#22C55E]`}>{t('verifyVerified')}</p>
                        </div>
                      </div>
                      <SpreadTimelinePanel
                        isDarkMode={isDarkMode}
                        eyebrow={platformSpreadTimelines.x.eyebrow}
                        heading={platformSpreadTimelines.x.heading}
                        events={platformSpreadTimelines.x.events}
                      />
                    </div>
                  </div>
                )}

                {activePlatform === 'facebook' && (
                  <div className={`mt-6 rounded-[28px] border p-8 relative overflow-hidden ${
                    isDarkMode
                      ? 'bg-[linear-gradient(180deg,rgba(8,15,31,0.94),rgba(15,23,42,0.9))] border-white/8 shadow-[0_18px_45px_rgba(2,6,23,0.35)]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}>
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#1877F2]/10 blur-3xl" />
                    <div className="relative space-y-5">
                      <div>
                        <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyFacebookNetwork')}</p>
                        <h3 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyEngagementAnalysis')}</h3>
                      </div>
                      <div className={`rounded-[28px] border p-8 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={`text-xs uppercase tracking-[0.24em] mb-4 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyTotalShares')}</p>
                            <p className={`text-6xl leading-none mb-8 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>89</p>
                            <p className={`text-xl ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyMixedSourceAmplification')}</p>
                          </div>
                          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#1877F2]/10">
                            <Facebook className="w-12 h-12 text-[#1877F2]" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyComments')}</p>
                          <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>124</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyReactions')}</p>
                          <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>356</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyStatus')}</p>
                          <p className={`text-2xl text-[#EF4444]`}>{t('verifyMixedSources')}</p>
                        </div>
                      </div>
                      <SpreadTimelinePanel
                        isDarkMode={isDarkMode}
                        eyebrow={platformSpreadTimelines.facebook.eyebrow}
                        heading={platformSpreadTimelines.facebook.heading}
                        events={platformSpreadTimelines.facebook.events}
                      />
                    </div>
                  </div>
                )}

                {activePlatform === 'instagram' && (
                  <div className={`mt-6 rounded-[28px] border p-8 relative overflow-hidden ${
                    isDarkMode
                      ? 'bg-[linear-gradient(180deg,rgba(8,15,31,0.94),rgba(15,23,42,0.9))] border-white/8 shadow-[0_18px_45px_rgba(2,6,23,0.35)]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}>
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#E1306C]/10 blur-3xl" />
                    <div className="relative space-y-5">
                      <div>
                        <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyInstagramActivity')}</p>
                        <h3 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyVisualContentSpread')}</h3>
                      </div>
                      <div className={`rounded-[28px] border p-8 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={`text-xs uppercase tracking-[0.24em] mb-4 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyTotalPosts')}</p>
                            <p className={`text-6xl leading-none mb-8 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>63</p>
                            <p className={`text-xl ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyUnderMonitoring')}</p>
                          </div>
                          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#E1306C]/10">
                            <Instagram className="w-12 h-12 text-[#E1306C]" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyLikes')}</p>
                          <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>2,847</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyComments')}</p>
                          <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>421</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyStatus')}</p>
                          <p className={`text-2xl text-[#FBBF24]`}>{t('verifyMonitoring')}</p>
                        </div>
                      </div>
                      <SpreadTimelinePanel
                        isDarkMode={isDarkMode}
                        eyebrow={platformSpreadTimelines.instagram.eyebrow}
                        heading={platformSpreadTimelines.instagram.heading}
                        events={platformSpreadTimelines.instagram.events}
                      />
                    </div>
                  </div>
                )}

                {activePlatform === 'news' && (
                  <div className={`mt-6 rounded-[28px] border p-8 relative overflow-hidden ${
                    isDarkMode
                      ? 'bg-[linear-gradient(180deg,rgba(8,15,31,0.94),rgba(15,23,42,0.9))] border-white/8 shadow-[0_18px_45px_rgba(2,6,23,0.35)]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}>
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#FF6B00]/10 blur-3xl" />
                    <div className="relative space-y-5">
                      <div>
                        <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyNewsCoverage')}</p>
                        <h3 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyPublisherDistribution')}</h3>
                      </div>
                      <div className={`rounded-[28px] border p-8 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={`text-xs uppercase tracking-[0.24em] mb-4 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyTotalArticles')}</p>
                            <p className={`text-6xl leading-none mb-8 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>124</p>
                            <p className={`text-xl ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyVerifiedCoverageDetected')}</p>
                          </div>
                          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#FF6B00]/10">
                            <Newspaper className="w-12 h-12 text-[#FF6B00]" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyTier1Sources')}</p>
                          <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>47</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyTier2Sources')}</p>
                          <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>56</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyStatus')}</p>
                          <p className={`text-2xl text-[#22C55E]`}>{t('verifyVerified')}</p>
                        </div>
                      </div>
                      <SpreadTimelinePanel
                        isDarkMode={isDarkMode}
                        eyebrow={platformSpreadTimelines.news.eyebrow}
                        heading={platformSpreadTimelines.news.heading}
                        events={platformSpreadTimelines.news.events}
                      />
                    </div>
                  </div>
                )}

                <div className={`mt-6 p-4 rounded-xl ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    <strong className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{t('verifyCrossPlatformSummaryLabel')}</strong> {t('verifyCrossPlatformSummaryBody')}
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
                    <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyImageClaimVerification')}</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyUploadedImage')}</p>
                      <img
                        src={uploadedImage}
                        alt={t('verifyUploadedAlt')}
                        className={`w-full rounded-xl border ${isDarkMode ? 'border-[#334155]' : 'border-[#E2E8F0]'}`}
                      />
                    </div>

                    <div>
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyExtractedText')}</p>
                      <div className={`rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
                        <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{claim}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-[#22C55E]/10 to-[#22C55E]/5 border border-[#22C55E]/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-[#22C55E] mb-1">{t('verifyTextExtractedTitle')}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                              {t('verifyTextExtractedBody')}
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

          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-[28px] border p-8 shadow-sm transition-colors ${
                isDarkMode
                  ? 'bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] border-white/8 shadow-[0_28px_80px_rgba(2,6,23,0.5)]'
                  : 'bg-white border-[#E2E8F0]'
              }`}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{t('verifyReloading')}</p>
                  <h2 className={`text-2xl mb-3 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyAnalyzingUpdatedClaim')}</h2>
                  <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>
                    {t('verifyReloadingDesc')}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-5 py-4">
                  <div className="h-10 w-10 rounded-full border-2 border-[#22D3EE]/30 border-t-[#22D3EE] animate-spin" />
                  <div>
                    <p className="text-sm text-[#22D3EE]">{t('verifyRefreshInProgress')}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('verifyRefreshHint')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`rounded-2xl border p-5 animate-pulse ${
                      isDarkMode ? 'bg-white/5 border-white/8' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}
                  >
                    <div className={`h-3 w-28 rounded-full mb-4 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                    <div className={`h-8 w-20 rounded-full mb-4 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                    <div className={`h-3 w-full rounded-full mb-2 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                    <div className={`h-3 w-4/5 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                  </div>
                ))}
              </div>
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
              <h3 className={`text-xl mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('verifyEmptyTitle')}</h3>
              <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{t('verifyEmptyDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}