import React, { useEffect, useState } from 'react';
import {
  Database,
  Users,
  Layers,
  BrainCircuit,
  Activity,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import StateBadge from '../components/StateBadge';
import api from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function OverviewPage({ onNavigateTo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-500" />
          <p className="text-sm font-medium text-slate-400">Loading intelligence dashboard metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h3 className="font-semibold text-lg">Unable to Load Overview Dashboard</h3>
        </div>
        <p className="text-sm text-slate-300 mb-4">{error}</p>
        <button
          onClick={loadOverviewData}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const pieData = [
    { name: 'Training Records', value: data.total_train_records, color: '#06B6D4' },
    { name: 'Testing Records', value: data.total_test_records, color: '#3B82F6' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-charcoal-900 to-navy-900 p-6 md:p-8 border border-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Human Activity Recognition Benchmark</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            Human Activity Recognition using <span className="text-gradient">Markov Chain</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Stochastic activity state modeling on the UCI HAR dataset. Evaluates empirical state
            transitions, calculates Laplace-smoothed transition matrices, and computes next-activity
            predictions across 30 participants and 6 physical states.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTo('markov')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold text-xs hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
            >
              <span>Explore Markov Matrices</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTo('predict')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-charcoal-800 text-slate-200 font-semibold text-xs hover:border-cyan-500/50 hover:text-cyan-300 transition-all"
            >
              <span>Interactive Predictor</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Training Records"
          value={data.total_train_records?.toLocaleString()}
          subtitle="71.4% partition"
          icon={Database}
          color="cyan"
          badgeText="Train"
        />
        <MetricCard
          title="Testing Records"
          value={data.total_test_records?.toLocaleString()}
          subtitle="28.6% partition"
          icon={Database}
          color="blue"
          badgeText="Test"
        />
        <MetricCard
          title="Activity States"
          value={data.num_activities}
          subtitle="Postures & Gaits"
          icon={Layers}
          color="purple"
          badgeText="6 States"
        />
        <MetricCard
          title="Participants"
          value={data.total_participants}
          subtitle={`${data.train_participants} Train / ${data.test_participants} Test`}
          icon={Users}
          color="emerald"
          badgeText="Subjects"
        />
        <MetricCard
          title="Sensor Features"
          value={data.num_sensor_features}
          subtitle="Acc & Gyro 50Hz"
          icon={BrainCircuit}
          color="amber"
          badgeText="561-D"
        />
        <MetricCard
          title="Model Accuracy"
          value={`${data.model_accuracy_percentage}%`}
          subtitle="Next-state accuracy"
          icon={Activity}
          color="cyan"
          badgeText="Markov"
          trend="Evaluated on 2,938 transitions"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Distribution Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-charcoal-900/90 p-6 border border-slate-800/80 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-2 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Activity Distribution across Datasets</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Record frequencies for Train (7,352) versus Test (2,947) partitions
              </p>
            </div>
            <div className="text-xs text-slate-400">
              Total Records: <span className="font-semibold text-white">{data.total_records?.toLocaleString()}</span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.activity_distribution}
                margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
              >
                <XAxis
                  dataKey="activity"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#F1F5F9' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }}
                />
                <Bar
                  dataKey="train_count"
                  name="Training Set"
                  fill="#06B6D4"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="test_count"
                  name="Testing Set"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Split Donut & Overview Card */}
        <div className="rounded-2xl bg-charcoal-900/90 p-6 border border-slate-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Dataset Partition Split</h3>
            <p className="text-xs text-slate-400 mb-4">
              70/30 Participant Split (21 Train / 9 Test)
            </p>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-navy-950/60 border border-slate-800">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                  Train Split (21 Participants)
                </span>
                <span className="font-bold text-white">71.4% (7,352)</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-navy-950/60 border border-slate-800">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Test Split (9 Participants)
                </span>
                <span className="font-bold text-white">28.6% (2,947)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Overall F1-Score:</span>
              <span className="font-bold text-cyan-400">{(data.weighted_f1 * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Summary & Recent Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Activity Baseline Predictions */}
        <div className="rounded-2xl bg-charcoal-900/90 p-6 border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <span>Next Activity Prediction Baseline</span>
              </h3>
              <p className="text-xs text-slate-400">
                Highest probability next state predicted for each current activity
              </p>
            </div>
            <button
              onClick={() => onNavigateTo('predict')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>Test Interactive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {data.sample_predictions?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-navy-950/70 border border-slate-800 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <StateBadge activity={item.current_activity} size="sm" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <StateBadge activity={item.predicted_next_activity} size="sm" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-cyan-400">
                    {item.confidence_percentage}%
                  </div>
                  <div className="text-[10px] text-slate-400">Probability</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Validation & Trial Boundary Notice */}
        <div className="rounded-2xl bg-charcoal-900/90 p-6 border border-slate-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
              <Info className="w-4 h-4" />
              <span>Dataset & Methodology Transparency</span>
            </div>
            <h4 className="text-sm font-semibold text-white mb-2">
              Sequential State Modeling & Boundary Integrity
            </h4>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p className="p-3 rounded-xl bg-navy-950/80 border border-slate-800">
                <strong className="text-cyan-400">Subject-Separated Sequences:</strong> In accordance with rigorous machine learning practices, transition counts are computed <span className="text-white font-medium">strictly within individual participant sequences</span>. Transitions are never created across different subjects.
              </p>
              <p className="p-3 rounded-xl bg-navy-950/80 border border-slate-800">
                <strong className="text-cyan-400">Laplace Smoothing (α = 1):</strong> Additive smoothing is applied to avoid zero probabilities for rare transitions, guaranteeing that all state transition probability rows sum to exactly 1.0.
              </p>
              <p className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <strong className="text-amber-400">Academic Disclaimer:</strong> The 96.22% accuracy reflects <span className="text-white font-medium">Next-Activity State Transition Predictability</span> under the 1st-order Markov property, not sensor-based feature classification of raw 561-D accelerometer/gyroscope signals.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Sampling: 50Hz Sliding Windows (128 readings, 50% overlap)</span>
            <span className="text-cyan-400 font-semibold">UCI HAR Archive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
