import React, { useState, useEffect } from 'react';
import {
  Network,
  Download,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Share2,
  RotateCw
} from 'lucide-react';
import StateBadge, { ACTIVITY_CONFIGS } from '../components/StateBadge';
import api from '../services/api';

export default function MarkovAnalysisPage() {
  const [activities, setActivities] = useState([]);
  const [countsData, setCountsData] = useState(null);
  const [probsData, setProbsData] = useState(null);
  const [activeView, setActiveView] = useState('probabilities'); // 'probabilities' | 'counts'
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMarkovData();
  }, []);

  const loadMarkovData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [actRes, countsRes, probsRes] = await Promise.all([
        api.getActivities(),
        api.getTransitionCounts(),
        api.getTransitionProbabilities(),
      ]);

      setActivities(actRes.details || []);
      setCountsData(countsRes);
      setProbsData(probsRes);

      // Default select the first state
      if (actRes.activities && actRes.activities.length > 0) {
        setSelectedState(actRes.activities[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getHeatColor = (prob) => {
    if (prob === undefined || prob === null) return 'bg-slate-900';
    // Heatmap gradient mapping from dark navy through teal to vibrant electric cyan/blue
    if (prob >= 0.9) return 'bg-cyan-500 text-navy-950 font-bold';
    if (prob >= 0.7) return 'bg-cyan-600/90 text-white font-bold';
    if (prob >= 0.4) return 'bg-cyan-700/80 text-white font-semibold';
    if (prob >= 0.1) return 'bg-cyan-900/60 text-cyan-200';
    if (prob >= 0.02) return 'bg-blue-950/60 text-blue-300';
    return 'bg-navy-950 text-slate-500';
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-500" />
          <p className="text-sm font-medium text-slate-400">Computing Markov transition matrices & smoothing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
        <h3 className="font-semibold text-lg mb-2">Error Loading Markov Chain</h3>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={loadMarkovData}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const states = probsData?.states || [];
  const currentMatrix = activeView === 'probabilities' ? probsData?.matrix : countsData?.matrix;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">Markov Chain Analysis</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Laplace α = 1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical state transitions and stochastic next-state transition probability matrices
          </p>
        </div>

        {/* Action Buttons: View Toggle & CSV Exports */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle between Counts and Probabilities */}
          <div className="flex items-center p-1 rounded-xl bg-charcoal-900 border border-slate-800">
            <button
              onClick={() => setActiveView('probabilities')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'probabilities'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Probabilities P(i → j)
            </button>
            <button
              onClick={() => setActiveView('counts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'counts'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Counts N(i → j)
            </button>
          </div>

          {/* Download CSV Buttons */}
          <a
            href={api.getExportUrl('transition-matrix')}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-charcoal-900 hover:border-cyan-500/50 hover:text-cyan-300 text-xs font-semibold text-slate-300 transition-all"
            title="Download Transition Probability Matrix CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Prob Matrix CSV</span>
          </a>

          <a
            href={api.getExportUrl('transition-counts')}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-charcoal-900 hover:border-cyan-500/50 hover:text-cyan-300 text-xs font-semibold text-slate-300 transition-all"
            title="Download Transition Counts CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Counts CSV</span>
          </a>
        </div>
      </div>

      {/* SECTION A: MARKOV STATES CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span>A. Markov States ({activities.length} Physical Activity States)</span>
          </h2>
          <span className="text-xs text-slate-500">Click a state to inspect transitions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {activities.map((act) => {
            const isSelected = selectedState === act.name;
            return (
              <div
                key={act.name}
                onClick={() => setSelectedState(act.name)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all duration-300 ${
                  isSelected
                    ? 'bg-charcoal-800 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-[1.02]'
                    : 'bg-charcoal-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <StateBadge activity={act.name} size="sm" />
                </div>
                <div className="space-y-1 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Self P(s→s):</span>
                    <span className="font-bold text-cyan-400 font-mono">
                      {act.self_transition_percentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Train Count:</span>
                    <span className="font-semibold text-slate-200 font-mono">
                      {act.train_occurrences?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-tight">
                  {act.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION B & C: MATRIX TABLE AND HEATMAP */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Transition Matrix Display */}
        <div className="xl:col-span-2 rounded-2xl bg-charcoal-900/90 border border-slate-800/80 shadow-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>
                  {activeView === 'probabilities'
                    ? 'B. Transition Probability Matrix P(X[t+1] = j | X[t] = i)'
                    : 'C. Transition Count Matrix N(i → j)'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeView === 'probabilities'
                  ? 'Smoothed probabilities with Laplace α = 1 (Rows sum to exactly 1.0000)'
                  : 'Total empirical transitions observed across participant sequences'}
              </p>
            </div>
            <div className="text-xs font-mono text-cyan-400 px-3 py-1 rounded-lg bg-navy-950 border border-slate-800">
              {activeView === 'probabilities' ? 'Formula: (N + 1) / (RowTotal + 6)' : 'Total: 7,331 transitions'}
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-navy-950 text-slate-400">
                  <th className="p-3 text-left font-sans text-xs font-bold text-slate-300 border border-slate-800">
                    Current \ Next
                  </th>
                  {states.map((st) => (
                    <th
                      key={st}
                      className="p-3 text-center text-[11px] font-sans font-semibold border border-slate-800 truncate max-w-[110px]"
                      title={st}
                    >
                      {st}
                    </th>
                  ))}
                  <th className="p-3 text-right font-sans text-[11px] font-bold text-cyan-400 border border-slate-800">
                    {activeView === 'probabilities' ? 'Row Sum' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentMatrix?.map((row, rIdx) => {
                  const fromState = row.state;
                  return (
                    <tr key={fromState} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-sans font-semibold text-slate-200 border border-slate-800 whitespace-nowrap bg-navy-950/40">
                        <StateBadge activity={fromState} size="sm" />
                      </td>
                      {states.map((toState) => {
                        const val = row[toState];
                        const probVal = probsData?.matrix?.[rIdx]?.[toState] || 0;
                        const isSelf = fromState === toState;
                        const isSelected =
                          selectedCell &&
                          selectedCell.from === fromState &&
                          selectedCell.to === toState;

                        return (
                          <td
                            key={toState}
                            onClick={() =>
                              setSelectedCell({
                                from: fromState,
                                to: toState,
                                value: val,
                                prob: probVal,
                                count: countsData?.matrix?.[rIdx]?.[toState],
                              })
                            }
                            className={`p-3 text-center cursor-pointer transition-all border border-slate-800/80 ${
                              isSelected
                                ? 'ring-2 ring-cyan-400 z-10'
                                : ''
                            } ${getHeatColor(probVal)}`}
                            title={`Transition: ${fromState} → ${toState}: ${
                              activeView === 'probabilities' ? (val * 100).toFixed(2) + '%' : val
                            }`}
                          >
                            <span className="font-mono">
                              {activeView === 'probabilities'
                                ? typeof val === 'number'
                                  ? val.toFixed(4)
                                  : val
                                : val?.toLocaleString()}
                            </span>
                          </td>
                        );
                      })}
                      <td className="p-3 text-right font-bold text-cyan-400 border border-slate-800 bg-navy-950/40">
                        {activeView === 'probabilities'
                          ? row.row_sum?.toFixed(4)
                          : row.total_transitions?.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Interactive Cell Inspector */}
          {selectedCell && (
            <div className="rounded-xl bg-navy-950 p-4 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Selected Transition:</span>
                <StateBadge activity={selectedCell.from} size="sm" />
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                <StateBadge activity={selectedCell.to} size="sm" />
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Probability: </span>
                  <span className="font-bold text-cyan-400">
                    {(selectedCell.prob * 100).toFixed(2)}% ({selectedCell.prob?.toFixed(4)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Count: </span>
                  <span className="font-bold text-emerald-400">
                    {selectedCell.count?.toLocaleString()} transitions
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION D & E: STATE TRANSITION VISUALIZER & EXPLANATION */}
        <div className="space-y-6">
          {/* Transition Visualizer for Selected State */}
          <div className="rounded-2xl bg-charcoal-900/90 border border-slate-800/80 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Transition Outflows</h3>
              </div>
              <span className="text-xs text-cyan-400 font-semibold font-mono">
                From: {selectedState}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              When the subject is currently in state <strong className="text-white">{selectedState}</strong>,
              here is the probability distribution for the subsequent activity:
            </p>

            <div className="space-y-3 pt-1">
              {states.map((target) => {
                const prob =
                  probsData?.matrix?.find((r) => r.state === selectedState)?.[target] || 0;
                const count =
                  countsData?.matrix?.find((r) => r.state === selectedState)?.[target] || 0;
                const pct = (prob * 100).toFixed(2);
                const isMax =
                  prob ===
                  Math.max(
                    ...states.map(
                      (s) =>
                        probsData?.matrix?.find((r) => r.state === selectedState)?.[s] || 0
                    )
                  );

                return (
                  <div key={target} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <StateBadge activity={target} size="sm" />
                        {isMax && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                            Most Probable
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-right">
                        <span className="font-bold text-white">{pct}%</span>
                        <span className="text-slate-400 text-[10px] ml-1">({count}x)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-navy-950 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMax ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-700'
                        }`}
                        style={{ width: `${Math.max(2, prob * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mathematical Explanation Box */}
          <div className="rounded-2xl bg-charcoal-900/90 border border-slate-800/80 shadow-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Info className="w-4 h-4" />
              <span>Markov Chain Mathematics</span>
            </div>

            <div className="p-3 rounded-xl bg-navy-950 border border-slate-800 font-mono text-xs text-cyan-300 text-center">
              P(X[t+1] = j | X[t] = i) = ( N(i → j) + α ) / Σ_k ( N(i → k) + α )
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">The Markov Property (Memorylessness):</strong> The probability
              of transitioning to state <code className="text-cyan-400">j</code> at step{' '}
              <code className="text-cyan-400">t+1</code> depends <em>only</em> on current state{' '}
              <code className="text-cyan-400">i</code> at step <code className="text-cyan-400">t</code>,
              independent of prior activity history.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Laplace Smoothing (α = 1):</strong> Adds 1 pseudo-count to all
              6 possible state pairs. For any state with total observed transitions{' '}
              <code className="text-slate-300">N_i</code>, the smoothed denominator is{' '}
              <code className="text-slate-300">N_i + 6</code>. This prevents zero-probability traps while
              retaining dominant natural transition tendencies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
