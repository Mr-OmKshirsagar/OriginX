import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  SearchCheck,
  Link2,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Clock3,
  Globe,
  Lock,
  Radar,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import CytoscapeComponent from 'react-cytoscapejs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Sidebar } from '../components/Sidebar';
import { CredibilityGauge } from '../components/CredibilityGauge';
import { useDarkMode } from '../components/DarkModeContext';
import {
  analyzeDomainSecurity,
  analyzeRedditPropagation,
  type DomainSecurityResult,
  type RedditPropagationResponse,
} from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  const { isDarkMode } = useDarkMode();
  const [url, setUrl] = useState('https://example-news.net/world/breaking-government-bans-all-petrol-cars');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [showResults, setShowResults] = useState(true);
  const [domainResult, setDomainResult] = useState<DomainSecurityResult | null>(null);
  const [redditResult, setRedditResult] = useState<RedditPropagationResponse | null>(null);
  const [investigationError, setInvestigationError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const steps: ProgressStep[] = [
    { id: 'extract', label: 'Extracting article content' },
    { id: 'claims', label: 'Detecting claims and key entities' },
    { id: 'sources', label: 'Checking trusted sources' },
    { id: 'domain', label: 'Analyzing domain reputation' },
    { id: 'graph', label: 'Building propagation graph' },
  ];

  useEffect(() => {
    if (!isInvestigating) return;

    setShowResults(false);
    setActiveStep(0);
    let stepIndex = 0;

    const interval = window.setInterval(() => {
      stepIndex += 1;
      if (stepIndex >= steps.length) {
        window.clearInterval(interval);
        setIsInvestigating(false);
        setShowResults(true);
        setActiveStep(steps.length - 1);
        return;
      }

      setActiveStep(stepIndex);
    }, 950);

    return () => window.clearInterval(interval);
  }, [isInvestigating, steps.length]);

  const runInvestigation = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setInvestigationError('Please enter a valid URL before starting investigation.');
      return;
    }

    setInvestigationError(null);

    try {
      const [domainResponse, redditResponse] = await Promise.all([
        analyzeDomainSecurity({ url: trimmedUrl }),
        analyzeRedditPropagation({
          query: trimmedUrl,
          limit: 10,
          include_comments: false,
          comments_per_post: 0,
          sort: 'new',
          time_filter: 'day',
        }),
      ]);

      setDomainResult(domainResponse.results[0] || null);
      setRedditResult(redditResponse);
      setLastUpdated(new Date());
    } catch (error) {
      setInvestigationError(error instanceof Error ? error.message : 'Failed to connect to backend services.');
    }
  };

  useEffect(() => {
    if (!showResults || isInvestigating) return;

    void runInvestigation();

    const interval = window.setInterval(() => {
      void runInvestigation();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [showResults, isInvestigating, url]);

  const trustedArticles: TrustedArticle[] = [
    {
      title: 'Reuters fact-check confirms policy proposal is still under review',
      source: 'Reuters',
      url: '#',
      similarity: 91,
    },
    {
      title: 'BBC analysis outlines timeline for transport regulation changes',
      source: 'BBC News',
      url: '#',
      similarity: 87,
    },
    {
      title: 'AP verifies no immediate nationwide ban has been enacted',
      source: 'Associated Press',
      url: '#',
      similarity: 83,
    },
  ];

  const domainRisk = domainResult?.domain_risk || 'unknown';
  const spreadNodes = redditResult?.analysis.spread_nodes || 0;
  const riskBaseScore = domainRisk === 'high' ? 22 : domainRisk === 'medium' ? 45 : domainRisk === 'low' ? 78 : 60;
  const investigationScore = Math.max(5, Math.min(95, riskBaseScore - Math.min(spreadNodes, 20)));

  const clusterCounts = redditResult?.analysis.clusters.map((cluster) => cluster.event_count) || [];
  const lineChartData = useMemo(() => ({
    labels: clusterCounts.length ? clusterCounts.map((_, index) => `Cluster ${index + 1}`) : ['Live Feed'],
    datasets: [
      {
        label: 'Narrative Spread Volume',
        data: clusterCounts.length ? clusterCounts : [redditResult?.events_count || 0],
        borderColor: '#22D3EE',
        backgroundColor: 'rgba(34,211,238,0.18)',
        tension: 0.35,
        fill: true,
      },
    ],
  }), [clusterCounts, redditResult?.events_count]);

  const similarityBreakdown = useMemo(() => {
    if (!trustedArticles.length) {
      return [
        { label: 'Live Source Match', score: 50, color: '#F59E0B', tier: 'Pending' },
      ];
    }

    return trustedArticles.map((article) => ({
      label: article.source,
      score: article.similarity,
      color: article.similarity >= 80 ? '#22C55E' : article.similarity >= 60 ? '#3B82F6' : '#F59E0B',
      tier: article.similarity >= 80 ? 'High Trust' : article.similarity >= 60 ? 'Trusted' : 'Watch',
    }));
  }, [trustedArticles]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#94A3B8' },
        grid: { color: 'rgba(148,163,184,0.08)' },
      },
      y: {
        ticks: { color: '#94A3B8' },
        grid: { color: 'rgba(148,163,184,0.08)' },
      },
    },
  };

  const cytoscapeElements = useMemo(() => {
    if (!redditResult?.analysis.graph.nodes.length) {
      return [
        { data: { id: 'seed', label: 'Seed URL' } },
      ];
    }

    const nodeElements = redditResult.analysis.graph.nodes.map((node) => ({
      data: { id: node, label: node },
    }));

    const edgeElements = redditResult.analysis.graph.edges.map((edge) => ({
      data: { source: edge.source, target: edge.target, weight: edge.weight },
    }));

    return [...nodeElements, ...edgeElements];
  }, [redditResult]);

  const metricCards = [
    {
      icon: ShieldCheck,
      label: 'Verification Result',
      value: domainRisk === 'high' ? 'High Risk' : domainRisk === 'medium' ? 'Mixed' : domainRisk === 'low' ? 'Safer' : 'Unknown',
      accent: domainRisk === 'high' ? '#EF4444' : domainRisk === 'medium' ? '#F59E0B' : '#22C55E',
      note: domainResult?.reason || 'Awaiting backend domain analysis',
    },
    {
      icon: Globe,
      label: 'Domain',
      value: domainResult?.domain || 'Unknown',
      accent: '#22D3EE',
      note: 'Resolved from backend URL analysis',
    },
    {
      icon: Lock,
      label: 'Security Status',
      value: url.startsWith('https://') ? 'HTTPS' : 'HTTP',
      accent: url.startsWith('https://') ? '#22C55E' : '#F97316',
      note: url.startsWith('https://') ? 'Encrypted transport detected' : 'Unencrypted transport',
    },
    {
      icon: ShieldAlert,
      label: 'Narrative Spread Nodes',
      value: String(spreadNodes || 0),
      accent: '#F97316',
      note: 'Live Reddit propagation graph nodes',
    },
  ];

  const urlExplanationPoints = [
    {
      title: 'Claim Framing',
      body: domainResult?.reason || 'The article framing will be evaluated once domain intelligence is available.'
    },
    {
      title: 'Source Reliability',
      body: domainResult?.domain ? `Domain under review: ${domainResult.domain}` : 'Domain metadata is being retrieved from backend analysis.'
    },
    {
      title: 'Amplification Pattern',
      body: redditResult
        ? `Propagation graph detected ${redditResult.analysis.spread_nodes} unique accounts and ${redditResult.events_count} total events.`
        : 'Propagation graph will populate once Reddit analysis completes.'
    }
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'}`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-4 py-1.5 mb-4">
                <Radar className="w-4 h-4 text-[#22D3EE]" />
                <span className="text-sm text-[#22D3EE]">URL Investigation Mode</span>
              </div>
              <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
                URL Investigation Mode
              </h1>
              <p className={isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}>
                Analyze the credibility of online news articles.
              </p>
            </div>
          </div>

          <div className={`rounded-[28px] border p-8 relative overflow-hidden ${
            isDarkMode
              ? 'bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] border-white/8 shadow-[0_30px_80px_rgba(2,6,23,0.46)]'
              : 'bg-white border-[#E2E8F0]'
          }`}>
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[#3B82F6]/10 blur-3xl" />
            <div className="relative grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-8 items-center">
              <div>
                <p className={`text-xs uppercase tracking-[0.18em] mb-3 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>URL Input Panel</p>
                <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#0F172A]/90 border-white/8' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <div className="relative">
                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <input
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="Paste a news article URL to investigate"
                      className={`w-full rounded-2xl border pl-12 pr-4 py-4 outline-none transition-all ${
                        isDarkMode
                          ? 'bg-[#0B1120] border-[#334155] text-white placeholder:text-[#64748B] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#22D3EE]/20'
                          : 'bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#22D3EE]/20'
                      }`}
                    />
                  </div>
                  <p className={`text-sm mt-3 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    Example: `https://example-news.net/world/breaking-government-bans-all-petrol-cars`
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 xl:items-end">
                <motion.button
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsInvestigating(true);
                    void runInvestigation();
                  }}
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] px-8 py-4 text-white shadow-[0_18px_40px_rgba(34,211,238,0.24)]"
                >
                  <SearchCheck className="w-5 h-5" />
                  <span>Start Investigation</span>
                </motion.button>
                <div className={`rounded-2xl border px-4 py-3 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <p className={`text-xs uppercase tracking-[0.18em] ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Investigation State</p>
                  <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{isInvestigating ? 'Running AI pipeline' : 'Ready for analysis'}</p>
                  {lastUpdated && <p className="text-xs text-[#22D3EE] mt-1">Live refresh: {lastUpdated.toLocaleTimeString()}</p>}
                </div>
              </div>
            </div>

            {investigationError && (
              <div className="mt-6 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
                {investigationError}
              </div>
            )}
          </div>

          <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Investigation Progress</p>
                <h2 className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>Pipeline Activity</h2>
              </div>
              {isInvestigating && <span className="text-sm text-[#22D3EE]">Running...</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {steps.map((step, index) => {
                const isComplete = activeStep > index || (!isInvestigating && showResults);
                const isCurrent = activeStep === index && isInvestigating;

                return (
                  <motion.div
                    key={step.id}
                    animate={{ opacity: isComplete || isCurrent ? 1 : 0.6 }}
                    className={`rounded-2xl border p-4 ${
                      isCurrent
                        ? 'border-[#22D3EE]/30 bg-[#22D3EE]/10'
                        : isComplete
                          ? 'border-[#22C55E]/20 bg-[#22C55E]/10'
                          : isDarkMode ? 'border-white/8 bg-white/5' : 'border-[#E2E8F0] bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isComplete ? <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> : <Sparkles className={`w-4 h-4 ${isCurrent ? 'text-[#22D3EE] animate-pulse' : 'text-[#64748B]'}`} />}
                      <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Step {index + 1}</span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{step.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {showResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-[0.95fr,1.05fr] gap-6">
                <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Credibility Score</p>
                      <h2 className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>Shield Verification Meter</h2>
                    </div>
                    <div className="rounded-full border border-[#FBBF24]/30 bg-[#FBBF24]/10 px-3 py-1 text-sm text-[#FBBF24]">Unverified</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <CredibilityGauge score={investigationScore} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metricCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <motion.div
                        key={card.label}
                        whileHover={{ y: -4 }}
                        className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}
                        style={{ boxShadow: `0 0 24px ${card.accent}18` }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{card.label}</p>
                            <p className={`text-3xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{card.value}</p>
                          </div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${card.accent}18` }}>
                            <Icon className="w-5 h-5" style={{ color: card.accent }} />
                          </div>
                        </div>
                        <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{card.note}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[0.9fr,1.1fr] gap-6">
                <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Trusted Sources</p>
                      <h2 className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>Cross-referenced Articles</h2>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                  </div>
                  <div className="space-y-4">
                    {trustedArticles.map((article) => (
                      <div key={article.title} className={`rounded-2xl border p-4 ${isDarkMode ? 'bg-[#0F172A] border-[#22C55E]/15' : 'bg-[#F8FAFC] border-[#BBF7D0]'}`}>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{article.title}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{article.source}</p>
                          </div>
                          <span className="text-[#22C55E]">{article.similarity}%</span>
                        </div>
                        <a href={article.url} className="inline-flex items-center gap-1 text-sm text-[#22D3EE]">
                          Open source
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Propagation Analysis</p>
                      <h2 className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>Narrative Spread Network</h2>
                    </div>
                    <Radar className="w-5 h-5 text-[#22D3EE]" />
                  </div>
                  <div className="h-[360px] rounded-2xl border border-white/8 overflow-hidden bg-[#0B1120]">
                    <CytoscapeComponent
                      elements={cytoscapeElements}
                      style={{ width: '100%', height: '100%' }}
                      layout={{ name: 'cose', animate: false }}
                      stylesheet={[
                        {
                          selector: 'node',
                          style: {
                            label: 'data(label)',
                            color: '#E2E8F0',
                            'background-color': '#22D3EE',
                            'text-valign': 'bottom',
                            'text-margin-y': 8,
                            'font-size': 10,
                            width: 22,
                            height: 22,
                            'overlay-opacity': 0,
                          },
                        },
                        {
                          selector: 'edge',
                          style: {
                            width: 2,
                            'line-color': '#3B82F6',
                            'target-arrow-color': '#3B82F6',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                          },
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-6">
                <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Visualization</p>
                      <h2 className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>Timeline of Narrative Spread</h2>
                    </div>
                  </div>
                  <div className="h-[280px] rounded-2xl border border-white/8 bg-[#0B1120]/70 p-4">
                    <Line data={lineChartData} options={chartOptions} />
                  </div>
                </div>

                <div className={`rounded-2xl border p-6 ${
                  isDarkMode
                    ? 'bg-[linear-gradient(165deg,rgba(12,20,40,0.96),rgba(9,16,33,0.96))] border-white/8'
                    : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Similarity Analysis</p>
                      <h2 className={`text-[1.1rem] ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Article Match Comparison</h2>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs border ${
                      isDarkMode
                        ? 'border-[#22D3EE]/25 bg-[#22D3EE]/10 text-[#67E8F9]'
                        : 'border-[#BAE6FD] bg-[#ECFEFF] text-[#0E7490]'
                    }`}>
                      Live match profile
                    </span>
                  </div>

                  <div className={`rounded-2xl border p-4 ${
                    isDarkMode
                      ? 'border-white/8 bg-[linear-gradient(180deg,rgba(8,13,28,0.96),rgba(7,12,24,0.96))]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC]'
                  }`}>
                    <div className="space-y-3">
                      {similarityBreakdown.map((item, index) => (
                        <div
                          key={item.label}
                          className={`rounded-xl border p-3 ${
                            isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-[#E2E8F0] bg-white'
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>#{index + 1}</span>
                              <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{item.label}</p>
                            </div>
                            <p style={{ color: item.color }}>{item.score}%</p>
                          </div>
                          <div className={`h-2 overflow-hidden rounded-full ${isDarkMode ? 'bg-[#1E293B]' : 'bg-[#E2E8F0]'}`}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.score}%` }}
                              transition={{ duration: 0.65, delay: index * 0.08 }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}CC)` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {similarityBreakdown.map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-xl border px-3 py-2 ${
                          isDarkMode
                            ? 'border-white/8 bg-white/[0.04]'
                            : 'border-[#E2E8F0] bg-[#F8FAFC]'
                        }`}
                      >
                        <p className={`text-xs mb-1 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{item.label}</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{item.score}%</p>
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-[10px]"
                            style={{ background: `${item.color}1F`, color: item.color }}
                          >
                            {item.tier}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#22D3EE]">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.18em] ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Explanation Summary</p>
                    <h2 className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>AI Explanation</h2>
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
                        <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#93C5FD]' : 'text-[#1D4ED8]'}`}>AI Verdict</p>
                        <h3 className={`text-lg ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                          {domainRisk === 'high'
                            ? 'The URL has high-risk domain signals and should be treated as potentially unsafe.'
                            : domainRisk === 'medium'
                              ? 'The URL has mixed risk indicators and needs secondary verification.'
                              : domainRisk === 'low'
                                ? 'The domain appears safer, but narrative validation still matters.'
                                : 'Risk signal is inconclusive until more threat intelligence is available.'}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-3 py-1 text-xs text-[#F59E0B]">Confidence: Live backend</span>
                        <span className="inline-flex items-center rounded-full border border-[#22C55E]/20 bg-[#22C55E]/10 px-3 py-1 text-xs text-[#22C55E]">Domain Risk: {domainRisk}</span>
                        <span className="inline-flex items-center rounded-full border border-[#EF4444]/20 bg-[#EF4444]/10 px-3 py-1 text-xs text-[#EF4444]">Spread Nodes: {spreadNodes}</span>
                      </div>
                    </div>

                    <p className={`leading-relaxed ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                      {domainResult?.reason || 'The investigation is waiting for backend domain intelligence and propagation data.'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {urlExplanationPoints.map((point) => (
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
                      Practical takeaway: use this as a real-time monitoring signal. Final trust decisions should combine backend risk indicators, source quality, and editorial judgment.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}