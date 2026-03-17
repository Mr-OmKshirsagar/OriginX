import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { useDarkMode } from './DarkModeContext';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export function FeatureCard({ icon: Icon, title, description, index }: FeatureCardProps) {
  const { isDarkMode } = useDarkMode();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -2 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`group relative overflow-hidden border rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all duration-300 ${
        isDarkMode ? 'bg-[#1E293B] border-[#334155] hover:border-white/80' : 'bg-white border-[#E2E8F0] hover:border-white'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/0 bg-white/0 transition-all duration-300 group-hover:border-white/70 group-hover:bg-white/[0.03]" />
      <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className={`relative z-10 text-xl mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white group-hover:text-[#60A5FA]' : 'text-[#0F172A] group-hover:text-[#2563EB]'}`}>{title}</h3>
      <p className={`relative z-10 transition-colors duration-300 ${isDarkMode ? 'text-[#94A3B8] group-hover:text-[#93C5FD]' : 'text-[#64748B] group-hover:text-[#3B82F6]'}`}>{description}</p>
    </motion.div>
  );
}
