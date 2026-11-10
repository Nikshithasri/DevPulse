import io
import csv
import os
from datetime import datetime
from pathlib import Path
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

from markov_model import MarkovChainModel
from dataset_service import DatasetService
from evaluation import EvaluationService

app = Flask(__name__)
# Enable CORS for all routes and frontend origins
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Global service holders
dataset_service: DatasetService = None
markov_model: MarkovChainModel = None
evaluation_service: EvaluationService = None


def initialize_services():
    global dataset_service, markov_model, evaluation_service
    print("[Backend] Initializing Dataset Service...")
    dataset_service = DatasetService()

    print("[Backend] Fitting First-Order Markov Chain Model...")
    markov_model = MarkovChainModel(alpha=1.0)
    markov_model.fit(
        df=dataset_service.train_df,
        activity_col="Activity",
        subject_col="subject"
    )

    print("[Backend] Running Model Evaluation on Test Data...")
    evaluation_service = EvaluationService(
        model=markov_model,
        test_df=dataset_service.test_df
    )
    print(f"[Backend] Initialization Complete! Test Accuracy: {evaluation_service.evaluation_results['accuracy_percentage']}%")


# Initialize on module load
initialize_services()


# ==========================================
# API ROUTES
# ==========================================

@app.route("/api/health", methods=["GET"])
def health_check():
    """Returns backend connection status and service health."""
    return jsonify({
        "status": "online",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model_loaded": markov_model is not None and markov_model.is_trained,
        "dataset_loaded": dataset_service is not None,
        "version": "1.0.0",
        "app_name": "Markov Activity Intelligence API"
    })


@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    """Returns unified statistics and high-level KPIs for Overview Dashboard."""
    stats = dataset_service.get_dashboard_stats()
    eval_summary = evaluation_service.get_summary()

    # Pre-generate sample next predictions for all states
    sample_predictions = []
    for state in markov_model.states:
        pred = markov_model.predict(state)
        sample_predictions.append({
            "current_activity": state,
            "predicted_next_activity": pred["predicted_next_activity"],
            "confidence": pred["confidence"],
            "confidence_percentage": pred["confidence_percentage"]
        })

    return jsonify({
        "success": True,
        "total_train_records": stats["total_train_records"],
        "total_test_records": stats["total_test_records"],
        "total_records": stats["total_records"],
        "num_activities": stats["num_activities"],
        "total_participants": stats["total_participants"],
        "train_participants": stats["train_subjects_count"],
        "test_participants": stats["test_subjects_count"],
        "num_sensor_features": stats["num_features"],
        "activities": stats["activities"],
        "model_accuracy": eval_summary["accuracy"],
        "model_accuracy_percentage": eval_summary["accuracy_percentage"],
        "macro_f1": eval_summary["macro_avg"]["f1_score"],
        "weighted_f1": eval_summary["weighted_avg"]["f1_score"],
        "total_transitions_evaluated": eval_summary["total_transitions_evaluated"],
        "correct_predictions": eval_summary["correct_predictions"],
        "incorrect_predictions": eval_summary["incorrect_predictions"],
        "activity_distribution": dataset_service.get_activity_distribution()["distribution"],
        "sample_predictions": sample_predictions,
        "dataset_metadata": stats["dataset_info"]
    })


@app.route("/api/dataset/train", methods=["GET"])
def get_train_dataset():
    """Returns paginated training records with filtering."""
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 15))
    activity = request.args.get("activity", None)
    subject = request.args.get("subject", None)
    search = request.args.get("search", None)

    data = dataset_service.get_paginated_records(
        dataset_type="train",
        page=page,
        limit=limit,
        activity=activity,
        subject=subject,
        search=search
    )
    return jsonify({"success": True, **data})


@app.route("/api/dataset/test", methods=["GET"])
def get_test_dataset():
    """Returns paginated testing records with filtering."""
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 15))
    activity = request.args.get("activity", None)
    subject = request.args.get("subject", None)
    search = request.args.get("search", None)

    data = dataset_service.get_paginated_records(
        dataset_type="test",
        page=page,
        limit=limit,
        activity=activity,
        subject=subject,
        search=search
    )
    return jsonify({"success": True, **data})


