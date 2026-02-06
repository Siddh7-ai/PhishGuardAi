# === ai/train_model.py ===
"""
train_model.py
---------------
PHASE 2:
- Dataset cleaning & balancing
- Multi-model training and evaluation
- Automatic best-model selection (F1-score)
- Save ONLY the best model
"""

import os
import sys
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

DATA_PATH = os.path.join(BASE_DIR, "data", "sample_urls.csv")
MODEL_OUTPUT_PATH = os.path.join(BASE_DIR, "model", "phishing_model.pkl")

from ai.features import extract_features


def load_and_clean_dataset(csv_path: str):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at: {csv_path}")

    df = pd.read_csv(csv_path)

    if "url" not in df.columns or "label" not in df.columns:
        raise ValueError("CSV must contain 'url' and 'label' columns")

    print("\n=== DATASET STATS (BEFORE CLEANING) ===")
    print(df["label"].value_counts())

    df = df.dropna(subset=["url", "label"])
    df["url"] = df["url"].astype(str)
    df = df.drop_duplicates(subset=["url"])

    features = []
    labels = []

    for _, row in df.iterrows():
        try:
            feats = extract_features(row["url"])
            features.append(feats)
            labels.append(int(row["label"]))
        except Exception:
            continue

    X = np.array(features)
    y = np.array(labels)

    print("\n=== DATASET STATS (AFTER CLEANING) ===")
    unique, counts = np.unique(y, return_counts=True)
    for cls, cnt in zip(unique, counts):
        print(f"Class {cls}: {cnt}")

    return X, y


def balance_dataset(X, y, random_state=42):
    classes, counts = np.unique(y, return_counts=True)
    min_count = counts.min()

    rng = np.random.default_rng(random_state)
    indices = []

    for cls in classes:
        cls_idx = np.where(y == cls)[0]
        selected = rng.choice(cls_idx, min_count, replace=False)
        indices.extend(selected)

    rng.shuffle(indices)
    return X[indices], y[indices]


def train_and_evaluate_models(X_train, X_test, y_train, y_test):
    models = {
        "LogisticRegression": LogisticRegression(
            max_iter=1000,
            solver="lbfgs",
            random_state=42
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=300,
            random_state=42,
            class_weight="balanced"
        ),
        "GradientBoosting": GradientBoostingClassifier(
            random_state=42
        )
    }

    results = {}

    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        results[name] = {
            "model": model,
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "f1": f1_score(y_test, y_pred)
        }

        print(f"\n=== {name} ===")
        print(f"Accuracy : {results[name]['accuracy']:.4f}")
        print(f"Precision: {results[name]['precision']:.4f}")
        print(f"Recall   : {results[name]['recall']:.4f}")
        print(f"F1-Score : {results[name]['f1']:.4f}")

    return results


def select_best_model(results: dict):
    best_name = max(results, key=lambda k: results[k]["f1"])
    best_model = results[best_name]["model"]

    if not hasattr(best_model, "predict_proba"):
        raise RuntimeError("Selected model does not support predict_proba()")

    print(f"\n[✓] Best Model Selected: {best_name}")
    return best_model


def main():
    print("[+] Loading and cleaning dataset...")
    X, y = load_and_clean_dataset(DATA_PATH)

    print("[+] Balancing dataset...")
    X, y = balance_dataset(X, y)

    print("[+] Splitting train/test data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    print("[+] Training and evaluating models...")
    results = train_and_evaluate_models(X_train, X_test, y_train, y_test)

    best_model = select_best_model(results)

    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)

    print("[+] Saving best model...")
    joblib.dump(best_model, MODEL_OUTPUT_PATH)

    print(f"[✓] Model saved to: {MODEL_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
