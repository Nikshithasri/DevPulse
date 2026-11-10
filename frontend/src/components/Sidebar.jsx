import React from 'react';
import {
  LayoutDashboard,
  Database,
  Network,
  Sparkles,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Cpu,
  GraduationCap
} from 'lucide-react';

export default function Sidebar({
  activePage,
  setActivePage,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const menuItems = [
    {
      id: 'overview',
      label: 'Overview Dashboard',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      id: 'dataset',
      label: 'Dataset Explorer',
      shortLabel: 'Dataset',
      icon: Database,
      badge: '10,299',
    },
    {
      id: 'markov',
      label: 'Markov Chain Analysis',
      shortLabel: 'Markov',
      icon: Network,
      badge: 'Core',
    },
    {
      id: 'predict',
      label: 'Activity Prediction',
      shortLabel: 'Predict',
      icon: Sparkles,
      badge: 'Infer',
    },
    {
      id: 'evaluation',
      label: 'Model Evaluation',
      shortLabel: 'Evaluation',
      icon: BarChart3,
      badge: '96.2%',
    },
    {
      id: 'about',
      label: 'About Markov Chain',
      shortLabel: 'About',
      icon: BookOpen,
      badge: 'Math',
    },
  ];

  const handleSelect = (id) => {
    setActivePage(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 flex flex-col justify-between border-r border-slate-800/80 bg-navy-900/95 backdrop-blur-xl transition-all duration-300 md:static ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex flex-col gap-1 p-3">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {!collapsed ? 'Navigation' : '•••'}
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  title={item.label}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between overflow-hidden">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                            isActive
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active Indicator Line */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-800/80 space-y-3">
          {!collapsed ? (
            <div className="rounded-xl bg-charcoal-900/80 p-3 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
                <GraduationCap className="w-4 h-4" />
                <span>Academic Model</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                UCI HAR Dataset • 6 States • 30 Subjects • Laplace α=1
              </p>
            </div>
          ) : (
            <div className="flex justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