@app.route("/api/activities", methods=["GET"])
def get_activities():
    """Returns the six activity states and metadata."""
    state_descriptions = {
        "LAYING": "Static horizontal posture, body resting on a flat surface.",
        "SITTING": "Static seated posture on a chair or bench.",
        "STANDING": "Static upright posture, minimal acceleration.",
        "WALKING": "Dynamic periodic forward bipedal gait on level surface.",
        "WALKING_DOWNSTAIRS": "Dynamic downward stairs descent with negative gravitational acceleration gradient.",
        "WALKING_UPSTAIRS": "Dynamic climbing ascent with increased energy and vertical acceleration component."
    }

    activities_data = []
    for s in markov_model.states:
        # Calculate self-transition probability P(s -> s)
        self_prob = round(float(markov_model.transition_probabilities.loc[s, s]), 4)
        activities_data.append({
            "name": s,
            "description": state_descriptions.get(s, "Human activity state"),
            "self_transition_probability": self_prob,
            "self_transition_percentage": round(self_prob * 100, 2),
            "train_occurrences": int(dataset_service.train_df["Activity"].value_counts().get(s, 0)),
            "test_occurrences": int(dataset_service.test_df["Activity"].value_counts().get(s, 0))
        })

    return jsonify({
        "success": True,
        "count": len(markov_model.states),
        "activities": markov_model.states,
        "details": activities_data
    })


@app.route("/api/transitions/counts", methods=["GET"])
def get_transition_counts():
    """Returns empirical transition count matrix N(i -> j)."""
    counts_data = markov_model.get_counts_matrix_dict()
    return jsonify({"success": True, **counts_data})


