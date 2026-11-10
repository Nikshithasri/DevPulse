import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Play,
  Download,
  AlertCircle,
  HelpCircle,
  Layers
} from 'lucide-react';
import StateBadge, { ACTIVITY_CONFIGS } from '../components/StateBadge';
import api from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

export default function ActivityPredictionPage() {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('WALKING');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Multi-step Trajectory Simulation
  const [simSteps, setSimSteps] = useState(10);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Prediction History
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const res = await api.getActivities();
      setActivities(res.activities || []);
      if (res.activities && res.activities.length > 0) {
        setSelectedActivity(res.activities[3] || res.activities[0]); // Default to WALKING
        // Automatically run initial prediction
        runPrediction(res.activities[3] || res.activities[0]);
      }
    } catch (err) {
      setError('Failed to fetch activity states from backend.');
    }
  };

  const runPrediction = async (activityToPredict = selectedActivity) => {
    if (!activityToPredict) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.predictNextActivity(activityToPredict);
      setPrediction(res);

      // Add to session history
      setHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          current: res.current_activity,
          predicted: res.predicted_next_activity,
          confidence: res.confidence_percentage,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    try {
      setSimLoading(true);
      const res = await api.simulateTrajectory(selectedActivity, simSteps);
      setSimResult(res);
    } catch (err) {
      setError(`Simulation failed: ${err.message}`);
    } finally {
      setSimLoading(false);
    }
  };

  // Prepare chart data from prediction
  const chartData = prediction?.ranked_predictions?.map((item) => ({
    activity: item.activity,
    probability: item.percentage,
    rawProb: item.probability,
    color: ACTIVITY_CONFIGS[item.activity]?.color || '#06B6D4',
  })) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-white">Activity Prediction & Inference</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            Real-time Markov Inference
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Input an ongoing physical activity state to compute the exact next-state probability distribution
          using the trained transition matrix.
        </p>
      </div>

      {/* Main Interactive Predictor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Selection Form */}
        <div className="lg:col-span-5 rounded-2xl bg-charcoal-900/90 border border-slate-800/80 shadow-xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Select Current Physical Activity</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Choose the observed activity at time step <code className="text-cyan-400 font-mono">t</code>
            </p>
          </div>

          {/* Quick Select State Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Quick Select State:</label>
            <div className="grid grid-cols-2 gap-2">
              {activities.map((act) => {
                const isSelected = selectedActivity === act;
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setSelectedActivity(act)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-navy-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <StateBadge activity={act} size="sm" />
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Or Dropdown Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Or Select from Dropdown:</label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-navy-950 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {activities.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Predict Action Button */}
          <button
            onClick={() => runPrediction(selectedActivity)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-extrabold text-sm hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-950 border-t-white" />
                <span>Computing Markov Probabilities...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                <span>Predict Next Activity P(X[t+1] | X[t])</span>
              </>
            )}
          </button>

          {/* Simulation Box */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulate Activity Sequence</span>
              </span>
              <span className="text-[11px] text-slate-400">Monte Carlo trajectory</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={simSteps}
                onChange={(e) => setSimSteps(Number(e.target.value))}
                className="py-1.5 px-2.5 rounded-lg bg-navy-950 border border-slate-700 text-xs text-white"
              >
                <option value={5}>5 Steps</option>
                <option value={10}>10 Steps</option>
                <option value={15}>15 Steps</option>
                <option value={20}>20 Steps</option>
              </select>

              <button
                onClick={handleSimulate}
                disabled={simLoading}
                className="flex-1 py-1.5 px-3 rounded-lg bg-charcoal-800 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {simLoading ? 'Simulating...' : 'Run Simulation'}
              </button>
            </div>

            {simResult && (
              <div className="rounded-xl bg-navy-950 p-3 border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-cyan-400">
                  Simulated {simResult.steps_count}-Step Trajectory:
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {simResult.sequence.map((stepAct, idx) => (
                    <React.Fragment key={idx}>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                        {stepAct}
                      </span>
                      {idx < simResult.sequence.length - 1 && (
                        <span className="text-slate-600 text-xs">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prediction Results Hero Card & Chart */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {prediction ? (
            <div className="space-y-6">
              {/* Hero Result Card */}
              <div className="rounded-2xl bg-gradient-to-br from-charcoal-900 via-navy-900 to-charcoal-900 p-6 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.12)] space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span>Current Input:</span>
                    <StateBadge activity={prediction.current_activity} size="sm" />
                  </div>
                  <span className="font-mono text-cyan-400">Confidence Metric</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                      Most Probable Next Activity (t + 1)
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <StateBadge activity={prediction.predicted_next_activity} size="xl" />
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                      {prediction.confidence_percentage}%
                    </div>
                    <p className="text-xs text-slate-400">
                      P = {prediction.confidence.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* Confidence Progress Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Transition Probability Confidence</span>
                    <span className="text-cyan-400 font-bold">{prediction.confidence_percentage}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-navy-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-700"
                      style={{ width: `${prediction.confidence_percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* All Next-State Probabilities Chart */}
              <div className="rounded-2xl bg-charcoal-900/90 border border-slate-800/80 shadow-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span>Next-State Probability Distribution (All 6 States)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      P(X[t+1] = j | X[t] = {prediction.current_activity})
                    </p>
                  </div>
                </div>

                {/* Horizontal Bar Chart */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        stroke="#64748B"
                        fontSize={11}
                        unit="%"
                      />
                      <YAxis
                        type="category"
                        dataKey="activity"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        width={130}
                      />
                      <Tooltip
                        formatter={(val) => [`${val}%`, 'Probability']}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Ranked Probabilities List */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {prediction.ranked_predictions.map((p, idx) => (
                    <div
                      key={p.activity}
                      className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <span className="truncate text-slate-300 font-medium">
                        {p.activity}
                      </span>
                      <span className="font-mono font-bold text-cyan-400 ml-2">
                        {p.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center rounded-2xl bg-charcoal-900 border border-slate-800 text-slate-400 text-xs">
              Select an activity and click "Predict Next Activity"
            </div>
          )}
        </div>
      </div>

      {/* Session Inference History */}
      {history.length > 0 && (
        <div className="rounded-2xl bg-charcoal-900/90 border border-slate-800/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>Inference History (Recent Queries)</span>
            </h3>
            <span className="text-xs text-slate-400">{history.length} predictions recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-navy-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Input State (t)</th>
                  <th className="p-2.5">Predicted Next State (t+1)</th>
                  <th className="p-2.5 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/30">
                    <td className="p-2.5 text-slate-500 font-sans">{h.timestamp}</td>
                    <td className="p-2.5 font-sans">
                      <StateBadge activity={h.current} size="sm" />
                    </td>
                    <td className="p-2.5 font-sans">
                      <StateBadge activity={h.predicted} size="sm" />
                    </td>
                    <td className="p-2.5 text-right font-bold text-cyan-400 font-mono">
                      {h.confidence}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
