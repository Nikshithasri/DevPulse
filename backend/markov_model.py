import numpy as np
import pandas as pd
from pathlib import Path


class MarkovChainModel:
    """
    First-Order Markov Chain Model for Human Activity Recognition.
    Calculates empirical state transition counts and Laplace-smoothed
    transition probabilities between activity states per participant sequence.
    """

    def __init__(self, alpha: float = 1.0):
        self.alpha = float(alpha)
        self.states = []
        self.transition_counts = None
        self.transition_probabilities = None
        self.is_trained = False
        self.train_pairs_count = 0

    def fit(self, df: pd.DataFrame, activity_col: str = "Activity", subject_col: str = "subject"):
        """
        Train the Markov Chain model from sequential activity data grouped by subject.
        Rules:
        - Preserve original row order within each subject.
        - Never calculate transitions across distinct subjects.
        - Calculate raw transition counts N(i -> j).
        - Apply Laplace smoothing with alpha=1.
        - Ensure every probability row sums to 1.0.
        """
        if activity_col not in df.columns:
            raise ValueError(f"Required column '{activity_col}' missing from training data.")
        if subject_col not in df.columns:
            raise ValueError(f"Required column '{subject_col}' missing from training data.")

        # Identify unique sorted states
        self.states = sorted(df[activity_col].dropna().unique().tolist())
        num_states = len(self.states)

        # Initialize raw transition counts matrix
        self.transition_counts = pd.DataFrame(
            0,
            index=self.states,
            columns=self.states,
            dtype=int
        )

        total_pairs = 0

        # Group by participant preserving original encounter order
        for subject, group in df.groupby(subject_col, sort=False):
            sequence = group[activity_col].tolist()
            seq_len = len(sequence)
            for i in range(seq_len - 1):
                curr_state = sequence[i]
                next_state = sequence[i + 1]
                if curr_state in self.transition_counts.index and next_state in self.transition_counts.columns:
                    self.transition_counts.loc[curr_state, next_state] += 1
                    total_pairs += 1

        self.train_pairs_count = total_pairs

        # Laplace smoothing: (count + alpha) / sum(count + alpha)
        smoothed = self.transition_counts + self.alpha
        self.transition_probabilities = smoothed.div(smoothed.sum(axis=1), axis=0)

        # Verify row sum equals 1.0
        row_sums = self.transition_probabilities.sum(axis=1)
        np.testing.assert_allclose(
            row_sums.values,
            np.ones(num_states),
            rtol=1e-5,
            err_msg="Transition probability rows must sum to 1.0"
        )

        self.is_trained = True
        return self

    def predict(self, current_activity: str):
        """
        Predict the most probable next activity given current activity.
        Returns:
            predicted_activity: str
            confidence: float (highest probability)
            probabilities: dict of {state: probability}
        """
        if not self.is_trained:
            raise RuntimeError("Model is not trained yet. Call fit() first.")
        if current_activity not in self.states:
            raise ValueError(f"Unknown activity '{current_activity}'. Valid states: {self.states}")

        row = self.transition_probabilities.loc[current_activity]
        predicted_activity = row.idxmax()
        confidence = float(row.max())

        probs_dict = {state: round(float(row[state]), 4) for state in self.states}

        # Build detailed ranking
        sorted_predictions = sorted(
            [{"activity": s, "probability": round(float(row[s]), 4), "percentage": round(float(row[s]) * 100, 2)} for s in self.states],
            key=lambda x: x["probability"],
            reverse=True
        )

        return {
            "current_activity": current_activity,
            "predicted_next_activity": predicted_activity,
            "confidence": round(confidence, 4),
            "confidence_percentage": round(confidence * 100, 2),
            "probabilities": probs_dict,
            "ranked_predictions": sorted_predictions
        }

    def simulate_sequence(self, start_activity: str, steps: int = 10, seed: int = None):
        """
        Simulate a realistic sequence of activity transitions from a starting activity
        using the learned transition probability distribution.
        """
        if not self.is_trained:
            raise RuntimeError("Model is not trained.")
        if start_activity not in self.states:
            raise ValueError(f"Unknown start activity: {start_activity}")

        rng = np.random.default_rng(seed)
        sequence = [start_activity]
        current = start_activity
        step_details = []

        for step in range(1, steps + 1):
            probs = self.transition_probabilities.loc[current].values
            next_act = rng.choice(self.states, p=probs)
            step_details.append({
                "step": step,
                "from_state": current,
                "to_state": next_act,
                "probability": round(float(self.transition_probabilities.loc[current, next_act]), 4)
            })
            current = next_act
            sequence.append(current)

        return {
            "start_activity": start_activity,
            "steps_count": steps,
            "sequence": sequence,
            "transitions": step_details
        }

    def get_counts_matrix_dict(self):
        """Return transition counts matrix formatted for JSON API & frontend visualization."""
        if not self.is_trained:
            return {}

        matrix_data = []
        for row_state in self.states:
            row_dict = {"state": row_state}
            for col_state in self.states:
                row_dict[col_state] = int(self.transition_counts.loc[row_state, col_state])
            row_dict["total_transitions"] = int(self.transition_counts.loc[row_state].sum())
            matrix_data.append(row_dict)

        return {
            "states": self.states,
            "matrix": matrix_data,
            "raw_grid": self.transition_counts.values.tolist(),
            "total_transitions": int(self.train_pairs_count)
        }

    def get_probabilities_matrix_dict(self):
        """Return transition probabilities matrix formatted for JSON API & frontend heatmap."""
        if not self.is_trained:
            return {}

        matrix_data = []
        heatmap_points = []

        for r_idx, row_state in enumerate(self.states):
            row_dict = {"state": row_state}
            for c_idx, col_state in enumerate(self.states):
                p = float(self.transition_probabilities.loc[row_state, col_state])
                row_dict[col_state] = round(p, 4)
                heatmap_points.append({
                    "from": row_state,
                    "to": col_state,
                    "from_index": r_idx,
                    "to_index": c_idx,
                    "probability": round(p, 4),
                    "percentage": round(p * 100, 2),
                    "raw_count": int(self.transition_counts.loc[row_state, col_state])
                })
            row_dict["row_sum"] = round(float(self.transition_probabilities.loc[row_state].sum()), 4)
            matrix_data.append(row_dict)

        return {
            "states": self.states,
            "matrix": matrix_data,
            "heatmap_data": heatmap_points,
            "raw_grid": self.transition_probabilities.round(4).values.tolist(),
            "alpha": self.alpha
        }
