import { useId, type CSSProperties } from 'react';
import { motion } from 'motion/react';

interface CredibilityGaugeProps {
  score: number; // 0-100
  isDarkMode?: boolean;
}

export function CredibilityGauge({ score, isDarkMode = true }: CredibilityGaugeProps) {
  const gradientId = useId();
  const glowId = useId();
  const shellId = useId();
  const stageId = useId();
  const clipId = useId();
  const shimmerId = useId();
  const safeScore = Math.max(0, Math.min(100, score));

  const getPalette = () => {
    if (safeScore >= 75) {
      return {
        glow: 'rgba(34,197,94,0.34)',
        accent: '#22C55E',
      };
    }

    if (safeScore >= 50) {
      return {
        glow: 'rgba(59,130,246,0.34)',
        accent: '#38BDF8',
      };
    }

    if (safeScore >= 25) {
      return {
        glow: 'rgba(249,115,22,0.34)',
        accent: '#F97316',
      };
    }

    return {
      glow: 'rgba(239,68,68,0.34)',
      accent: '#EF4444',
    };
  };

  const palette = getPalette();
  const labelTextColor = isDarkMode ? 'text-[#94A3B8]' : 'text-[#475569]';
  const scoreTextColor = isDarkMode ? 'text-white' : 'text-[#1E293B]';

  const themeVars = {
    '--shield-bg-top': isDarkMode ? 'rgba(255,255,255,0.58)' : '#F8FAFC',
    '--shield-bg-mid': isDarkMode ? 'rgba(148,163,184,0.28)' : '#EEF2F7',
    '--shield-bg-bottom': isDarkMode ? 'rgba(15,23,42,0.18)' : '#E2E8F0',
    '--shield-stage-top': isDarkMode ? 'rgba(30,41,59,0.42)' : '#FFFFFF',
    '--shield-stage-bottom': isDarkMode ? 'rgba(15,23,42,0.08)' : '#F1F5F9',
    '--shield-border-a': '#3B82F6',
    '--shield-border-b': '#06B6D4',
    '--shield-inner-fill': isDarkMode ? 'rgba(9,20,42,0.68)' : 'rgba(107,114,128,0.52)',
    '--shield-inner-stroke': isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.52)',
    '--shield-highlight': isDarkMode ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.8)',
    '--shield-divider': isDarkMode ? 'rgba(255,255,255,0.16)' : 'rgba(203,213,225,0.8)',
    '--shield-sheen': isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.16)',
    '--liquid-top': '#38BDF8',
    '--liquid-bottom': '#2563EB',
    '--shimmer-mid': isDarkMode ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.18)',
    '--ambient-core': isDarkMode ? palette.glow : 'rgba(148,163,184,0.18)',
    '--ambient-edge': 'rgba(15,23,42,0)'
  } as CSSProperties;

  const getLabel = () => {
    if (safeScore >= 75) return 'Likely True';
    if (safeScore >= 50) return 'Promising';
    if (safeScore >= 25) return 'Uncertain';
    return 'Likely False';
  };

  const shieldPath = 'M110 20C146 20 179 29 179 29V101C179 154 145 190 110 212C75 190 41 154 41 101V29C41 29 74 20 110 20Z';
  const innerShieldPath = 'M110 36C140 36 166 43 166 43V101C166 145 138 175 110 194C82 175 54 145 54 101V43C54 43 80 36 110 36Z';
  const liquidMinY = 52;
  const liquidMaxY = 184;
  const liquidY = liquidMaxY - ((liquidMaxY - liquidMinY) * safeScore) / 100;
  const liquidHeight = 200 - liquidY;
  const wavePath = `M44 ${liquidY} C64 ${liquidY - 6}, 88 ${liquidY + 6}, 110 ${liquidY} C132 ${liquidY - 6}, 156 ${liquidY + 6}, 176 ${liquidY} L176 220 L44 220 Z`;
  const wavePathAlt = `M44 ${liquidY} C64 ${liquidY + 5}, 88 ${liquidY - 5}, 110 ${liquidY + 1} C132 ${liquidY + 7}, 156 ${liquidY - 7}, 176 ${liquidY} L176 220 L44 220 Z`;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-[min(19rem,78vw)] aspect-[11/12] max-w-[19rem]"
        style={{
          ...themeVars,
          boxShadow: isDarkMode ? 'none' : '0 10px 25px rgba(0,0,0,0.15)'
        }}
      >
        <svg viewBox="0 0 220 240" className="h-full w-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--liquid-top)" />
              <stop offset="100%" stopColor="var(--liquid-bottom)" />
            </linearGradient>
            <linearGradient id={stageId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--shield-stage-top)" />
              <stop offset="100%" stopColor="var(--shield-stage-bottom)" />
            </linearGradient>
            <linearGradient id={shellId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--shield-bg-top)" />
              <stop offset="35%" stopColor="var(--shield-bg-mid)" />
              <stop offset="100%" stopColor="var(--shield-bg-bottom)" />
            </linearGradient>
            <linearGradient id={shimmerId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="var(--shimmer-mid)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <radialGradient id={glowId} cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="var(--ambient-core)" />
              <stop offset="100%" stopColor="var(--ambient-edge)" />
            </radialGradient>
            <clipPath id={clipId}>
              <path d={innerShieldPath} />
            </clipPath>
          </defs>

          <ellipse cx="110" cy="118" rx="96" ry="102" fill={`url(#${stageId})`} />
          <ellipse cx="110" cy="118" rx="92" ry="98" fill={`url(#${glowId})`} />

          <path
            d={shieldPath}
            fill="url(#${shellId})"
            fillOpacity={isDarkMode ? 0.34 : 0.24}
            stroke="url(#gradientId)"
            strokeWidth="5"
            style={{ filter: isDarkMode ? `drop-shadow(0 0 16px ${palette.glow})` : 'drop-shadow(0 6px 12px rgba(30,41,59,0.2))' }}
          />

          <path
            d={innerShieldPath}
            fill="var(--shield-inner-fill)"
            stroke="var(--shield-inner-stroke)"
            strokeWidth="2.5"
          />

          <g clipPath={`url(#${clipId})`}>
            <motion.rect
              x="44"
              y="220"
              width="132"
              height={liquidHeight}
              fill={`url(#${gradientId})`}
              initial={{ y: 220, height: 0 }}
              animate={{ y: liquidY, height: liquidHeight }}
              transition={{ duration: 1.35, ease: 'easeOut' }}
            />
            <motion.path
              d={wavePath}
              fill={`url(#${gradientId})`}
              initial={{ d: wavePath, y: 220 }}
              animate={{ d: [wavePath, wavePathAlt, wavePath], y: 0 }}
              transition={{
                y: { duration: 1.35, ease: 'easeOut' },
                d: { duration: 2.8, ease: 'easeInOut', repeat: Infinity }
              }}
              style={{ filter: isDarkMode ? `drop-shadow(0 0 8px ${palette.glow})` : 'drop-shadow(0 3px 8px rgba(37,99,235,0.28))' }}
            />
            <motion.rect
              x="18"
              y="34"
              width="42"
              height="184"
              fill={`url(#${shimmerId})`}
              initial={{ x: 18, opacity: 0 }}
              animate={{ x: [18, 170], opacity: [0, 0.55, 0] }}
              transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
              transform="rotate(12 110 120)"
            />
            <path
              d={innerShieldPath}
              fill="url(#shellId)"
              fillOpacity={isDarkMode ? 0.14 : 0.08}
            />
            <path
              d="M68 56C84 48 97 46 110 46V194C89 179 68 151 68 107V56Z"
              fill="var(--shield-sheen)"
            />
          </g>

          <path
            d="M66 56C88 44 102 42 122 42"
            stroke="var(--shield-highlight)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M111 43V194"
            stroke="var(--shield-divider)"
            strokeWidth="2.4"
          />
          <path
            d={innerShieldPath}
            fill="none"
            stroke="var(--shield-divider)"
            strokeWidth="2.5"
          />
          <path
            d={shieldPath}
            fill="none"
            stroke="url(#gradientId)"
            strokeWidth="3.5"
            style={{ filter: isDarkMode ? `drop-shadow(0 0 10px ${palette.glow})` : 'drop-shadow(0 4px 8px rgba(37,99,235,0.22))' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`text-4xl sm:text-5xl ${scoreTextColor}`}
            style={{ textShadow: isDarkMode ? `0 0 18px ${palette.glow}` : '0 1px 1px rgba(255,255,255,0.55)' }}
          >
            {safeScore}%
          </motion.div>
          <p className={`text-sm mt-1 ${labelTextColor}`}>Credibility</p>
        </div>
      </div>

      <div className="mt-4">
        <div 
          className="px-6 py-2 rounded-full text-sm"
          style={{ 
            backgroundColor: `${palette.accent}20`,
            color: palette.accent,
            border: `1px solid ${palette.accent}40`
          }}
        >
          {getLabel()}
        </div>
      </div>
    </div>
  );
}
