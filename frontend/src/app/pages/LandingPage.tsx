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
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Tag,
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

  const fakeNewsOrigins = [
    {
      nameKey: 'landingOrigin1Name',
      domain: 'infowars.com',
      categoryKey: 'landingOrigin1Category',
      originKey: 'landingOriginCountryUs',
      threatLevel: 'Critical',
      monthlyReach: '22M+',
      descriptionKey: 'landingOrigin1Description',
      topicKeys: ['landingOrigin1Topic1', 'landingOrigin1Topic2', 'landingOrigin1Topic3']
    },
    {
      nameKey: 'landingOrigin2Name',
      domain: 'naturalnews.com',
      categoryKey: 'landingOrigin2Category',
      originKey: 'landingOriginCountryUs',
      threatLevel: 'Critical',
      monthlyReach: '14M+',
      descriptionKey: 'landingOrigin2Description',
      topicKeys: ['landingOrigin2Topic1', 'landingOrigin2Topic2', 'landingOrigin2Topic3']
    },
    {
      nameKey: 'landingOrigin3Name',
      domain: 'rt.com',
      categoryKey: 'landingOrigin3Category',
      originKey: 'landingOriginCountryRu',
      threatLevel: 'High',
      monthlyReach: '100M+',
      descriptionKey: 'landingOrigin3Description',
      topicKeys: ['landingOrigin3Topic1', 'landingOrigin3Topic2', 'landingOrigin3Topic3']
    },
    {
      nameKey: 'landingOrigin4Name',
      domain: 'thegatewaypundit.com',
      categoryKey: 'landingOrigin4Category',
      originKey: 'landingOriginCountryUs',
      threatLevel: 'High',
      monthlyReach: '18M+',
      descriptionKey: 'landingOrigin4Description',
      topicKeys: ['landingOrigin4Topic1', 'landingOrigin4Topic2', 'landingOrigin4Topic3']
    },
    {
      nameKey: 'landingOrigin5Name',
      domain: 'newspunch.com',
      categoryKey: 'landingOrigin5Category',
      originKey: 'landingOriginCountryUk',
      threatLevel: 'High',
      monthlyReach: '9M+',
      descriptionKey: 'landingOrigin5Description',
      topicKeys: ['landingOrigin5Topic1', 'landingOrigin5Topic2', 'landingOrigin5Topic3']
    },
    {
      nameKey: 'landingOrigin6Name',
      domain: 'zerohedge.com',
      categoryKey: 'landingOrigin6Category',
      originKey: 'landingOriginCountryUs',
      threatLevel: 'Medium',
      monthlyReach: '35M+',
      descriptionKey: 'landingOrigin6Description',
      topicKeys: ['landingOrigin6Topic1', 'landingOrigin6Topic2', 'landingOrigin6Topic3']
    }
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

  const threatColors: Record<string, { bg: string; text: string; border: string }> = {
    Critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    High:     { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    Medium:   { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' }
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

      {/* Top Fake News Origins Section */}
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 font-medium">{t('landingThreatIntelligence')}</span>
            </div>
            <h2 className={`text-4xl mb-4 ${
              isDarkMode ? 'text-white' : 'text-[#0F172A]'
            }`}>{t('landingFakeNewsOriginsTitle')}</h2>
            <p className={`text-xl max-w-2xl mx-auto ${
              isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'
            }`}>
              {t('landingFakeNewsOriginsDesc')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fakeNewsOrigins.map((origin, index) => {
              const threat = threatColors[origin.threatLevel];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className={`rounded-2xl border p-6 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                    isDarkMode
                      ? 'bg-[#0F172A] border-[#1E293B] hover:border-[#334155]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        isDarkMode ? 'text-white' : 'text-[#0F172A]'
                      }`}>{t(origin.nameKey)}</h3>
                      <span className={`text-xs font-mono ${
                        isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'
                      }`}>{origin.domain}</span>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${
                      threat.bg
                    } ${threat.text} ${threat.border}`}>
                      {origin.threatLevel === 'Critical' ? t('landingThreatLevelCritical') : origin.threatLevel === 'High' ? t('landingThreatLevelHigh') : t('landingThreatLevelMedium')}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3">
                    <div className={`flex items-center gap-1.5 text-xs ${
                      isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'
                    }`}>
                      <Tag className="w-3.5 h-3.5 text-[#3B82F6]" />
                      {t(origin.categoryKey)}
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${
                      isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'
                    }`}>
                      <MapPin className="w-3.5 h-3.5 text-[#22D3EE]" />
                      {t(origin.originKey)}
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${
                      isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'
                    }`}>
                      <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                      {t('landingMonthlyReach', { reach: origin.monthlyReach })}
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-sm leading-relaxed ${
                    isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'
                  }`}>
                    {t(origin.descriptionKey)}
                  </p>

                  {/* Topic Tags */}
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {origin.topicKeys.map((topicKey, ti) => (
                      <span
                        key={ti}
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          isDarkMode
                            ? 'bg-[#1E293B] border-[#334155] text-[#94A3B8]'
                            : 'bg-white border-[#E2E8F0] text-[#64748B]'
                        }`}
                      >
                        {t(topicKey)}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
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