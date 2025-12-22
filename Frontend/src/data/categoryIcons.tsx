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
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  'mathematics': {
    icon: Calculator,
    bgColor: 'bg-secondary/10',
    iconColor: 'text-secondary',
  },
  'physics': {
    icon: Atom,
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  'chemistry': {
    icon: FlaskConical,
    bgColor: 'bg-accent/10',
    iconColor: 'text-accent',
  },
  'electronics': {
    icon: Cpu,
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  'mechanical': {
    icon: Cog,
    bgColor: 'bg-secondary/10',
    iconColor: 'text-secondary',
  },
  'civil': {
    icon: Building2,
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  'biology': {
    icon: Dna,
    bgColor: 'bg-accent/10',
    iconColor: 'text-accent',
  },
};

export const getDefaultCategoryIcon = (): CategoryIconConfig => ({
  icon: Monitor,
  bgColor: 'bg-primary/10',
  iconColor: 'text-primary',
});
