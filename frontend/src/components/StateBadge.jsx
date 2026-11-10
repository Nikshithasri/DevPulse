import React from 'react';
import { Footprints, ArrowUpRight, ArrowDownRight, Armchair, PersonStanding, Bed } from 'lucide-react';

export const ACTIVITY_CONFIGS = {
  WALKING: {
    label: 'Walking',
    icon: Footprints,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    color: '#10B981',
  },
  WALKING_UPSTAIRS: {
    label: 'Walking Upstairs',
    icon: ArrowUpRight,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    color: '#F59E0B',
  },
  WALKING_DOWNSTAIRS: {
    label: 'Walking Downstairs',
    icon: ArrowDownRight,
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20',
    color: '#F97316',
  },
  SITTING: {
    label: 'Sitting',
    icon: Armchair,
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
    color: '#06B6D4',
  },
  STANDING: {
    label: 'Standing',
    icon: PersonStanding,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    color: '#3B82F6',
  },
  LAYING: {
    label: 'Laying',
    icon: Bed,
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
    color: '#A855F7',
  },
};

export default function StateBadge({ activity, size = 'md', showIcon = true, className = '' }) {
  const config = ACTIVITY_CONFIGS[activity] || {
    label: activity || 'Unknown',
    icon: Footprints,
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    glow: '',
    color: '#94A3B8',
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
    xl: 'text-base font-bold px-4 py-2 gap-2.5',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-lg border ${config.bg} ${config.border} ${config.text} transition-all duration-200 hover:scale-[1.02] ${sizeClasses} ${className}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{activity}</span>
    </span>
  );
}
