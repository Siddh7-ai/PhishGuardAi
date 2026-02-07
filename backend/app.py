"""
app.py
-------
Flask REST API for Phishing Website Detection System.

FINAL FIXED VERSION (PHASE 3 – STABLE & JUDGE-READY)

Features:
- Secure PYTHONPATH handling
- CORS support
- Health check endpoint
- URL validation
- Feature extraction
- ML inference with predict_proba
- Probability-based classification (FIXED)
- Risk level mapping
- Explainable AI (risk factors)
- Scan history logging (CSV)
"""

import os
import sys
import csv
import joblib
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS

# ------------------------------------------------------------------
# PATH FIX (CRITICAL)
# ------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# ------------------------------------------------------------------
# IMPORTS
# ------------------------------------------------------------------

from ai.features import extract_features, explain_features

# ------------------------------------------------------------------
# APP INITIALIZATION
# ------------------------------------------------------------------

app = Flask(__name__)
CORS(app)

# ------------------------------------------------------------------
# MODEL & LOG PATHS
# ------------------------------------------------------------------

MODEL_PATH = os.path.join(BASE_DIR, "model", "phishing_model.pkl")
LOG_PATH = os.path.join(BASE_DIR, "logs", "scan_history.csv")

try:
    model = joblib.load(MODEL_PATH)
    print("[✓] ML model loaded successfully")
except Exception as e:
    print("[✗] Failed to load model:", e)
    model = None

# ------------------------------------------------------------------
# CONFIDENCE THRESHOLDS (PROBABILITY-BASED)
# ------------------------------------------------------------------

PHISHING_THRESHOLD = 0.60     # ≥ 60% → Phishing
SUSPICIOUS_THRESHOLD = 0.30   # 30–60% → Suspicious
# < 30% → Legitimate

# ------------------------------------------------------------------
# HELPER FUNCTIONS
# ------------------------------------------------------------------

def classify_by_confidence(confidence: float):
    """
    Final classification based ONLY on phishing probability.
    """
    if confidence >= PHISHING_THRESHOLD:
        return "PHISHING", "High"
    elif confidence >= SUSPICIOUS_THRESHOLD:
        return "SUSPICIOUS", "Medium"
    else:
        return "LEGITIMATE", "Low"


def log_scan(url: str, label: str, confidence: float, risk: str):
    """
    Append scan details to CSV history log.
    """
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    file_exists = os.path.exists(LOG_PATH)

    with open(LOG_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow([
                "timestamp",
                "url",
                "label",
                "phishing_probability",
                "risk_level"
            ])
        writer.writerow([
            datetime.utcnow().isoformat(),
            url,
            label,
            round(confidence * 100, 2),
            risk
        ])

# ------------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------------

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "running",
        "message": "Phishing Detection API is live"
    })


@app.route("/check_url", methods=["POST"])
def check_url():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.get_json(silent=True)

    if not data or "url" not in data:
        return jsonify({"error": "Invalid request. 'url' field missing."}), 400

    url = data["url"].strip()

    if not url.startswith(("http://", "https://")):
        return jsonify({"error": "URL must start with http:// or https://"}), 400

    try:
        # ----------------------------
        # Feature extraction
        # ----------------------------
        features = extract_features(url)

        # ----------------------------
        # ML Prediction
        # ----------------------------
        probabilities = model.predict_proba([features])[0]
        phishing_probability = float(probabilities[1])  # P(phishing)

        # ----------------------------
        # Classification (FIXED)
        # ----------------------------
        label, risk_level = classify_by_confidence(phishing_probability)

        # ----------------------------
        # Explainable AI
        # ----------------------------
        risk_factors = explain_features(url)

        # ----------------------------
        # Logging
        # ----------------------------
        log_scan(
            url=url,
            label=label,
            confidence=phishing_probability,
            risk=risk_level
        )

        return jsonify({
            "url": url,
            "label": label,
            "phishing_probability": round(phishing_probability * 100, 2),
            "risk_level": risk_level,
            "risk_factors": risk_factors
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to analyze URL",
            "details": str(e)
        }), 500

# ------------------------------------------------------------------
# ENTRY POINT
# ------------------------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
