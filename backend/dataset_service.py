import os
from pathlib import Path
from typing import Dict, List, Optional
import pandas as pd
import numpy as np


class DatasetService:
    """
    Manages loading, cleaning, caching, and querying the UCI HAR dataset.
    Provides fast paginated reads and summary analytics for dashboard and dataset explorer.
    """

    def __init__(self, base_dir: Optional[Path] = None):
        if base_dir is None:
            # backend folder -> parent is project root kkk
            base_dir = Path(__file__).resolve().parent.parent

        self.base_dir = base_dir
        self.data_dir = (
            self.base_dir
            / "MarkovChain_HumanActivity"
            / "dataset"
            / "UCI HAR Dataset"
        )
        self.train_path = self.data_dir / "train" / "train.csv"
        self.test_path = self.data_dir / "test" / "test.csv"

        self.train_df: Optional[pd.DataFrame] = None
        self.test_df: Optional[pd.DataFrame] = None
        self.features: List[str] = []
        self.activities: List[str] = []
        self.train_subjects: List[int] = []
        self.test_subjects: List[int] = []
        self.all_subjects: List[int] = []

        self._load_datasets()

    def _load_datasets(self):
        """Loads and sanitizes train and test CSV files."""
        if not self.train_path.exists():
            raise FileNotFoundError(f"Training dataset not found at {self.train_path}")
        if not self.test_path.exists():
            raise FileNotFoundError(f"Testing dataset not found at {self.test_path}")

        print(f"[DatasetService] Loading train dataset from {self.train_path}...")
        self.train_df = pd.read_csv(self.train_path)
        self.train_df = self.train_df.loc[:, ~self.train_df.columns.str.startswith("Unnamed:")]

        print(f"[DatasetService] Loading test dataset from {self.test_path}...")
        self.test_df = pd.read_csv(self.test_path)
        self.test_df = self.test_df.loc[:, ~self.test_df.columns.str.startswith("Unnamed:")]

        # Determine non-feature columns
        non_feature_cols = {"subject", "Activity"}
        all_cols = self.train_df.columns.tolist()
        self.features = [c for c in all_cols if c not in non_feature_cols]

        self.activities = sorted(self.train_df["Activity"].dropna().unique().tolist())
        self.train_subjects = sorted([int(s) for s in self.train_df["subject"].unique().tolist()])
        self.test_subjects = sorted([int(s) for s in self.test_df["subject"].unique().tolist()])
        self.all_subjects = sorted(list(set(self.train_subjects + self.test_subjects)))

        print(f"[DatasetService] Loaded: Train={self.train_df.shape}, Test={self.test_df.shape}, Features={len(self.features)}")

    def get_dashboard_stats(self) -> Dict:
        """Returns consolidated dataset and subject statistics."""
        train_counts = self.train_df["Activity"].value_counts().to_dict()
        test_counts = self.test_df["Activity"].value_counts().to_dict()

        return {
            "total_train_records": len(self.train_df),
            "total_test_records": len(self.test_df),
            "total_records": len(self.train_df) + len(self.test_df),
            "num_features": len(self.features),
            "num_activities": len(self.activities),
            "activities": self.activities,
            "train_subjects_count": len(self.train_subjects),
            "test_subjects_count": len(self.test_subjects),
            "total_participants": len(self.all_subjects),
            "train_subjects": self.train_subjects,
            "test_subjects": self.test_subjects,
            "train_activity_counts": train_counts,
            "test_activity_counts": test_counts,
            "dataset_info": {
                "name": "UCI Human Activity Recognition Using Smartphones",
                "sensor_features": 561,
                "sensors": ["3-axial Accelerometer", "3-axial Gyroscope"],
                "sampling_frequency_hz": 50,
                "states": self.activities,
                "limitation_note": "Dataset CSV represents pre-windowed feature vectors grouped by subject. Trial boundaries are not explicitly tagged in CSV, so transitions are modeled contiguously per subject sequence."
            }
        }

    def get_paginated_records(
        self,
        dataset_type: str = "train",
        page: int = 1,
        limit: int = 15,
        activity: Optional[str] = None,
        subject: Optional[int] = None,
        search: Optional[str] = None
    ) -> Dict:
        """
        Retrieves paginated dataset rows with subject, activity, and search filtering.
        To keep payloads responsive, displays subject, Activity, and the primary key sensor signals,
        plus an array of preview sensor features.
        """
        df = self.train_df if dataset_type.lower() == "train" else self.test_df
        filtered = df

        if activity and activity.strip() and activity.upper() != "ALL":
            filtered = filtered[filtered["Activity"] == activity.strip()]

        if subject is not None and subject != "" and str(subject).upper() != "ALL":
            try:
                subj_val = int(subject)
                filtered = filtered[filtered["subject"] == subj_val]
            except ValueError:
                pass

        if search and search.strip():
            term = search.strip().lower()
            # Search matches in Activity or subject
            subj_match = filtered["subject"].astype(str).str.contains(term)
            act_match = filtered["Activity"].str.lower().str.contains(term)
            filtered = filtered[subj_match | act_match]

        total_records = len(filtered)
        limit = max(1, min(limit, 100))
        total_pages = max(1, int(np.ceil(total_records / limit)))
        page = max(1, min(page, total_pages))

        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        page_slice = filtered.iloc[start_idx:end_idx]

        # Convert rows into serializable dicts
        # Keep subject and Activity first, followed by top 8 feature highlights
        key_cols = ["subject", "Activity"] + self.features[:8]
        records = []
        for idx, row in page_slice.iterrows():
            rec = {
                "row_id": int(idx),
                "subject": int(row["subject"]),
                "Activity": str(row["Activity"])
            }
            # Add preview features with rounded values
            for f in self.features[:8]:
                val = row[f]
                rec[f] = round(float(val), 5) if pd.notnull(val) else 0.0
            records.append(rec)

        return {
            "dataset_type": dataset_type,
            "page": page,
            "limit": limit,
            "total_records": total_records,
            "total_pages": total_pages,
            "available_columns": key_cols,
            "total_features_count": len(self.features),
            "records": records,
            "filter_applied": {
                "activity": activity or "ALL",
                "subject": subject or "ALL",
                "search": search or ""
            }
        }

    def get_activity_distribution(self) -> Dict:
        """Returns structured activity counts across train, test, and overall."""
        train_counts = self.train_df["Activity"].value_counts().to_dict()
        test_counts = self.test_df["Activity"].value_counts().to_dict()

        distribution = []
        for act in self.activities:
            tr = int(train_counts.get(act, 0))
            te = int(test_counts.get(act, 0))
            tot = tr + te
            distribution.append({
                "activity": act,
                "train_count": tr,
                "test_count": te,
                "total_count": tot,
                "train_percentage": round((tr / len(self.train_df)) * 100, 2) if len(self.train_df) else 0,
                "test_percentage": round((te / len(self.test_df)) * 100, 2) if len(self.test_df) else 0
            })

        return {
            "activities": self.activities,
            "distribution": distribution,
            "total_train": len(self.train_df),
            "total_test": len(self.test_df),
            "total_overall": len(self.train_df) + len(self.test_df)
        }
