
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from pathlib import Path
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# ==========================================
# 1. PROJECT CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = (
    BASE_DIR
    / "MarkovChain_HumanActivity"
    / "dataset"
    / "UCI HAR Dataset"
)

TRAIN_PATH = DATA_DIR / "train" / "train.csv"
TEST_PATH = DATA_DIR / "test" / "test.csv"

OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

print("\n===================================")
print(" HUMAN ACTIVITY MARKOV CHAIN MODEL")
print("===================================")

# ==========================================
# 2. LOAD DATASET
# ==========================================

if not TRAIN_PATH.exists():
    raise FileNotFoundError(f"Training file not found: {TRAIN_PATH}")

if not TEST_PATH.exists():
    raise FileNotFoundError(f"Testing file not found: {TEST_PATH}")

train = pd.read_csv(TRAIN_PATH)
test = pd.read_csv(TEST_PATH)

# Remove accidental CSV index columns

train = train.loc[:, ~train.columns.str.startswith("Unnamed:")]
test = test.loc[:, ~test.columns.str.startswith("Unnamed:")]

print("\nDataset loaded successfully!")

print("Training shape:", train.shape)
print("Testing shape:", test.shape)

# ==========================================
# 3. IDENTIFY MARKOV STATES
# ==========================================

ACTIVITY_COLUMN = "Activity"
SUBJECT_COLUMN = "subject"

if ACTIVITY_COLUMN not in train.columns:
    raise ValueError("Activity column not found!")

if SUBJECT_COLUMN not in train.columns:
    raise ValueError("subject column not found!")

STATES = sorted(train[ACTIVITY_COLUMN].dropna().unique())

print("\nMarkov States:")
for state in STATES:
    print(" -", state)

print("\nNumber of states:", len(STATES))

# ==========================================
# 4. ACTIVITY DISTRIBUTION
# ==========================================

print("\nActivity Distribution:")

print(train[ACTIVITY_COLUMN].value_counts())

# ==========================================
# 5. BUILD TRANSITION COUNT MATRIX
# ==========================================

number_of_states = len(STATES)

transition_counts = pd.DataFrame(
    0,
    index=STATES,
    columns=STATES,
    dtype=int
)

# Group by participant.
# Preserve original row order within each subject.

for subject, group in train.groupby(
    SUBJECT_COLUMN, sort=False
):

    sequence = group[ACTIVITY_COLUMN].tolist()

    for i in range(len(sequence) - 1):

        current_state = sequence[i]
        next_state = sequence[i + 1]

        transition_counts.loc[
            current_state, next_state
        ] += 1

print("\n===================================")
print(" TRANSITION COUNT MATRIX")
print("===================================")

print(transition_counts)

transition_counts.to_csv(
    OUTPUT_DIR / "transition_counts.csv"
)

# ==========================================
# 6. CALCULATE TRANSITION PROBABILITIES
# ==========================================

# Laplace smoothing

alpha = 1

smoothed_counts = transition_counts + alpha

transition_matrix = smoothed_counts.div(
    smoothed_counts.sum(axis=1),
    axis=0
)

print("\n===================================")
print(" MARKOV TRANSITION PROBABILITY MATRIX")
print("===================================")

print(transition_matrix.round(4))

transition_matrix.to_csv(
    OUTPUT_DIR / "transition_matrix.csv"
)

# ==========================================
# 7. VISUALIZE TRANSITION MATRIX
# ==========================================

plt.figure(figsize=(12, 9))

sns.heatmap(
    transition_matrix,
    annot=True,
    cmap="Blues",
    fmt=".3f",
    linewidths=0.5
)

plt.title(
    "Human Activity Recognition - Markov Transition Matrix"
)

plt.xlabel("Next Activity")
plt.ylabel("Current Activity")

plt.tight_layout()

plt.savefig(
    OUTPUT_DIR / "transition_heatmap.png",
    dpi=300
)

plt.show()

# ==========================================
# 8. PREDICT NEXT ACTIVITY
# ==========================================

def predict_next_activity(current_activity):

    probabilities = transition_matrix.loc[current_activity]

    predicted_activity = probabilities.idxmax()

    confidence = probabilities.max()

    return predicted_activity, confidence


print("\n===================================")
print(" NEXT ACTIVITY PREDICTIONS")
print("===================================")

for activity in STATES:

    prediction, confidence = predict_next_activity(activity)

    print(
        f"{activity} -> {prediction} "
        f"(Probability: {confidence:.4f})"
    )

# ==========================================
# 9. TEST THE MARKOV CHAIN MODEL
# ==========================================

actual = []
predicted = []

for subject, group in test.groupby(
    SUBJECT_COLUMN, sort=False
):

    sequence = group[ACTIVITY_COLUMN].tolist()

    for i in range(len(sequence) - 1):

        current_activity = sequence[i]
        actual_next_activity = sequence[i + 1]

        prediction, confidence = predict_next_activity(
            current_activity
        )

        actual.append(actual_next_activity)
        predicted.append(prediction)

# ==========================================
# 10. MODEL EVALUATION
# ==========================================

print("\n===================================")
print(" MODEL EVALUATION")
print("===================================")

accuracy = accuracy_score(actual, predicted)

print(f"\nAccuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")

print(
    classification_report(
        actual,
        predicted,
        labels=STATES,
        zero_division=0
    )
)

# ==========================================
# 11. CONFUSION MATRIX
# ==========================================

cm = confusion_matrix(
    actual,
    predicted,
    labels=STATES
)

plt.figure(figsize=(11, 8))

sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Greens",
    xticklabels=STATES,
    yticklabels=STATES
)

plt.title("Markov Chain - Confusion Matrix")
plt.xlabel("Predicted Activity")
plt.ylabel("Actual Activity")

plt.tight_layout()

plt.savefig(
    OUTPUT_DIR / "confusion_matrix.png",
    dpi=300
)

plt.show()

# ==========================================
# 12. SAVE PREDICTION RESULTS
# ==========================================

results = pd.DataFrame({
    "Actual_Activity": actual,
    "Predicted_Activity": predicted
})

results.to_csv(
    OUTPUT_DIR / "prediction_results.csv",
    index=False
)

# ==========================================
# 13. FINAL RESULT
# ==========================================

print("\n===================================")
print(" PROJECT COMPLETED SUCCESSFULLY!")
print("===================================")

print("\nGenerated files:")

for file in OUTPUT_DIR.iterdir():
    print(file.name)

print("\nCheck the outputs folder.")
