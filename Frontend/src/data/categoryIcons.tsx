import {
  Monitor,
  Calculator,
  Atom,
  FlaskConical,
  Cpu,
  Cog,
  Building2,
  Dna,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface CategoryIconConfig {
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

export const categoryIconMap: Record<string, CategoryIconConfig> = {
  'computer-science': {
    icon: Monitor,
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  'mathematics': {
    icon: Calculator,
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
  'physics': {
    icon: Atom,
    bgColor: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
  },
  'chemistry': {
    icon: FlaskConical,
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-500',
  },
  'electronics': {
    icon: Cpu,
    bgColor: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
  },
  'mechanical': {
    icon: Cog,
    bgColor: 'bg-slate-500/10',
    iconColor: 'text-slate-500',
  },
  'civil': {
    icon: Building2,
    bgColor: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  'biology': {
    icon: Dna,
    bgColor: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
  },
};

export const getDefaultCategoryIcon = (): CategoryIconConfig => ({
  icon: Monitor,
  bgColor: 'bg-primary/10',
  iconColor: 'text-primary',
});
