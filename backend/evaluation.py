import numpy as np
import pandas as pd
from typing import Dict, List
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from markov_model import MarkovChainModel


class EvaluationService:
    """
    Evaluates the Markov Chain model against test sequence transitions.
    Calculates accuracy, precision, recall, F1, and confusion matrix.
    Labels metrics accurately as 'Next-Activity State Transition Accuracy'.
    """

    def __init__(self, model: MarkovChainModel, test_df: pd.DataFrame):
        self.model = model
        self.test_df = test_df
        self.evaluation_results: Dict = {}
        self.predictions_df: pd.DataFrame = pd.DataFrame()
        self._run_evaluation()

    def _run_evaluation(self):
        """
        Runs evaluation on test dataset preserving subject sequence order.
        Transitions are computed only within the same subject.
        """
        if not self.model.is_trained:
            raise RuntimeError("Model must be trained before evaluation.")

        actual = []
        predicted = []
        confidences = []
        current_activities = []
        subjects = []

        # Group by subject and extract sequential pairs
        for subject, group in self.test_df.groupby("subject", sort=False):
            seq = group["Activity"].tolist()
            seq_len = len(seq)
            for i in range(seq_len - 1):
                curr = seq[i]
                next_act = seq[i + 1]

                pred_res = self.model.predict(curr)

                subjects.append(int(subject))
                current_activities.append(curr)
                actual.append(next_act)
                predicted.append(pred_res["predicted_next_activity"])
                confidences.append(pred_res["confidence"])

        self.predictions_df = pd.DataFrame({
            "subject": subjects,
            "current_activity": current_activities,
            "actual_next_activity": actual,
            "predicted_next_activity": predicted,
            "is_correct": [a == p for a, p in zip(actual, predicted)],
            "confidence": confidences
        })

        total_transitions = len(actual)
        correct_count = int(self.predictions_df["is_correct"].sum())
        incorrect_count = total_transitions - correct_count

        accuracy = float(accuracy_score(actual, predicted))

        # Scikit-learn classification report
        report_dict = classification_report(
            actual,
            predicted,
            labels=self.model.states,
            zero_division=0,
            output_dict=True
        )

        # Scikit-learn confusion matrix
        cm = confusion_matrix(
            actual,
            predicted,
            labels=self.model.states
        )

        # Format per-class metrics
        class_metrics = []
        for state in self.model.states:
            st_data = report_dict.get(state, {})
            class_metrics.append({
                "activity": state,
                "precision": round(float(st_data.get("precision", 0.0)), 4),
                "recall": round(float(st_data.get("recall", 0.0)), 4),
                "f1_score": round(float(st_data.get("f1-score", 0.0)), 4),
                "support": int(st_data.get("support", 0))
            })

        # Format confusion matrix for UI
        cm_matrix_data = []
        cm_heatmap_points = []
        for r_idx, actual_state in enumerate(self.model.states):
            row_dict = {"actual": actual_state}
            for c_idx, pred_state in enumerate(self.model.states):
                count = int(cm[r_idx, c_idx])
                row_dict[pred_state] = count
                cm_heatmap_points.append({
                    "actual": actual_state,
                    "predicted": pred_state,
                    "count": count,
                    "actual_index": r_idx,
                    "predicted_index": c_idx
                })
            row_dict["total_actual"] = int(cm[r_idx, :].sum())
            cm_matrix_data.append(row_dict)

        self.evaluation_results = {
            "model_type": "First-Order Markov Chain",
            "metric_type": "Next-Activity State Transition Accuracy",
            "accuracy": round(accuracy, 4),
            "accuracy_percentage": round(accuracy * 100, 2),
            "total_transitions_evaluated": total_transitions,
            "correct_predictions": correct_count,
            "incorrect_predictions": incorrect_count,
            "macro_avg": {
                "precision": round(float(report_dict["macro avg"]["precision"]), 4),
                "recall": round(float(report_dict["macro avg"]["recall"]), 4),
                "f1_score": round(float(report_dict["macro avg"]["f1-score"]), 4)
            },
            "weighted_avg": {
                "precision": round(float(report_dict["weighted avg"]["precision"]), 4),
                "recall": round(float(report_dict["weighted avg"]["recall"]), 4),
                "f1_score": round(float(report_dict["weighted avg"]["f1-score"]), 4)
            },
            "class_metrics": class_metrics,
            "states": self.model.states,
            "confusion_matrix": cm_matrix_data,
            "confusion_matrix_grid": cm.tolist(),
            "confusion_heatmap": cm_heatmap_points,
            "academic_note": (
                "Metric strictly represents next-activity transition predictability under Markov assumption. "
                "The model predicts the subsequent state from the current activity state rather than classifying raw sensor signals."
            )
        }

    def get_summary(self) -> Dict:
        """Returns the complete evaluation summary."""
        return self.evaluation_results

    def get_confusion_matrix(self) -> Dict:
        """Returns confusion matrix data."""
        return {
            "states": self.model.states,
            "matrix": self.evaluation_results["confusion_matrix"],
            "grid": self.evaluation_results["confusion_matrix_grid"],
            "heatmap": self.evaluation_results["confusion_heatmap"],
            "total_transitions": self.evaluation_results["total_transitions_evaluated"],
            "correct": self.evaluation_results["correct_predictions"],
            "incorrect": self.evaluation_results["incorrect_predictions"],
            "accuracy": self.evaluation_results["accuracy_percentage"]
        }

    def get_prediction_records(self, limit: int = 50) -> List[Dict]:
        """Returns preview records of actual vs predicted next activities."""
        subset = self.predictions_df.head(limit)
        return subset.to_dict(orient="records")