@app.route("/api/transitions/probabilities", methods=["GET"])
def get_transition_probabilities():
    """Returns Laplace-smoothed transition probability matrix P(i -> j)."""
    probs_data = markov_model.get_probabilities_matrix_dict()
    return jsonify({"success": True, **probs_data})


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Accepts current activity state:
    { "activity": "WALKING" }
    Returns predicted next activity, confidence, and all state probabilities.
    """
    payload = request.get_json(force=True, silent=True) or {}
    activity = payload.get("activity", "").strip().upper()

    if not activity:
        return jsonify({"success": False, "error": "Missing required field 'activity'"}), 400

    if activity not in markov_model.states:
        return jsonify({
            "success": False,
            "error": f"Invalid activity '{activity}'. Allowed states: {markov_model.states}"
        }), 400

    prediction_result = markov_model.predict(activity)
    return jsonify({"success": True, **prediction_result})


@app.route("/api/simulate", methods=["POST"])
def simulate_trajectory():
    """
    Simulate a Markov Chain trajectory from a starting activity state.
    { "start_activity": "WALKING", "steps": 10 }
    """
    payload = request.get_json(force=True, silent=True) or {}
    start_activity = payload.get("start_activity", "WALKING").strip().upper()
    steps = int(payload.get("steps", 10))
    steps = max(2, min(steps, 50))

    if start_activity not in markov_model.states:
        return jsonify({"success": False, "error": f"Invalid start activity: {start_activity}"}), 400

    sim_result = markov_model.simulate_sequence(start_activity=start_activity, steps=steps)
    return jsonify({"success": True, **sim_result})


@app.route("/api/evaluation", methods=["GET"])
def get_evaluation():
    """Returns model evaluation metrics: accuracy, precision, recall, f1, classification report."""
    summary = evaluation_service.get_summary()
    return jsonify({"success": True, **summary})


@app.route("/api/evaluation/confusion-matrix", methods=["GET"])
def get_confusion_matrix():
    """Returns confusion matrix values, heatmap grid, and prediction counts."""
    cm_data = evaluation_service.get_confusion_matrix()
    return jsonify({"success": True, **cm_data})


@app.route("/api/activity-distribution", methods=["GET"])
def get_activity_distribution():
    """Returns activity frequency counts across train, test, and overall."""
    dist = dataset_service.get_activity_distribution()
    return jsonify({"success": True, **dist})


@app.route("/api/export/<export_type>", methods=["GET"])
def export_csv(export_type: str):
    """
    Downloads CSV files for matrices and reports:
    - transition-matrix
    - transition-counts
    - prediction-results
    - evaluation-report
    """
    output = io.StringIO()
    writer = csv.writer(output)

    if export_type == "transition-matrix":
        probs = markov_model.transition_probabilities.round(4)
        probs.to_csv(output)
        filename = "markov_transition_probability_matrix.csv"
    elif export_type == "transition-counts":
        counts = markov_model.transition_counts
        counts.to_csv(output)
        filename = "markov_transition_counts_matrix.csv"
    elif export_type == "prediction-results":
        evaluation_service.predictions_df.to_csv(output, index=False)
        filename = "markov_test_prediction_results.csv"
    elif export_type == "evaluation-report":
        eval_dict = evaluation_service.get_summary()
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Model Type", eval_dict["model_type"]])
        writer.writerow(["Metric Type", eval_dict["metric_type"]])
        writer.writerow(["Accuracy (%)", eval_dict["accuracy_percentage"]])
        writer.writerow(["Macro Precision", eval_dict["macro_avg"]["precision"]])
        writer.writerow(["Macro Recall", eval_dict["macro_avg"]["recall"]])
        writer.writerow(["Macro F1-Score", eval_dict["macro_avg"]["f1_score"]])
        writer.writerow(["Weighted F1-Score", eval_dict["weighted_avg"]["f1_score"]])
        writer.writerow(["Total Transitions Evaluated", eval_dict["total_transitions_evaluated"]])
        writer.writerow(["Correct Predictions", eval_dict["correct_predictions"]])
        writer.writerow(["Incorrect Predictions", eval_dict["incorrect_predictions"]])
        writer.writerow([])
        writer.writerow(["Activity", "Precision", "Recall", "F1-Score", "Support"])
        for cm in eval_dict["class_metrics"]:
            writer.writerow([cm["activity"], cm["precision"], cm["recall"], cm["f1_score"], cm["support"]])
        filename = "markov_model_evaluation_report.csv"
    else:
        return jsonify({"success": False, "error": f"Unknown export type '{export_type}'"}), 400

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.route("/api/refresh", methods=["POST"])
def refresh_data():
    """Reloads datasets and refits the Markov chain model."""
    try:
        initialize_services()
        return jsonify({"success": True, "message": "Model and dataset successfully refreshed!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# Small compatibility surface for the standalone Vite client.
@app.route("/api/overview", methods=["GET"])
def overview_compat():
    stats = dataset_service.get_dashboard_stats()
    distribution = dataset_service.get_activity_distribution()["distribution"]
    return jsonify({
        "trainRows": stats["total_train_records"],
        "testRows": stats["total_test_records"],
        "featureCount": stats["num_features"],
        "activityCount": stats["num_activities"],
        "subjectCount": stats["total_participants"],
        "states": stats["activities"],
        "activityDistribution": [
            {"activity": item["activity"], "count": item["train_count"]}
            for item in distribution
        ],
        "mostCommonActivity": max(distribution, key=lambda item: item["train_count"])["activity"],
        "accuracy": evaluation_service.get_summary()["accuracy"],
    })


@app.route("/api/markov", methods=["GET"])
def markov_compat():
    counts = markov_model.get_counts_matrix_dict()
    probabilities = markov_model.get_probabilities_matrix_dict()
    return jsonify({
        "states": counts["states"],
        "counts": counts["raw_grid"],
        "probabilities": probabilities["raw_grid"],
        "rowTotals": [
            row["total_transitions"] for row in counts["matrix"]
        ],
        "smoothing": markov_model.alpha,
    })


@app.route("/api/explorer", methods=["GET"])
def explorer_compat():
    try:
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("pageSize", 15))
        subject = request.args.get("subject", "")
    except ValueError:
        return jsonify({"error": "Invalid pagination or subject value"}), 400
    data = dataset_service.get_paginated_records(
        dataset_type=request.args.get("dataset", "train"),
        page=page,
        limit=page_size,
        activity=request.args.get("activity", ""),
        subject=subject,
        search=request.args.get("search", ""),
    )
    return jsonify({
        "rows": data["records"],
        "total": data["total_records"],
        "columns": data["available_columns"],
        "page": data["page"],
        "pageSize": data["limit"],
    })


@app.route("/api/predict", methods=["GET"])
def predict_compat():
    activity = request.args.get("activity", "").strip().upper()
    if activity not in markov_model.states:
        return jsonify({"error": f"Invalid activity '{activity}'"}), 400
    result = markov_model.predict(activity)
    return jsonify({
        "current": activity,
        "activity": result["predicted_next_activity"],
        "confidence": result["confidence"],
    })


if __name__ == "__main__":
    # Standard Flask port
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
