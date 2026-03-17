import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { motion } from 'motion/react';
import {
  SearchCheck,
  Link2,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Lock,
  MapPin,
  CalendarDays,
  TriangleAlert,
  ShieldX,
  Server,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { CredibilityGauge } from '../components/CredibilityGauge';
import { useDarkMode } from '../components/DarkModeContext';
import {
  analyzeDomainSecurity,
  analyzeRedditPropagation,
  type DomainSecurityResult,
} from '../services/api';

interface ProgressStep {
  id: string;
  label: string;
}

interface TrustedArticle {
  title: string;
  source: string;
  url: string;
  similarity: number;
}

const UI_COLORS = {
  primary: '#3B82F6',
  secondary: '#22D3EE',
  alert: '#F87171',
};

function Counter({ value, suffix = '', duration = 1100 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const start = performance.now();

    const update = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(value * progress);
      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [duration, value]);

  return <>{Math.round(display)}{suffix}</>;
}

export function UrlInvestigation() {
  const location = useLocation();
  const { isDarkMode } = useDarkMode();
  const initialUrlFromState = (location.state as { initialUrl?: string } | null)?.initialUrl || '';
  const [url, setUrl] = useState(() => {
    return initialUrlFromState;
  });
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [showResults, setShowResults] = useState(Boolean(initialUrlFromState.trim()));
  const [domainResult, setDomainResult] = useState<DomainSecurityResult | null>(null);
  const [investigationError, setInvestigationError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const state = location.state as { initialUrl?: string } | null;
    if (state?.initialUrl) {
      setUrl(state.initialUrl);
      setShowResults(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (!isInvestigating) return;

    setShowResults(false);

    const timeout = window.setTimeout(() => {
      setIsInvestigating(false);
      setShowResults(true);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [isInvestigating]);

  const runInvestigation = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setInvestigationError('Please enter a valid URL before starting investigation.');
      return;
    }

    setInvestigationError(null);

    try {
      const domainResponse = await analyzeDomainSecurity({ url: trimmedUrl });

      setDomainResult(domainResponse.results[0] || null);
      setLastUpdated(new Date());
    } catch (error) {
      setInvestigationError(error instanceof Error ? error.message : 'Failed to connect to backend services.');
    }
  };

  useEffect(() => {
    if (!showResults || isInvestigating || !url.trim()) return;

    void runInvestigation();

    const interval = window.setInterval(() => {
      void runInvestigation();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [showResults, isInvestigating, url]);

  const domainRisk = domainResult?.domain_risk || 'unknown';
  const investigationScore = domainRisk === 'high' ? 22 : domainRisk === 'medium' ? 45 : domainRisk === 'low' ? 78 : 60;
  const investigationSummary = useMemo(() => {
    const trimmedUrl = url.trim();
    let parsed: URL | null = null;

    try {
      parsed = new URL(trimmedUrl);
    } catch {
      parsed = null;
    }

    const hostname = domainResult?.domain || parsed?.hostname || 'Unknown';
    const protocol = parsed?.protocol || '';
    const pathname = parsed?.pathname || '';
    const isHttps = protocol === 'https:';
    const suspiciousTlds = ['tk', 'ml', 'ga', 'cf', 'gq', 'click', 'top', 'xyz'];
    const tld = hostname.includes('.') ? hostname.split('.').at(-1)?.toLowerCase() || '' : '';
    const hasSuspiciousTld = suspiciousTlds.includes(tld);
    const hasLongPath = pathname.split('/').filter(Boolean).length >= 3;
    const loginKeywords = /(login|verify|secure|account|signin|update|password)/i.test(trimmedUrl);
    const impersonationKeywords = /(microsoft|google|paypal|bank|instagram|facebook|apple)/i.test(trimmedUrl);
    const knownBrandDomain = /(microsoft\.com|google\.com|paypal\.com|instagram\.com|facebook\.com|apple\.com)/i.test(hostname);
    const possibleImpersonation = impersonationKeywords && !knownBrandDomain;

    const derivedThreats: string[] = [];
    if (hasSuspiciousTld) derivedThreats.push('Suspicious top-level domain');
    if (possibleImpersonation) derivedThreats.push('Possible brand impersonation');
    if (loginKeywords) derivedThreats.push('Credential harvesting pattern in URL');
    if (hasLongPath) derivedThreats.push('Deep path often used in spoofed landing pages');
    if (domainRisk === 'high') derivedThreats.push('Backend model flagged this domain as high risk');
    if (domainRisk === 'medium') derivedThreats.push('Backend model detected mixed trust signals');

    const severityScore = domainRisk === 'high' ? 86 : domainRisk === 'medium' ? 58 : domainRisk === 'low' ? 12 : derivedThreats.length ? 46 : 18;
    const severityLabel = severityScore >= 75 ? 'Critical' : severityScore >= 45 ? 'Elevated' : 'Safe';
    const severityAccent = severityScore >= 75 ? UI_COLORS.alert : severityScore >= 45 ? UI_COLORS.primary : UI_COLORS.secondary;

    return {
      hostname,
      displayUrl: trimmedUrl || 'No URL provided',
      isHttps,
      severityScore,
      severityLabel,
      severityAccent,
      domainAgeLabel: 'Unknown',
      domainAgeNote: 'Domain age could not be verified.',
      sslLabel: isHttps ? (domainRisk === 'high' ? 'Untrusted SSL' : 'Valid HTTPS') : 'No HTTPS',
      sslAccent: UI_COLORS.alert,
      sslNote: isHttps
        ? domainRisk === 'high'
          ? 'Encrypted transport exists, but the domain itself remains unsafe.'
          : 'Encrypted transport detected.'
        : 'Connection is not encrypted. Treat as unsafe.',
      locationLabel: 'Unknown',
      locationNote: 'ISP: Unknown',
      threatCount: derivedThreats.length,
      threats: derivedThreats,
      summary: domainResult?.reason || (derivedThreats.length ? 'This URL shows multiple suspicious signals that warrant deeper inspection.' : 'No strong threat indicators were detected from the current URL structure.'),
    };
  }, [domainResult, domainRisk, url]);

  const technicalDetails = useMemo(() => {
    const trimmedUrl = url.trim();
    let parsed: URL | null = null;

    try {
      parsed = new URL(trimmedUrl);
    } catch {
      parsed = null;
    }

    return [
      { label: 'IP Address', value: 'Unknown' },
      { label: 'Page Title', value: 'Unknown' },
      { label: 'Redirect Hops', value: '0' },
      { label: 'Registrar', value: 'Unknown' },
      { label: 'DNS A', value: parsed?.hostname ? 'N/A' : 'N/A' },
      { label: 'DNS MX', value: 'N/A' },
      { label: 'SSL Expiry', value: investigationSummary.isHttps ? 'Unknown' : 'Unknown' },
      { label: 'Triggered Heuristics', value: investigationSummary.threats.length ? investigationSummary.threats.join(', ') : 'None' },
    ];
  }, [investigationSummary.isHttps, investigationSummary.threats, url]);

  const riskTone = domainRisk === 'high' ? UI_COLORS.alert : domainRisk === 'medium' ? UI_COLORS.primary : UI_COLORS.secondary;
  const riskHeadline = domainRisk === 'high'
    ? 'Likely malicious destination'
    : domainRisk === 'medium'
      ? 'Mixed trust signals detected'
      : domainRisk === 'low'
        ? 'No major domain risk detected'
        : 'Awaiting domain confidence signal';

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode
        ? 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_24%),linear-gradient(180deg,#0B1120,#111827)]'
        : 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_24%),linear-gradient(180deg,#F8FAFC,#EEF2FF)]'
    }`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${UI_COLORS.primary}, ${UI_COLORS.secondary})` }}>
              <Zap className="w-6 h-6" />
            </div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
              URL Investigation Mode
            </h1>
          </div>

          <div className={`rounded-[28px] border p-8 relative overflow-hidden ${
            isDarkMode
              ? 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] border-white/8 shadow-[0_30px_80px_rgba(2,6,23,0.46)]'
              : 'bg-white/95 border-[#E2E8F0] shadow-sm'
          }`}>
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${UI_COLORS.primary}, ${UI_COLORS.secondary}, ${UI_COLORS.alert})` }} />
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full blur-3xl" style={{ backgroundColor: `${UI_COLORS.primary}20` }} />
            <div className="relative grid grid-cols-1 gap-8 items-center">
              <div>
                <p className={`text-[20px] uppercase tracking-[0.08em] mb-3 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>URL Input Panel</p>
                <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#0F172A]/90 border-white/8' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <div className="relative">
                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <input
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          setIsInvestigating(true);
                          void runInvestigation();
                        }
                      }}
                      placeholder="Paste a news article URL to investigate"
                      className={`w-full rounded-2xl border pl-12 pr-4 py-4 outline-none transition-all ${
                        isDarkMode
                          ? 'bg-[#0B1120] border-[#334155] text-white placeholder:text-[#64748B] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#22D3EE]/20'
                          : 'bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#22D3EE]/20'
                      }`}
                    />
                  </div>
                  <p className={`text-sm mt-3 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    Paste a suspicious article, phishing link, or fake login page. Press Enter to run a fresh scan.
                  </p>
                  <motion.button
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsInvestigating(true);
                      void runInvestigation();
                    }}
                    className="mt-4 inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-white"
                    style={{ background: `linear-gradient(90deg, ${UI_COLORS.primary}, ${UI_COLORS.secondary})`, boxShadow: `0 18px 40px ${UI_COLORS.primary}33` }}
                  >
                    <SearchCheck className="w-5 h-5" />
                    <span>Start Investigation</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {investigationError && (
              <div className="mt-6 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
                {investigationError}
              </div>
            )}
          </div>

          {!showResults && isInvestigating && (
            <div className="space-y-6">
              <div className={`rounded-[28px] border p-8 relative overflow-hidden ${isDarkMode ? 'bg-[linear-gradient(135deg,rgba(17,24,39,0.96),rgba(15,23,42,0.96))] border-white/8' : 'bg-white border-[#E2E8F0] shadow-sm'}`}>
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${UI_COLORS.primary}, ${UI_COLORS.secondary}, ${UI_COLORS.alert})` }} />
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl flex-1">
                    <p className={`text-sm uppercase tracking-widest mb-3 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>ANALYZING INVESTIGATION</p>
                    <h2 className={`text-3xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Investigating the URL</h2>
                    <p className={`text-base mb-6 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>We are analyzing domain security, checking SSL certificates, detecting threats, and building a credibility profile.</p>
                    
                    <div className="space-y-3">
                      <div className={`h-4 rounded-full animate-pulse ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ width: '75%' }} />
                      <div className={`h-4 rounded-full animate-pulse ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ width: '90%' }} />
                      <div className={`h-4 rounded-full animate-pulse ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ width: '70%' }} />
                    </div>
                  </div>
                  
                  <div className={`rounded-2xl border p-6 ${isDarkMode ? 'border-white/8 bg-white/5' : 'border-[#E2E8F0] bg-[#F0F9FF]'}`}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 animate-spin" style={{ color: UI_COLORS.secondary }}>
                          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.1" />
                          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="88" strokeLinecap="round" opacity="1" />
                        </svg>
                      </div>
                      <p className={`text-sm font-medium text-center ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>Investigation in progress</p>
                      <p className={`text-xs text-center ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Analyzing credentials and security signals</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-white border-[#E2E8F0] shadow-sm'}`}>
                    <div className={`h-4 rounded-full animate-pulse mb-4 ${isDarkMode ? 'bg-white/10' : 'bg-gray-300'}`} style={{ width: '60%' }} />
                    <div className={`h-8 rounded-full animate-pulse mb-3 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                    <div className={`h-4 rounded-full animate-pulse ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ width: '85%' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {showResults && (
            <div className="space-y-6">
              <div className={`rounded-[28px] border p-6 relative overflow-hidden ${isDarkMode ? 'bg-[linear-gradient(135deg,rgba(17,24,39,0.96),rgba(15,23,42,0.96))] border-white/8' : 'bg-white border-[#E2E8F0] shadow-sm'}`}>
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${riskTone}, ${UI_COLORS.secondary})` }} />
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className={`text-[20px] uppercase tracking-[0.08em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>AI Risk Brief</p>
                    <h2 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{riskHeadline}</h2>
                    <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{investigationSummary.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-full px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: `${riskTone}15`, color: riskTone, border: `1px solid ${riskTone}30` }}>
                      {investigationSummary.severityLabel} risk
                    </div>
                    <div className={`rounded-full border px-3 py-1.5 text-sm ${isDarkMode ? 'border-white/8 text-[#94A3B8]' : 'border-[#E2E8F0] text-[#64748B]'}`}>
                      {investigationSummary.hostname}
                    </div>
                    <div className={`rounded-full border px-3 py-1.5 text-sm ${isDarkMode ? 'border-white/8 text-[#94A3B8]' : 'border-[#E2E8F0] text-[#64748B]'}`}>
                      {investigationSummary.threatCount} heuristics triggered
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[0.95fr,1.05fr] gap-6">
                <div className={`rounded-[28px] border p-6 relative overflow-hidden ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0] shadow-sm'}`}>
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, #FACC15, #FDE047)' }} />
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className={`text-[20px] uppercase tracking-[0.08em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Credibility Score</p>
                      <h2 className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>Shield Verification Meter</h2>
                    </div>
                    <div className="rounded-full px-3 py-1 text-sm" style={{ border: `1px solid ${UI_COLORS.secondary}33`, backgroundColor: `${UI_COLORS.secondary}12`, color: UI_COLORS.secondary }}>AI-calibrated</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <CredibilityGauge score={investigationScore} isDarkMode={isDarkMode} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                      {
                        icon: ShieldCheck,
                        label: 'Severity Score',
                        accent: investigationSummary.severityAccent,
                        content: (
                          <>
                            <div className="flex items-end gap-3 mb-2">
                              <span className="text-6xl font-semibold leading-none" style={{ color: investigationSummary.severityAccent }}><Counter value={investigationSummary.severityScore} duration={900} /></span>
                              <div className="pb-1">
                                <p className="text-2xl font-semibold" style={{ color: investigationSummary.severityAccent }}>{investigationSummary.severityLabel}</p>
                                <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>out of 100</p>
                              </div>
                            </div>
                            <div className={`h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#1E293B]' : 'bg-[#E2E8F0]'}`}>
                              <div className="h-full rounded-full" style={{ width: `${investigationSummary.severityScore}%`, backgroundColor: investigationSummary.severityAccent }} />
                            </div>
                          </>
                        )
                      },
                      {
                        icon: CalendarDays,
                        label: 'Domain Age',
                        accent: '#22C55E',
                        content: (
                          <>
                            <p className={`text-4xl font-semibold ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{investigationSummary.domainAgeLabel}</p>
                            <p className={`mt-3 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{investigationSummary.domainAgeNote}</p>
                            <p className="mt-3 text-lg text-[#22C55E]">0% Risk score</p>
                          </>
                        )
                      },
                      {
                        icon: Lock,
                        label: 'SSL Status',
                        accent: investigationSummary.sslAccent,
                        content: (
                          <>
                            <p className="text-2xl font-semibold" style={{ color: investigationSummary.sslAccent }}>{investigationSummary.sslLabel}</p>
                            <div className="mt-3 inline-flex items-center rounded-full border px-3 py-1 text-sm" style={{ borderColor: `${investigationSummary.sslAccent}55`, color: investigationSummary.sslAccent, backgroundColor: `${investigationSummary.sslAccent}10` }}>
                              {domainRisk === 'high' ? 'CRITICAL' : investigationSummary.isHttps ? 'ENCRYPTED' : 'UNSAFE'}
                            </div>
                            <p className={`mt-4 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{investigationSummary.sslNote}</p>
                            {domainRisk === 'high' && <p className="mt-3 text-lg" style={{ color: UI_COLORS.alert }}>+50% Risk score</p>}
                          </>
                        )
                      },
                      {
                        icon: MapPin,
                        label: 'Location',
                        accent: '#FBBF24',
                        content: (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className={`text-3xl font-semibold ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{investigationSummary.locationLabel}</p>
                                <p className={`mt-3 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{investigationSummary.locationNote}</p>
                              </div>
                              <Globe className="w-8 h-8 text-[#FBBF24]" />
                            </div>
                          </>
                        )
                      },
                    ].map((card) => {
                      const Icon = card.icon;
                      return (
                        <motion.div
                          key={card.label}
                          whileHover={{ y: -5 }}
                          className={`rounded-[28px] border p-6 transition-all cursor-pointer relative overflow-hidden ${isDarkMode ? 'bg-[#111827] border-white/8 hover:border-white/12 hover:shadow-[0_20px_45px_rgba(2,6,23,0.32)]' : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-md'}`}
                        >
                          <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: card.accent }} />
                          <div className="flex items-start justify-between gap-3 mb-5">
                            <div>
                              <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{card.label}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${card.accent}15`, color: card.accent }}>
                              <Icon className="w-5 h-5" />
                            </div>
                          </div>
                          {card.content}
                        </motion.div>
                      );
                    })}
                  </div>

                  <motion.div
                    whileHover={{ y: -3 }}
                    className={`rounded-[28px] border p-6 transition-all cursor-pointer relative overflow-hidden ${isDarkMode ? 'bg-[#111827] border-white/8 hover:border-[#EF4444]/20 hover:shadow-[0_18px_40px_rgba(239,68,68,0.08)]' : 'bg-white border-[#E2E8F0] hover:border-[#FCA5A5] hover:shadow-md'}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${UI_COLORS.alert}, ${UI_COLORS.primary})` }} />
                    <div className="flex items-center justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3">
                        <TriangleAlert className="w-5 h-5 text-[#EF4444]" />
                        <h3 className={`text-[20px] uppercase tracking-[0.08em] ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Detected Threats</h3>
                      </div>
                      <div className="rounded-full border border-[#EF4444]/20 bg-[#EF4444]/10 px-4 py-1.5 text-[#EF4444]">
                        {investigationSummary.threatCount} flagged
                      </div>
                    </div>

                    {investigationSummary.threats.length > 0 ? (
                      <div className="space-y-3">
                        {investigationSummary.threats.map((threat) => (
                          <div
                            key={threat}
                            className={`flex items-start gap-3 rounded-2xl border px-4 py-4 transition-all cursor-pointer hover:-translate-y-0.5 ${isDarkMode ? 'bg-[#0F172A] border-white/8 hover:border-[#EF4444]/20' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#FCA5A5]'}`}
                          >
                            <ShieldX className="w-5 h-5 text-[#EF4444] mt-0.5 flex-shrink-0" />
                            <p className={isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}>{threat}</p>
                          </div>
                        ))}
                        <div className={`rounded-2xl border px-4 py-4 ${isDarkMode ? 'bg-[#0F172A] border-white/8' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                          <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{investigationSummary.summary}</p>
                        </div>
                      </div>
                    ) : (
                      <div className={`rounded-2xl border px-5 py-6 ${isDarkMode ? 'bg-[#0F172A] border-white/8 text-[#94A3B8]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'}`}>
                        No explicit threat flags were triggered.
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -3 }}
                    className={`rounded-[28px] border overflow-hidden transition-all relative ${isDarkMode ? 'bg-[#111827] border-white/8 hover:border-[#3B82F6]/20 hover:shadow-[0_18px_40px_rgba(59,130,246,0.08)]' : 'bg-white border-[#E2E8F0] hover:border-[#BFDBFE] hover:shadow-md'}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, #22C55E, #34D399)' }} />
                    <div className={`flex items-center gap-3 px-6 py-5 border-b ${isDarkMode ? 'border-white/8' : 'border-[#E2E8F0]'}`}>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDarkMode ? 'bg-[#0F172A] text-[#93C5FD]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`text-[20px] uppercase tracking-[0.08em] ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Advanced Technical Details</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 px-6 py-5">
                      {technicalDetails.map((detail) => (
                        <div
                          key={detail.label}
                          className={`rounded-2xl px-4 py-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 border border-transparent ${isDarkMode ? 'hover:bg-white/[0.03] hover:border-white/30' : 'hover:bg-[#F8FAFC] hover:border-white'}`}
                        >
                          <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{detail.label}</p>
                          <p className={`text-xl font-semibold break-words ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{detail.value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}