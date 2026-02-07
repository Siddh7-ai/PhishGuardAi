// === frontend/script.js ===
// FINAL FIXED VERSION (PHASE 3 – SYNCED WITH BACKEND)
//
// Features:
// - Loading animation
// - Button disabling
// - URL validation
// - Risk level & phishing probability display (FIXED)
// - Explainable AI output (risk factors)
// - Keyboard UX (Enter key support)

// ------------------------------------------------------------------
// DOM ELEMENTS
// ------------------------------------------------------------------
const scanBtn = document.getElementById("scanBtn");
const urlInput = document.getElementById("urlInput");
const loadingDiv = document.getElementById("loading");
const resultCard = document.getElementById("resultCard");
const statusDiv = document.getElementById("status");
const confidenceValue = document.getElementById("confidenceValue");
const riskLevelSpan = document.getElementById("riskLevel");
const riskFactorsList = document.getElementById("riskFactors");

// ------------------------------------------------------------------
// BACKEND API
// ------------------------------------------------------------------
const API_URL = "http://127.0.0.1:5000/check_url";

// ------------------------------------------------------------------
// UI UTILITIES
// ------------------------------------------------------------------
function resetUI() {
    resultCard.classList.add("hidden");
    riskFactorsList.innerHTML = "";
}

function setButtonState(isLoading) {
    scanBtn.disabled = isLoading;
    scanBtn.innerText = isLoading ? "Scanning..." : "Scan";
}

// Basic URL validation
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// ------------------------------------------------------------------
// UPDATE RESULT UI (FIXED)
// ------------------------------------------------------------------
function updateResult(data) {
    resultCard.classList.remove("hidden");

    // ----------------------------
    // STATUS LABEL
    // ----------------------------
    statusDiv.className = "status";
    statusDiv.textContent = data.label;

    if (data.label === "LEGITIMATE") {
        statusDiv.classList.add("safe");
    } else if (data.label === "SUSPICIOUS") {
        statusDiv.classList.add("suspicious");
    } else {
        statusDiv.classList.add("phishing");
    }

    // ----------------------------
    // PHISHING PROBABILITY (FIXED)
    // ----------------------------
    const probability = Number(data.phishing_probability);

    confidenceValue.textContent = isNaN(probability)
        ? "N/A"
        : `${probability.toFixed(2)}%`;

    // ----------------------------
    // RISK LEVEL
    // ----------------------------
    riskLevelSpan.textContent = data.risk_level;

    // ----------------------------
    // EXPLAINABLE AI OUTPUT
    // ----------------------------
    if (!data.risk_factors || data.risk_factors.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No significant phishing indicators detected.";
        riskFactorsList.appendChild(li);
    } else {
        data.risk_factors.forEach(factor => {
            const li = document.createElement("li");
            li.textContent = factor;
            riskFactorsList.appendChild(li);
        });
    }
}

// ------------------------------------------------------------------
// SCAN BUTTON HANDLER
// ------------------------------------------------------------------
scanBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    resetUI();

    // Input validation
    if (!url) {
        alert("Please enter a website URL.");
        return;
    }

    if (!isValidURL(url)) {
        alert("Invalid URL format. Please include http:// or https://");
        return;
    }

    // UI loading state
    loadingDiv.classList.remove("hidden");
    setButtonState(true);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error("Server error while scanning URL");
        }

        const data = await response.json();
        updateResult(data);

    } catch (error) {
        alert("Error: Unable to scan the website. Please ensure backend is running.");
        console.error(error);
    } finally {
        loadingDiv.classList.add("hidden");
        setButtonState(false);
    }
});

// ------------------------------------------------------------------
// UX ENHANCEMENT: ENTER KEY SUPPORT
// ------------------------------------------------------------------
urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        scanBtn.click();
    }
});
