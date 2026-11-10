import React from 'react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'cyan',
  badgeText,
}) {
  const colorSchemes = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      valueColor: 'text-cyan-400',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400',
      glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      valueColor: 'text-blue-400',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      valueColor: 'text-emerald-400',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400',
      glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      valueColor: 'text-purple-400',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      valueColor: 'text-amber-400',
    },
  }[color] || {
    border: 'border-slate-800 hover:border-slate-700',
    iconBg: 'bg-slate-800 text-slate-300',
    glow: '',
    valueColor: 'text-white',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-charcoal-900/90 p-5 border ${colorSchemes.border} ${colorSchemes.glow} transition-all duration-300 group`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {value}
            </h3>
            {badgeText && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 font-normal leading-relaxed pt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="pt-2 flex items-center text-xs font-medium text-emerald-400">
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorSchemes.iconBg} transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Subtle bottom gradient line */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
