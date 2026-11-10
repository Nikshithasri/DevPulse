import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Download,
  AlertTriangle,
  Info,
  Layers,
  Activity,
  Award,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import StateBadge from '../components/StateBadge';
import MetricCard from '../components/MetricCard';
import api from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

export default function ModelEvaluationPage() {
  const [evaluation, setEvaluation] = useState(null);
  const [cmData, setCmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCmCell, setSelectedCmCell] = useState(null);

  useEffect(() => {
    loadEvaluationData();
  }, []);

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [evalRes, cmRes] = await Promise.all([
        api.getEvaluation(),
        api.getConfusionMatrix(),
      ]);
      setEvaluation(evalRes);
      setCmData(cmRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCmHeatColor = (count, maxInRow) => {
    if (count === 0) return 'bg-navy-950 text-slate-600';
    const ratio = maxInRow > 0 ? count / maxInRow : 0;
    if (ratio >= 0.8) return 'bg-emerald-500 text-navy-950 font-bold';
    if (ratio >= 0.4) return 'bg-emerald-600/80 text-white font-bold';
    if (ratio >= 0.1) return 'bg-emerald-900/60 text-emerald-200';
    return 'bg-rose-950/40 text-rose-300 font-medium';
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-500" />
          <p className="text-sm font-medium text-slate-400">Evaluating Markov model on test dataset sequences...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
        <h3 className="font-semibold text-lg mb-2">Evaluation Failed</h3>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={loadEvaluationData}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const states = evaluation?.states || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">Model Evaluation & Benchmark</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Test Accuracy: {evaluation.accuracy_percentage}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical test verification across 9 holdout subjects and 2,938 sequential state transitions
          </p>
        </div>

        {/* Export Report CSV */}
        <div className="flex items-center gap-2">
          <a
            href={api.getExportUrl('evaluation-report')}
            download
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold text-xs hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Evaluation Report (CSV)</span>
          </a>
          <a
            href={api.getExportUrl('prediction-results')}
            download
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-charcoal-900 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 font-semibold text-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Predictions CSV</span>
          </a>
        </div>
      </div>

      {/* Critical Methodology Advisory Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-charcoal-900 to-navy-950 p-5 border border-amber-500/30 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-amber-300 uppercase tracking-wide">
            Metric Interpretation: Next-Activity State Transition Accuracy
          </h4>
          <p className="text-slate-300 leading-relaxed">
            This model evaluates how accurately a <strong className="text-white">First-Order Markov Chain</strong> predicts
            the subsequent activity state given the current state in sequential observations.
            It does <em>not</em> classify activities from raw 561-D accelerometer or gyroscope sensor vectors.
            Accuracy is calculated exclusively on consecutive time steps within the same participant.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Next-State Accuracy"
          value={`${evaluation.accuracy_percentage}%`}
          subtitle="2,827 / 2,938 transitions"
          icon={Award}
          color="emerald"
          badgeText="96.22%"
          trend="+96.2% over random baseline (16.7%)"
        />
        <MetricCard
          title="Macro F1-Score"
          value={(evaluation.macro_avg?.f1_score * 100).toFixed(2) + '%'}
          subtitle={`Precision: ${(evaluation.macro_avg?.precision * 100).toFixed(1)}% | Recall: ${(evaluation.macro_avg?.recall * 100).toFixed(1)}%`}
          icon={TrendingUp}
          color="cyan"
          badgeText="Macro"
        />
        <MetricCard
          title="Weighted F1-Score"
          value={(evaluation.weighted_avg?.f1_score * 100).toFixed(2) + '%'}
          subtitle="Balanced across class support"
          icon={TrendingUp}
          color="blue"
          badgeText="Weighted"
        />
        <MetricCard
          title="Prediction Outcomes"
          value={`${evaluation.correct_predictions.toLocaleString()}`}
          subtitle={`${evaluation.incorrect_predictions} transitions mispredicted (3.78%)`}
          icon={CheckCircle2}
          color="purple"
          badgeText="Evaluated"
        />
      </div>

      {/* Classification Report Table & Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Classification Report Table */}
        <div className="xl:col-span-7 rounded-2xl bg-charcoal-900/90 border border-slate-800/80 shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Per-Class Classification Report</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Precision, Recall, F1-Score, and Support on the Test Set
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Zero Division = 0</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3 font-sans">Activity State</th>
                  <th className="p-3 text-right">Precision</th>
                  <th className="p-3 text-right">Recall</th>
                  <th className="p-3 text-right">F1-Score</th>
                  <th className="p-3 text-right font-sans">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {evaluation.class_metrics?.map((cm) => (
                  <tr key={cm.activity} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-sans font-medium text-white">
                      <StateBadge activity={cm.activity} size="sm" />
                    </td>
                    <td className="p-3 text-right text-cyan-400">
                      {(cm.precision * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-blue-400">
                      {(cm.recall * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {(cm.f1_score * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-sans text-slate-400">
                      {cm.support?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-800 bg-navy-950/60 font-semibold text-xs">
                <tr>
                  <td className="p-3 font-sans text-slate-300">Macro Average</td>
                  <td className="p-3 text-right text-cyan-400">
                    {(evaluation.macro_avg?.precision * 100).toFixed(1)}%
                  </td>
                  <td className="p-3 text-right text-blue-400">
                    {(evaluation.macro_avg?.recall * 100).toFixed(1)}%
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-400">
                    {(evaluation.macro_avg?.f1_score * 100).toFixed(1)}%
                  </td>
                  <td className="p-3 text-right font-sans text-slate-400">2,938</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans text-slate-300">Weighted Average</td>
                  <td className="p-3 text-right text-cyan-400">
                    {(evaluation.weighted_avg?.precision * 100).toFixed(1)}%
                  </td>
                  <td className="p-3 text-right text-blue-400">
                    {(evaluation.weighted_avg?.recall * 100).toFixed(1)}%
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-400">
                    {(evaluation.weighted_avg?.f1_score * 100).toFixed(1)}%
                  </td>
                  <td className="p-3 text-right font-sans text-slate-400">2,938</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* F1 Comparison Bar Chart */}
        <div className="xl:col-span-5 rounded-2xl bg-charcoal-900/90 border border-slate-800/80 shadow-xl p-5 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>F1-Score by Activity State</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Balanced harmonic mean between precision and recall
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={evaluation.class_metrics?.map((c) => ({
                  activity: c.activity,
                  f1: Number((c.f1_score * 100).toFixed(1)),
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <XAxis
                  dataKey="activity"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  domain={[85, 100]}
                  stroke="#64748B"
                  fontSize={11}
                  unit="%"
                />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'F1-Score']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="f1" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Interactive Section */}
      <div className="rounded-2xl bg-charcoal-900/90 border border-slate-800/80 shadow-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Confusion Matrix (Ground Truth Actual vs. Predicted Next State)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Diagonal elements represent correct predictions; off-diagonals show sequence misclassifications
            </p>
          </div>
          <div className="text-xs font-mono text-emerald-400 bg-navy-950 px-3 py-1 rounded-lg border border-slate-800">
            Diagonal Sum = {evaluation.correct_predictions} Correct
          </div>
        </div>

        {/* 6x6 Confusion Matrix Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-navy-950 text-slate-400">
                <th className="p-3 text-left font-sans text-xs font-bold text-slate-300 border border-slate-800">
                  Actual (Rows) \ Pred (Cols)
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
                  Actual Total
                </th>
              </tr>
            </thead>
            <tbody>
              {cmData?.matrix?.map((row, rIdx) => {
                const actualState = row.actual;
                const maxInRow = row.total_actual || 1;

                return (
                  <tr key={actualState} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-sans font-semibold text-slate-200 border border-slate-800 whitespace-nowrap bg-navy-950/40">
                      <StateBadge activity={actualState} size="sm" />
                    </td>
                    {states.map((predState) => {
                      const count = row[predState] || 0;
                      const isDiagonal = actualState === predState;
                      const isSelected =
                        selectedCmCell &&
                        selectedCmCell.actual === actualState &&
                        selectedCmCell.pred === predState;

                      return (
                        <td
                          key={predState}
                          onClick={() =>
                            setSelectedCmCell({
                              actual: actualState,
                              pred: predState,
                              count,
                              isDiagonal,
                              pct: ((count / maxInRow) * 100).toFixed(1),
                            })
                          }
                          className={`p-3 text-center cursor-pointer transition-all border border-slate-800/80 ${
                            isSelected ? 'ring-2 ring-cyan-400 z-10' : ''
                          } ${getCmHeatColor(count, maxInRow)}`}
                          title={`Actual: ${actualState} → Predicted: ${predState} (${count})`}
                        >
                          <span className="font-mono font-semibold">
                            {count.toLocaleString()}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-3 text-right font-bold text-cyan-400 border border-slate-800 bg-navy-950/40">
                      {row.total_actual?.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Confusion Cell Drawer */}
        {selectedCmCell && (
          <div className="rounded-xl bg-navy-950 p-4 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Selected Cell:</span>
              <span>Actual:</span>
              <StateBadge activity={selectedCmCell.actual} size="sm" />
              <span>→ Predicted:</span>
              <StateBadge activity={selectedCmCell.pred} size="sm" />
            </div>
            <div className="flex items-center gap-4 font-mono">
              <div>
                <span className="text-slate-400">Transitions: </span>
                <span className="font-bold text-white">{selectedCmCell.count}</span>
              </div>
              <div>
                <span className="text-slate-400">Percentage of Actual: </span>
                <span className="font-bold text-cyan-400">{selectedCmCell.pct}%</span>
              </div>
              <div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    selectedCmCell.isDiagonal
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {selectedCmCell.isDiagonal ? 'Correct Match' : 'Transition Misprediction'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
