import { useId } from 'react';
import { motion } from 'motion/react';

interface CredibilityGaugeProps {
  score: number; // 0-100
}

export function CredibilityGauge({ score }: CredibilityGaugeProps) {
  const gradientId = useId();
  const glowId = useId();
  const shellId = useId();
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
      <div className="relative w-[min(19rem,78vw)] aspect-[11/12] max-w-[19rem]">
        <svg viewBox="0 0 220 240" className="h-full w-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
            <linearGradient id={shellId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.58)" />
              <stop offset="35%" stopColor="rgba(148,163,184,0.28)" />
              <stop offset="100%" stopColor="rgba(15,23,42,0.18)" />
            </linearGradient>
            <linearGradient id={shimmerId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.26)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <radialGradient id={glowId} cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor={palette.glow} />
              <stop offset="100%" stopColor="rgba(15,23,42,0)" />
            </radialGradient>
            <clipPath id={clipId}>
              <path d={innerShieldPath} />
            </clipPath>
          </defs>

          <ellipse cx="110" cy="118" rx="92" ry="98" fill={`url(#${glowId})`} />

          <path
            d={shieldPath}
            fill="url(#${shellId})"
            fillOpacity="0.34"
            stroke="rgba(191,219,254,0.9)"
            strokeWidth="5"
            style={{ filter: `drop-shadow(0 0 22px ${palette.glow})` }}
          />

          <path
            d={innerShieldPath}
            fill="rgba(9,20,42,0.68)"
            stroke="rgba(255,255,255,0.12)"
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
              style={{ filter: `drop-shadow(0 0 10px ${palette.glow})` }}
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
              fillOpacity="0.14"
            />
            <path
              d="M68 56C84 48 97 46 110 46V194C89 179 68 151 68 107V56Z"
              fill="rgba(255,255,255,0.22)"
            />
          </g>

          <path
            d="M66 56C88 44 102 42 122 42"
            stroke="rgba(255,255,255,0.48)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M111 43V194"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="2.4"
          />
          <path
            d={innerShieldPath}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="2.5"
          />
          <path
            d={shieldPath}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="3.5"
            style={{ filter: `drop-shadow(0 0 14px ${palette.glow})` }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-4xl sm:text-5xl text-white"
            style={{ textShadow: `0 0 18px ${palette.glow}` }}
          >
            {safeScore}%
          </motion.div>
          <p className="text-sm text-[#94A3B8] mt-1">Credibility</p>
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
