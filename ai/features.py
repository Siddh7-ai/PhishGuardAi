# === ai/features.py ===
"""
features.py
------------
URL feature extraction logic for Phishing Website Detection System.

This module converts a raw URL into a numerical feature vector
used by the Machine Learning model.

Focus:
- Deterministic feature extraction
- Security-oriented signals
- Backward-compatible feature ordering
"""

import re
from urllib.parse import urlparse


PHISHING_KEYWORDS = [
    "login",
    "verify",
    "secure",
    "account",
    "bank",
    "update",
]


SPECIAL_CHARS_PATTERN = re.compile(r"[^a-zA-Z0-9]")


def has_ip_address(url: str) -> int:
    ip_pattern = r"(?:\d{1,3}\.){3}\d{1,3}"
    return 1 if re.search(ip_pattern, url) else 0


def count_phishing_keywords(url: str) -> int:
    url_lower = url.lower()
    return sum(1 for keyword in PHISHING_KEYWORDS if keyword in url_lower)


def has_suspicious_keyword(url: str) -> int:
    url_lower = url.lower()
    return 1 if any(keyword in url_lower for keyword in PHISHING_KEYWORDS) else 0


def extract_features(url: str) -> list:
    """
    Extract numerical features from a URL.

    Feature order is FIXED and must match training & inference.

    Features:
    1. URL length
    2. Number of dots
    3. Presence of '@'
    4. Presence of '-'
    5. Presence of IP address
    6. HTTPS usage
    7. Count of phishing keywords
    8. Count of digits in URL
    9. Count of special characters
    10. Number of subdomains
    11. Presence of suspicious keyword (binary)
    """

    parsed = urlparse(url)
    netloc = parsed.netloc.lower()

    features = []

    # 1. URL length
    features.append(len(url))

    # 2. Number of dots
    features.append(url.count("."))

    # 3. Presence of '@'
    features.append(1 if "@" in url else 0)

    # 4. Presence of '-'
    features.append(1 if "-" in url else 0)

    # 5. IP address usage
    features.append(has_ip_address(url))

    # 6. HTTPS usage
    features.append(1 if parsed.scheme == "https" else 0)

    # 7. Phishing keyword count
    features.append(count_phishing_keywords(url))

    # 8. Count of digits
    features.append(sum(char.isdigit() for char in url))

    # 9. Count of special characters
    features.append(len(SPECIAL_CHARS_PATTERN.findall(url)))

    # 10. Number of subdomains
    if netloc:
        parts = netloc.split(".")
        features.append(max(len(parts) - 2, 0))
    else:
        features.append(0)

    # 11. Suspicious keyword presence (binary)
    features.append(has_suspicious_keyword(url))

    return features


def explain_features(url: str) -> list:
    explanations = []
    parsed = urlparse(url)
    url_lower = url.lower()

    if len(url) > 75:
        explanations.append("URL is unusually long")

    if url.count(".") > 3:
        explanations.append("Multiple subdomains detected")

    if "@" in url:
        explanations.append("URL contains '@' symbol")

    if "-" in parsed.netloc:
        explanations.append("Hyphenated domain name")

    if has_ip_address(url):
        explanations.append("IP address used instead of domain name")

    if parsed.scheme != "https":
        explanations.append("Website does not use HTTPS")

    for keyword in PHISHING_KEYWORDS:
        if keyword in url_lower:
            explanations.append(f"Suspicious keyword detected: '{keyword}'")

    return explanations
