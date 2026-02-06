🛡️ PhishGuard AI — Phishing Website Detection System

PhishGuard AI is a complete, end-to-end phishing website detection system designed for academic evaluation, hackathons, and real-world demonstration.

The system combines Machine Learning, Explainable AI (XAI), a secure Flask backend, a modern web interface, and a browser extension to detect phishing websites with clarity and confidence.

🚨 Problem Statement

Phishing websites imitate trusted platforms to steal:

Login credentials

Banking and financial details

Personal and sensitive information

Due to increasingly sophisticated URL structures, most users cannot reliably distinguish phishing websites from legitimate ones.

Even one false negative (missing a phishing site) can lead to serious damage.

✅ Solution Overview

PhishGuard AI addresses this problem by providing:

Machine-learning-based phishing detection

Security-first decision logic (high recall)

Human-readable explanations for every prediction

Multiple interfaces:

Web application

Browser extension (real-world usage)

🧠 System Architecture
User (Browser / Extension)
        ↓
Frontend / Browser Extension
        ↓  REST API
Flask Backend
        ↓
ML Model (Scikit-learn)

End-to-End Flow

User provides or visits a website URL

URL is sent to the Flask backend

URL features are extracted

ML model predicts phishing probability

Explainable risk factors are generated

Result is returned with confidence and risk level

✨ Core Features (Phase-Wise)
🔹 Phase 1 — Feature Engineering

Security-oriented URL features were introduced to improve detection accuracy.

Features used:

URL length

Number of dots (subdomains)

Presence of @ symbol

Presence of hyphens (-)

IP address instead of domain

HTTPS usage

Phishing-related keywords

Digit count

Special character count

Subdomain depth

Binary suspicious keyword indicator

✔ Improves pattern recognition
✔ Backward-compatible
✔ Deterministic feature extraction

🔹 Phase 2 — Dataset & Model Intelligence

This phase focused on model reliability and academic strength.

Enhancements:

Dataset cleaning (duplicates, invalid entries removed)

Dataset balancing to avoid class bias

Multi-model training:

Logistic Regression

Random Forest

Gradient Boosting

Evaluation using:

Accuracy

Precision

Recall

F1-Score

Automatic best-model selection based on F1-Score

✔ Scientifically justified model choice
✔ Security-oriented evaluation

🔹 Phase 3 — Explainable AI, Backend & UX

This phase transformed the model into a usable security system.

Key features:

Explainable AI (why a URL is risky)

Confidence-based classification:

SAFE

SUSPICIOUS

PHISHING

Risk levels:

Low

Medium

High

Scan history logging (scan_history.csv)

Secure Flask backend with:

Input validation

Health-check endpoint

Error handling

CORS support

Improved frontend UX:

Loading indicators

Disabled buttons during scans

Keyboard support

Clear visual status indicators

✔ Transparent
✔ User-friendly
✔ Demo-ready

🔹 Phase 4 — Browser Extension (Real-World Deployment)

Phase 4 introduced real-world usability through a browser extension.

Browser Extension Capabilities:

Automatically reads the current website URL

One-click phishing scan

Displays:

Classification

Confidence score

Risk level

Explainable risk factors

Uses the same backend and ML model

No ML logic inside the extension

New files added:

extension/
├── manifest.json
├── popup.html
├── popup.js
└── style.css


✔ No retraining required
✔ Existing web app remains unchanged
✔ Clean separation of concerns

🤖 Machine Learning Details

Algorithm: Random Forest Classifier

Library: Scikit-learn

Probability-based predictions (predict_proba)

Recall prioritized over accuracy

In cybersecurity, missing an attack is worse than raising a warning.

🧠 Explainable AI (XAI)

For every scan, the system explains why a URL is risky.

Example explanations:

URL is unusually long

Multiple subdomains detected

Suspicious keyword found

Website does not use HTTPS

IP address used instead of domain

✔ Builds trust
✔ Easy to defend during evaluation

📊 Logging & Monitoring

All scans are logged in:

logs/scan_history.csv


Logged data includes:

Timestamp

URL

Prediction label

Confidence

Risk level

⚠️ Logs are not used for automatic training.
They are intended for auditing, analysis, and future controlled improvement.

📁 Project Structure
phishing_detection_system/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   └── app.py
├── ai/
│   ├── train_model.py
│   └── features.py
├── data/
│   └── sample_urls.csv
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── style.css
├── logs/
│   └── scan_history.csv
├── requirements.txt
└── README.md

⚙️ Setup & Execution
1️⃣ Install Dependencies
pip install -r requirements.txt

2️⃣ Train the Model
python ai/train_model.py

3️⃣ Run Backend
python backend/app.py


Backend runs at:

http://127.0.0.1:5000

4️⃣ Run Web App

Open:

frontend/index.html

5️⃣ Load Browser Extension

Open chrome://extensions/

Enable Developer Mode

Click Load unpacked

Select the extension/ folder