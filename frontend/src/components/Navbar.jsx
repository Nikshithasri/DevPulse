import React, { useState } from 'react';
import { Activity, RefreshCw, CheckCircle2, AlertCircle, Menu, Layers, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function Navbar({
  backendOnline,
  activePage,
  onRefresh,
  toggleSidebar,
  sidebarCollapsed,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');

  const handleRefreshClick = async () => {
    try {
      setRefreshing(true);
      setRefreshMsg('Refitting Markov Chain...');
      await api.refreshModel();
      if (onRefresh) await onRefresh();
      setRefreshMsg('Refreshed successfully!');
      setTimeout(() => setRefreshMsg(''), 2500);
    } catch (err) {
      setRefreshMsg('Refresh failed');
      setTimeout(() => setRefreshMsg(''), 2500);
    } finally {
      setRefreshing(false);
    }
  };

  const pageTitles = {
    overview: 'Overview Dashboard',
    dataset: 'Dataset Explorer',
    markov: 'Markov Chain Analysis',
    predict: 'Activity Prediction',
    evaluation: 'Model Evaluation',
    about: 'About Markov Chain',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-navy-950/80 px-4 lg:px-8 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-charcoal-900 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors md:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
            <Activity className="h-5 w-5 text-navy-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-sm md:text-base">
                MARKOV<span className="text-cyan-400"> INTELLIGENCE</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                HAR 561-D
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Human Activity Recognition via 1st-Order Markov Chain
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Current Active Page Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium text-slate-200">{pageTitles[activePage] || 'Dashboard'}</span>
        </div>

        {/* Refresh Notification */}
        {refreshMsg && (
          <span className="text-xs text-cyan-400 font-medium animate-fade-in hidden lg:inline">
            {refreshMsg}
          </span>
        )}

        {/* Backend Status Indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
            backendOnline
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
          title={backendOnline ? 'Flask Backend connected on :5000' : 'Backend offline or unreachable'}
        >
          <span className="relative flex h-2 w-2">
            {backendOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                backendOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            ></span>
          </span>
          <span className="hidden sm:inline">
            {backendOnline ? 'Backend Online (Flask :5000)' : 'Backend Disconnected'}
          </span>
        </div>

        {/* Refresh Data Button */}
        <button
          onClick={handleRefreshClick}
          disabled={refreshing || !backendOnline}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-charcoal-900 text-xs font-semibold text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 transition-all disabled:opacity-50"
          title="Reload dataset and refit transition probabilities"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Refitting...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
