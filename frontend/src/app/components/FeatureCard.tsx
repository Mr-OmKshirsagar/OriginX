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
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`border rounded-2xl p-6 hover:shadow-xl transition-all hover:border-[#3B82F6]/30 ${
        isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
      }`}
    >
      <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className={`text-xl mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{title}</h3>
      <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{description}</p>
    </motion.div>
  );
}
