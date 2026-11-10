import React from 'react';
import {
  BookOpen,
  Network,
  Cpu,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  HelpCircle,
  Calculator,
  ShieldCheck
} from 'lucide-react';
import StateBadge from '../components/StateBadge';

export default function AboutMarkovPage() {
  const exampleSequence = [
    { state: 'WALKING', duration: 'Step t-2' },
    { state: 'WALKING', duration: 'Step t-1' },
    { state: 'SITTING', duration: 'Step t (Current)' },
    { state: 'STANDING', duration: 'Step t+1 (Predicted)' },
  ];

  const glossaryItems = [
    {
      term: 'Markov Chain',
      def: 'A mathematical stochastic process describing a sequence of possible events where the probability of transitioning to any next state depends solely on the current state.',
      icon: Network,
      color: 'cyan',
    },
    {
      term: 'State (S)',
      def: 'A distinct physical condition or activity posture at a given point in time. In this project, there are 6 discrete states: WALKING, WALKING_UPSTAIRS, WALKING_DOWNSTAIRS, SITTING, STANDING, LAYING.',
      icon: Layers,
      color: 'purple',
    },
    {
      term: 'Transition',
      def: 'The temporal shift from one activity state at time t to another activity state at time t+1 within an uninterrupted participant sequence.',
      icon: ArrowRight,
      color: 'blue',
    },
    {
      term: 'Transition Probability',
      def: 'The conditional likelihood P(X[t+1] = j | X[t] = i) that state j will succeed state i, estimated empirically with Laplace smoothing.',
      icon: Calculator,
      color: 'emerald',
    },
    {
      term: 'The Markov Property',
      def: 'Also known as memorylessness: given the present state, future states are conditionally independent of the past states.',
      icon: BrainCircuit,
      color: 'amber',
    },
    {
      term: 'Transition Matrix (P)',
      def: 'A square 6×6 stochastic matrix where element P_ij represents transition probability from row i to column j, where all rows sum to exactly 1.0.',
      icon: Cpu,
      color: 'cyan',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Educational Guide & Mathematical Foundation</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Understanding Markov Chains in Human Activity Recognition
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          A rigorous theoretical overview of stochastic sequential activity modeling, memoryless transitions,
          Laplace smoothing, and transition probability mathematics.
        </p>
      </div>

      {/* Visual Sequence Demonstration Walkthrough */}
      <div className="rounded-2xl bg-charcoal-900/90 border border-slate-800/80 shadow-xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Visual Demonstration: Memoryless State Transition
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Suppose a smartphone user undertakes the sequence of physical activities below:
        </p>

        {/* Visual Walkthrough Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-3">
          {exampleSequence.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
                idx === 2
                  ? 'bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/30'
                  : idx === 3
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-navy-950/60 border-slate-800'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                {item.duration}
              </div>
              <div className="flex justify-center">
                <StateBadge activity={item.state} size="md" />
              </div>
              <div className="text-[10px] text-slate-400">
                {idx === 2
                  ? 'Given Current State X[t]'
                  : idx === 3
                  ? 'P(X[t+1] | X[t]) = Next'
                  : 'Historical State (Discarded)'}
              </div>
            </div>
          ))}
        </div>

        {/* Memoryless Explanation Callout */}
        <div className="rounded-xl bg-navy-950 p-4 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-cyan-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Why the Markov Property Discards History:</span>
          </div>
          <p className="leading-relaxed">
            In a First-Order Markov Chain, the prediction for Step <code className="text-cyan-300 font-mono">t+1</code> (e.g.{' '}
            <strong className="text-white">STANDING</strong>) depends <span className="text-white font-semibold underline">only</span> on Step{' '}
            <code className="text-cyan-300 font-mono">t</code> (<strong className="text-white">SITTING</strong>).
            The fact that the user was walking prior to sitting (<code className="text-slate-400">t-2</code> and <code className="text-slate-400">t-1</code>) does not alter the conditional transition probability:
          </p>
          <div className="p-2.5 rounded-lg bg-charcoal-900 border border-slate-800 font-mono text-center text-cyan-300 text-xs">
            P(X[t+1] = STANDING | X[t] = SITTING, X[t-1] = WALKING, ...) = P(X[t+1] = STANDING | X[t] = SITTING)
          </div>
        </div>
      </div>

      {/* Core Concept Glossary Cards */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span>Core Mathematical Concepts</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {glossaryItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-charcoal-900/90 border border-slate-800/80 p-5 space-y-2.5 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{item.term}</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.def}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Implementation Details & Mathematical Formulation */}
      <div className="rounded-2xl bg-charcoal-900/90 border border-slate-800/80 shadow-xl p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>How This Project Implements Markov Chain on UCI HAR</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Detailed breakdown of empirical counting, sequence splitting, and Laplace smoothing
          </p>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-cyan-400 text-sm">
              1. Participant Sequence Preservation (No Inter-Subject Transitions)
            </h4>
            <p>
              The training dataset contains 7,352 observations across 21 participants (subjects).
              Observations are grouped strictly by <code className="text-white font-mono">subject</code>.
              Transitions are extracted between consecutive rows <code className="text-white font-mono">(row_i, row_i+1)</code> within that participant's timeline.
              Crucially, <strong className="text-white">transitions are never calculated between the last row of Participant 1 and the first row of Participant 3</strong>,
              preserving physiological sequence integrity.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-cyan-400 text-sm">
              2. Empirical Counting: N(i → j)
            </h4>
            <p>
              For every pair of states <code className="text-white font-mono">(i, j)</code>, the count{' '}
              <code className="text-white font-mono">N(i → j)</code> is the total number of times activity{' '}
              <code className="text-cyan-300 font-mono">i</code> was directly followed by activity{' '}
              <code className="text-cyan-300 font-mono">j</code>.
              Across the 21 training subjects, 7,331 valid transitions are recorded.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-cyan-400 text-sm">
              3. Laplace Additive Smoothing (α = 1.0)
            </h4>
            <p>
              In real-world data, some transitions might never be observed in the training split (e.g., WALKING directly into LAYING without an intermediate standing or sitting posture).
              To ensure robust probabilities and avoid division by zero or infinite log-likelihood penalties:
            </p>
            <div className="p-3 rounded-lg bg-charcoal-900 border border-slate-800 text-center font-mono text-cyan-300 text-xs my-2">
              P(X[t+1] = j | X[t] = i) = ( N(i → j) + 1 ) / ( Σ_k N(i → k) + 6 )
            </div>
            <p>
              Every row sum is verified to equal exactly <strong className="text-white font-mono">1.0000</strong>.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-cyan-400 text-sm">
              4. Test Set Evaluation & Holdout Validation
            </h4>
            <p>
              The trained transition matrix is tested on the holdout test dataset (2,947 observations across 9 participants, yielding 2,938 transitions).
              For each transition <code className="text-white font-mono">X[t] → X[t+1]</code>, the model predicts the argmax:
            </p>
            <div className="p-3 rounded-lg bg-charcoal-900 border border-slate-800 text-center font-mono text-cyan-300 text-xs my-2">
              Predicted Next Activity = argmax_j P(X[t+1] = j | X[t])
            </div>
            <p>
              The model achieves <strong className="text-emerald-400">96.22% accuracy</strong> (2,827 correct predictions out of 2,938 transitions).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
