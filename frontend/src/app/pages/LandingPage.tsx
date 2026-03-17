import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Sparkles,
  Shield,
  Search,
  Globe,
  Clock,
  Brain,
  Image as ImageIcon,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  Menu,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  LayoutDashboard,
  History as HistoryIcon,
  Settings
} from 'lucide-react';
import { FeatureCard } from '../components/FeatureCard';
import { useDarkMode } from '../components/DarkModeContext';
import { useLanguage } from '../components/LanguageContext';

function GlowCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState({ x: 0, y: 0, visible: false });
  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
      }}
      onMouseLeave={() => setGlow((g) => ({ ...g, visible: false }))}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(300px circle at ${glow.x}px ${glow.y}px, rgba(59,130,246,0.18), transparent 70%)`,
          opacity: glow.visible ? 1 : 0,
        }}
      />
      {children}
    </div>
  );
}

export function LandingPage() {
  const [claim, setClaim] = useState('');
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { t, locale } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dashboardStats = [
    { label: t('totalVerifications'), value: '1,284', change: '+12.5%', trend: 'up',   icon: Activity,     color: '#3B82F6' },
    { label: t('dashboardStatTrueClaims'),  value: '892',   change: '+8.2%',  trend: 'up',   icon: CheckCircle2, color: '#22C55E' },
    { label: t('dashboardStatFalseClaims'), value: '234',   change: '-5.1%',  trend: 'down', icon: XCircle,      color: '#EF4444' },
    { label: t('dashboardStatUncertain'),   value: '158',   change: '+3.4%',  trend: 'up',   icon: AlertCircle,  color: '#FBBF24' },
  ];

  const recentVerifications = [
    { id: 1, claim: t('landingDemoClaim1'), score: 82, status: t('historyStatusLikelyTrue'), date: '2026-03-11', sources: 12 },
    { id: 2, claim: t('landingDemoClaim2'), score: 23, status: t('historyStatusLikelyFalse'), date: '2026-03-10', sources: 8 },
    { id: 3, claim: t('landingDemoClaim3'), score: 91, status: t('historyStatusVerifiedTrue'), date: '2026-03-09', sources: 24 },
    { id: 4, claim: t('landingDemoClaim4'), score: 56, status: t('historyStatusUncertain'), date: '2026-03-08', sources: 6 },
  ];

  const trendingTopics = [
    { topic: t('landingTopic1'), count: 234, trend: 'up' },
    { topic: t('landingTopic2'), count: 189, trend: 'up' },
    { topic: t('landingTopic3'), count: 156, trend: 'down' },
    { topic: t('landingTopic4'), count: 142, trend: 'up' },
    { topic: t('landingTopic5'), count: 98, trend: 'down' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#22C55E';
    if (score >= 40) return '#FBBF24';
    return '#EF4444';
  };

  const sidebarNavItems = [
    { icon: LayoutDashboard, label: t('navDashboard'),         path: '/dashboard'    },
    { icon: Search,          label: t('navVerify'),            path: '/verify'       },
    { icon: HistoryIcon,     label: t('navHistory'),           path: '/history'      },
    { icon: ImageIcon,       label: t('navImageVerification'), path: '/verify-image' },
    { icon: Settings,        label: t('navSettings'),          path: '/settings'     },
  ];

  const handleVerify = () => {
    if (claim.trim()) {
      navigate('/verify', { state: { claim, autoAnalyze: true } });
    }
  };

  const workflowSteps = [
    {
      icon: Search,
      accent: 'from-[#3B82F6]/25 via-[#3B82F6]/10 to-transparent',
      iconClassName: 'text-[#60A5FA]',
      title: t('landingWorkflowStep1Title'),
      description: t('landingWorkflowStep1Desc'),
      meta: t('landingWorkflowStep1Meta'),
    },
    {
      icon: Shield,
      accent: 'from-[#22C55E]/25 via-[#22C55E]/10 to-transparent',
      iconClassName: 'text-[#4ADE80]',
      title: t('landingWorkflowStep2Title'),
      description: t('landingWorkflowStep2Desc'),
      meta: t('landingWorkflowStep2Meta'),
    },
    {
      icon: Brain,
      accent: 'from-[#F59E0B]/25 via-[#F59E0B]/10 to-transparent',
      iconClassName: 'text-[#FBBF24]',
      title: t('landingWorkflowStep3Title'),
      description: t('landingWorkflowStep3Desc'),
      meta: t('landingWorkflowStep3Meta'),
    },
  ];

  const formatDemoDate = (isoDate: string) => {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return t('commonUnknownDate');
    return parsed.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const features = [
    {
      icon: Shield,
      title: t('featureCredibilityTitle'),
      description: t('featureCredibilityDesc')
    },
    {
      icon: Search,
      title: t('featureMultiSourceTitle'),
      description: t('featureMultiSourceDesc')
    },
    {
      icon: Globe,
      title: t('featureFakeSiteTitle'),
      description: t('featureFakeSiteDesc')
    },
    {
      icon: Clock,
      title: t('featureTimelineTitle'),
      description: t('featureTimelineDesc')
    },
    {
      icon: Brain,
      title: t('featureAiExplanationTitle'),
      description: t('featureAiExplanationDesc')
    },
    {
      icon: ImageIcon,
      title: t('featureImageTitle'),
      description: t('featureImageDesc')
    }
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode ? 'bg-gradient-to-b from-[#0B1120] to-[#1F2937]' : 'bg-gradient-to-b from-[#F8FAFC] to-white'
    }`}>
      {/* Navigation */}
      <nav className={`border-b backdrop-blur-sm fixed top-0 w-full z-50 transition-all duration-300 ${
        isDarkMode ? 'border-[#1F2937] bg-[#0B1120]/90' : 'border-[#E2E8F0] bg-white/80'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-lg flex items-center justify-center shadow-lg shadow-[#3B82F6]/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-semibold transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>OriginX</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-[#1F2937] text-[#22D3EE] hover:bg-[#374151]' 
                  : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
              }`}
              aria-label={t('landingAriaToggleDarkMode')}
            >
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Menu Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isDarkMode
                  ? 'bg-[#1F2937] text-[#F9FAFB] hover:bg-[#374151]'
                  : 'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]'
              }`}
              aria-label={t('landingAriaGoToDashboard')}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#3B82F6]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#22D3EE]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-sm text-[#3B82F6]">{t('landingBadge')}</span>
            </div>
            
            <h1 className={`text-6xl mb-6 max-w-4xl mx-auto leading-tight ${
              isDarkMode ? 'text-white' : 'text-[#0F172A]'
            }`}>
              {t('landingHeroTitle')}
            </h1>

            <p className={`text-xl max-w-3xl mx-auto mb-12 ${
              isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'
            }`}>
              {t('landingHeroSubtitle')}
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <div className={`rounded-2xl shadow-2xl p-2 flex gap-2 transition-all duration-300 ${
                isDarkMode ? 'bg-[#1F2937] border border-[#374151]' : 'bg-white border border-[#E2E8F0]'
              }`}>
                <input
                  type="text"
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder={t('landingSearchPlaceholder')}
                  className={`flex-1 px-6 py-4 bg-transparent outline-none transition-all duration-200 cursor-text ${
                    isDarkMode ? 'text-[#F9FAFB] placeholder:text-[#9CA3AF]' : 'text-[#0F172A] placeholder:text-[#94A3B8]'
                  }`}
                />
                <button
                  onClick={handleVerify}
                  className="px-8 py-4 bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] text-white rounded-xl hover:shadow-2xl hover:shadow-[#3B82F6]/40 hover:scale-105 transition-all duration-300 flex items-center gap-2 group cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">{t('landingVerifyCta')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className={`py-20 px-6 transition-colors ${
        isDarkMode ? 'bg-[#080E1A]' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[#60A5FA]" />
              <span className="text-sm text-[#60A5FA] font-medium">{t('landingHowItWorksBadge')}</span>
            </div>
            <h2 className={`text-4xl mb-4 ${
              isDarkMode ? 'text-white' : 'text-[#0F172A]'
            }`}>{t('landingHowItWorksTitle')}</h2>
            <p className={`text-xl max-w-2xl mx-auto ${
              isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'
            }`}>
              {t('landingHowItWorksDesc')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <GlowCard key={index} className="rounded-[28px]">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className={`rounded-[28px] border p-7 h-full flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.18)] ${
                      isDarkMode
                        ? 'bg-[#0F172A] border-[#1E293B] hover:border-[#334155]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${step.accent} pointer-events-none`} />
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold ${
                        isDarkMode ? 'border-white/10 bg-white/5 text-white' : 'border-[#DBEAFE] bg-white text-[#2563EB]'
                      }`}>
                        0{index + 1}
                      </span>
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${
                        isDarkMode ? 'border-white/10 bg-white/5' : 'border-white bg-white shadow-sm'
                      }`}>
                        <Icon className={`w-6 h-6 ${step.iconClassName}`} />
                      </div>
                    </div>

                    <div className="relative z-10 space-y-3">
                      <h3 className={`text-2xl font-semibold ${
                        isDarkMode ? 'text-white' : 'text-[#0F172A]'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-base leading-7 ${
                        isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'
                      }`}>
                        {step.description}
                      </p>
                    </div>

                    <div className="relative z-10 mt-auto pt-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                        isDarkMode
                          ? 'border-white/10 bg-white/5 text-[#CBD5E1]'
                          : 'border-[#DBEAFE] bg-white text-[#475569]'
                      }`}>
                        {step.meta}
                      </span>
                    </div>
                  </motion.div>
                </GlowCard>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className={`mt-8 relative overflow-hidden rounded-[36px] border p-8 lg:p-10 ${
              isDarkMode
                ? 'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),linear-gradient(135deg,rgba(8,14,26,0.98),rgba(15,23,42,0.9))] border-[#1E293B]'
                : 'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_28%),linear-gradient(135deg,#F8FBFF,#FFFFFF)] border-[#E2E8F0]'
            }`}
          >
            <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-[#22D3EE]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-12 h-44 w-44 rounded-full bg-[#3B82F6]/10 blur-3xl" />

            <div className="relative grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-stretch">
              <div className="flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full border border-[#3B82F6]/20 bg-[#3B82F6]/10 px-3 py-1 text-xs font-medium text-[#3B82F6] shadow-[0_0_0_1px_rgba(59,130,246,0.08)]">
                    {t('landingWorkflowPanelEyebrow')}
                  </span>
                  <h3 className={`mt-5 max-w-lg text-4xl leading-tight font-semibold ${
                    isDarkMode ? 'text-white' : 'text-[#0F172A]'
                  }`}>
                    {t('landingWorkflowPanelTitle')}
                  </h3>
                  <p className={`mt-4 max-w-2xl text-lg leading-8 ${
                    isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'
                  }`}>
                    {t('landingWorkflowPanelDesc')}
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  {[
                    { key: 1, icon: Activity, tone: 'text-[#60A5FA] bg-[#3B82F6]/12 border-[#3B82F6]/20' },
                    { key: 2, icon: Shield, tone: 'text-[#4ADE80] bg-[#22C55E]/12 border-[#22C55E]/20' },
                    { key: 3, icon: Brain, tone: 'text-[#FBBF24] bg-[#F59E0B]/12 border-[#F59E0B]/20' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.key}
                        className={`group rounded-[24px] border p-4 transition-all duration-300 ${
                          isDarkMode
                            ? 'border-white/8 bg-white/[0.035] hover:bg-white/[0.06]'
                            : 'border-[#E2E8F0] bg-white/90 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${item.tone}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-semibold tracking-[0.18em] ${
                                isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'
                              }`}>
                                0{item.key}
                              </span>
                              <div className={`h-px flex-1 ${isDarkMode ? 'bg-white/8' : 'bg-[#E2E8F0]'}`} />
                            </div>
                            <p className={`mt-3 text-xl font-medium leading-8 ${
                              isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'
                            }`}>
                              {t(`landingWorkflowOutcome${item.key}`)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`rounded-[30px] border p-6 lg:p-7 backdrop-blur-sm ${
                isDarkMode
                  ? 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]'
                  : 'border-[#DCE7F5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] shadow-[0_20px_60px_rgba(15,23,42,0.08)]'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#3B82F6]">{t('landingWorkflowPreviewLabel')}</p>
                    <h4 className={`mt-1 text-xl font-semibold leading-8 ${
                      isDarkMode ? 'text-white' : 'text-[#0F172A]'
                    }`}>
                      {recentVerifications[1]?.claim}
                    </h4>
                  </div>
                  <span className="inline-flex rounded-full border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-1 text-xs font-semibold text-[#F87171] shadow-[0_8px_24px_rgba(239,68,68,0.12)]">
                    {recentVerifications[1]?.status}
                  </span>
                </div>

                <div className={`mt-6 rounded-[24px] border p-5 ${
                  isDarkMode ? 'border-white/8 bg-[#020617]/50' : 'border-[#E2E8F0] bg-[#F8FAFC]'
                }`}>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#64748B]">{t('verifyCredibilityLabel')}</p>
                      <p className="mt-3 text-5xl font-semibold tracking-tight text-[#EF4444]">23%</p>
                    </div>
                    <div className={`rounded-2xl border px-3 py-2 text-right ${
                      isDarkMode ? 'border-white/8 bg-white/[0.03]' : 'border-white bg-white'
                    }`}>
                      <p className="text-xs text-[#64748B]">{formatDemoDate(recentVerifications[1]?.date ?? '')}</p>
                      <p className={`mt-1 text-sm font-medium ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                        {t('commonSourcesCount', { count: recentVerifications[1]?.sources ?? 0 })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#1E293B]/60">
                    <div className="h-full w-[23%] rounded-full bg-gradient-to-r from-[#EF4444] via-[#F97316] to-[#FBBF24]" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[#EF4444]">{t('historyStatusLikelyFalse')}</span>
                    <span className={isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}>{t('historyStatusUncertain')}</span>
                    <span className="text-[#22C55E]">{t('historyStatusLikelyTrue')}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className={`rounded-2xl border p-4 ${
                    isDarkMode ? 'border-white/8 bg-white/[0.03]' : 'border-[#E2E8F0] bg-white'
                  }`}>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#64748B]">{t('verifyTrustedSourcesBadge', { count: 2 })}</p>
                    <div className="mt-3 flex items-center gap-2 text-[#22C55E]">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">BBC, Reuters</span>
                    </div>
                  </div>
                  <div className={`rounded-2xl border p-4 ${
                    isDarkMode ? 'border-white/8 bg-white/[0.03]' : 'border-[#E2E8F0] bg-white'
                  }`}>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#64748B]">{t('verifyConflictingSourcesBadge', { count: 3 })}</p>
                    <div className="mt-3 flex items-center gap-2 text-[#F87171]">
                      <XCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Low-trust amplifiers</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-4 rounded-[24px] border p-4 ${
                  isDarkMode ? 'border-white/8 bg-white/[0.03]' : 'border-[#E2E8F0] bg-white'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-[#334155]'}`}>
                      {t('landingWorkflowPreviewSummary')}
                    </p>
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#3B82F6]/10 text-[#3B82F6]">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <Link
                  to="/verify"
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] px-5 py-3 text-sm font-medium text-white transition-all duration-300 hover:translate-y-[-1px] hover:shadow-xl hover:shadow-[#3B82F6]/20"
                >
                  <span>{t('landingVerifyCta')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 px-6 transition-colors ${
        isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl mb-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('landingFeaturesTitle')}</h2>
            <p className={`text-xl ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('landingFeaturesSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-3xl p-12 text-center shadow-2xl"
          >
            <h2 className="text-4xl text-white mb-4">{t('landingCtaTitle')}</h2>
            <p className="text-xl text-white/90 mb-8">{t('landingCtaSubtitle')}</p>
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#3B82F6] rounded-xl hover:shadow-xl transition-all group"
            >
              <span>{t('landingCtaButton')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-12 px-6 transition-colors ${
        isDarkMode ? 'border-[#1E293B]' : 'border-[#E2E8F0]'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                  <span className={`text-xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>OriginX</span>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('appTagline')}</p>
            </div>

            <div>
              <h3 className={`text-sm mb-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('footerProduct')}</h3>
              <div className="flex flex-col gap-2">
                <Link to="/verify" className={`text-sm hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('footerVerifyClaims')}</Link>
                <Link to="/dashboard" className={`text-sm hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('navDashboard')}</Link>
              </div>
            </div>

            <div>
              <h3 className={`text-sm mb-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('footerCompany')}</h3>
              <div className="flex flex-col gap-2">
                <a href="#" className={`text-sm hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('footerAbout')}</a>
                <a href="#" className={`text-sm hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('footerBlog')}</a>
                <a href="#" className={`text-sm hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('footerCareers')}</a>
              </div>
            </div>

            <div>
              <h3 className={`text-sm mb-4 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{t('footerLegal')}</h3>
              <div className="flex flex-col gap-2">
                <a href="#" className={`text-sm hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('footerPrivacy')}</a>
                <a href="#" className={`text-sm hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('footerTerms')}</a>
                <a href="#" className={`text-sm hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('footerSecurity')}</a>
              </div>
            </div>
          </div>

          <div className={`border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 ${
            isDarkMode ? 'border-[#1E293B]' : 'border-[#E2E8F0]'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{t('footerCopyright')}</p>

            <div className="flex items-center gap-4">
              <a href="#" className={`hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className={`hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className={`hover:text-[#3B82F6] transition-colors ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Dashboard Overlay Panel */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[200] flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />

          {/* Slide-in panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`relative ml-auto w-full flex h-full overflow-hidden shadow-2xl ${
              isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'
            }`}
          >
            {/* Sidebar */}
            <div className={`w-64 h-full border-r flex flex-col shrink-0 ${
              isDarkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className={`p-6 border-b ${
                isDarkMode ? 'border-[#1F2937]' : 'border-[#E2E8F0]'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-lg flex items-center justify-center shadow-lg shadow-[#3B82F6]/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xl font-semibold ${
                    isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'
                  }`}>OriginX</span>
                </div>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-[#9CA3AF]' : 'text-[#94A3B8]'
                }`}>{t('appTagline')}</p>
              </div>

              <nav className="flex-1 p-4">
                {sidebarNavItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <GlowCard key={i} className="rounded-lg mb-2">
                      <Link
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 w-full block transition-all duration-200 ${
                          isDarkMode
                            ? 'text-[#9CA3AF] hover:bg-[#1F2937]/60 hover:text-[#F9FAFB]'
                            : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    </GlowCard>
                  );
                })}
              </nav>

              <div className={`p-4 border-t ${
                isDarkMode ? 'border-[#1F2937]' : 'border-[#E2E8F0]'
              }`}>
                <button
                  onClick={toggleDarkMode}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg mb-3 transition-all ${
                    isDarkMode ? 'bg-[#1F2937] text-[#F9FAFB] hover:bg-[#374151]' : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {isDarkMode
                      ? <Moon className="w-5 h-5 text-[#22D3EE]" />
                      : <Sun className="w-5 h-5 text-[#FBBF24]" />}
                    <span className="text-sm">{isDarkMode ? t('darkMode') : t('lightMode')}</span>
                  </span>
                  <div className={`w-10 h-6 rounded-full p-1 transition-all duration-300 ${
                    isDarkMode ? 'bg-gradient-to-r from-[#3B82F6] to-[#22D3EE]' : 'bg-[#CBD5E1]'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                      isDarkMode ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </div>
                </button>

                <div className="rounded-lg p-4 border bg-gradient-to-br from-[#3B82F6]/10 to-[#22D3EE]/10 border-[#3B82F6]/20">
                  <p className="text-xs text-[#22D3EE] mb-1 font-medium">{t('totalVerifications')}</p>
                  <p className={`text-2xl font-bold ${
                    isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'
                  }`}>1,284</p>
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-[#9CA3AF]' : 'text-[#94A3B8]'
                  }`}>{t('completedThisMonth')}</p>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className={`text-3xl font-bold mb-1 ${
                    isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'
                  }`}>{t('navDashboard')}</h1>
                  <p className={isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}>
                    {t('dashboardSubtitle')}
                  </p>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isDarkMode
                      ? 'bg-[#1F2937] text-[#9CA3AF] hover:text-white hover:bg-[#374151]'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {dashboardStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                    >
                      <GlowCard className={`rounded-2xl border p-6 ${
                        isDarkMode
                          ? 'bg-[#1F2937] border-[#374151]'
                          : 'bg-white border-[#E2E8F0] shadow-sm'
                      }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${stat.color}15` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: stat.color }} />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${
                          stat.trend === 'up' ? 'text-[#22C55E]' : 'text-[#EF4444]'
                        }`}>
                          {stat.trend === 'up'
                            ? <TrendingUp className="w-4 h-4" />
                            : <TrendingDown className="w-4 h-4" />}
                          <span>{stat.change}</span>
                        </div>
                      </div>
                      <p className={`text-3xl font-bold mb-1 ${
                        isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'
                      }`}>{stat.value}</p>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'
                      }`}>{stat.label}</p>
                      </GlowCard>
                    </motion.div>
                  );
                })}
              </div>

              {/* Recent + Trending */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Verifications */}
                <div className="lg:col-span-2">
                  <GlowCard className={`rounded-2xl border p-6 ${
                    isDarkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E2E8F0] shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className={`text-xl font-bold ${
                        isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'
                      }`}>{t('dashboardRecentVerifications')}</h2>
                      <Link
                        to="/history"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-sm text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 font-medium"
                      >
                        {t('dashboardViewAll')} <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {recentVerifications.map((v, i) => (
                        <motion.div
                          key={v.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                        >
                          <GlowCard className={`border rounded-xl p-4 ${
                            isDarkMode
                              ? 'border-[#374151] bg-[#111827]'
                              : 'border-[#E2E8F0]'
                          }`}>
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <p className={`flex-1 font-medium ${
                              isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'
                            }`}>{v.claim}</p>
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                              style={{
                                backgroundColor: `${getScoreColor(v.score)}20`,
                                color: getScoreColor(v.score)
                              }}
                            >
                              {v.score}%
                            </div>
                          </div>
                          <div className={`flex items-center gap-3 text-sm flex-wrap ${
                            isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'
                          }`}>
                            <span>{formatDemoDate(v.date)}</span>
                            <span>•</span>
                            <span>{t('commonSourcesCount', { count: v.sources })}</span>
                            <span>•</span>
                            <span className="font-medium" style={{ color: getScoreColor(v.score) }}>
                              {v.status}
                            </span>
                          </div>
                          </GlowCard>
                        </motion.div>
                      ))}
                    </div>
                  </GlowCard>
                </div>

                {/* Trending Topics */}
                <div>
                  <GlowCard className={`rounded-2xl border p-6 ${
                    isDarkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E2E8F0] shadow-sm'
                  }`}>
                    <h2 className={`text-xl font-bold mb-6 ${
                      isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'
                    }`}>{t('dashboardTrendingTopics')}</h2>
                    <div className="space-y-4">
                      {trendingTopics.map((t, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                        >
                          <GlowCard className="flex items-center justify-between rounded-lg px-3 py-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              t.trend === 'up' ? 'bg-[#22C55E]/10' : 'bg-[#EF4444]/10'
                            }`}>
                              {t.trend === 'up'
                                ? <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                                : <TrendingDown className="w-4 h-4 text-[#EF4444]" />}
                            </div>
                            <span className={isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}>
                              {t.topic}
                            </span>
                          </div>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'
                          }`}>{t.count}</span>
                          </GlowCard>
                        </motion.div>
                      ))}
                    </div>
                  </GlowCard>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}