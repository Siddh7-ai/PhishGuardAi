const scanBtn = document.getElementById("scanBtn");
const currentUrlEl = document.getElementById("currentUrl");
const loadingEl = document.getElementById("loading");
const resultEl = document.getElementById("result");

const labelEl = document.getElementById("label");
const confidenceEl = document.getElementById("confidence");
const riskEl = document.getElementById("risk");

const explanationsSection = document.getElementById("explanationsSection");
const explanationsList = document.getElementById("explanations");

let currentUrl = "";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) {
    currentUrl = tabs[0].url;
    currentUrlEl.innerText = currentUrl;
  }
});

scanBtn.addEventListener("click", async () => {
  if (!currentUrl) return;

  scanBtn.disabled = true;
  loadingEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
  explanationsSection.classList.add("hidden");
  explanationsList.innerHTML = "";

  try {
    const response = await fetch("http://localhost:5000/check_url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: currentUrl })
    });

    const data = await response.json();

    labelEl.innerText = data.prediction;
    confidenceEl.innerText = data.confidence;
    riskEl.innerText = data.risk;

    if (data.explanations && data.explanations.length > 0) {
      data.explanations.forEach(reason => {
        const li = document.createElement("li");
        li.innerText = reason;
        explanationsList.appendChild(li);
      });
      explanationsSection.classList.remove("hidden");
    }

    resultEl.classList.remove("hidden");

  } catch (err) {
    labelEl.innerText = "Error";
    confidenceEl.innerText = "—";
    riskEl.innerText = "Backend not reachable";
    resultEl.classList.remove("hidden");
  } finally {
    loadingEl.classList.add("hidden");
    scanBtn.disabled = false;
  }
});
