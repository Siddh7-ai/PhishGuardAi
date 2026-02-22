// Popup Logic - Display Backend Results Only
// NO local calculations, NO thresholds, NO ML logic
// FIXED: Threat Score label, radius 80, Math.round confidence

(function() {
  'use strict';

  console.log('🛡️ Popup script loaded');

  let currentResult = null;
  let currentTipIndex = 0;
  let tipInterval = null;

  function init() {
    setupEventListeners();
    initializeStats();
    startTipsCarousel();
  }

  function setupEventListeners() {
    const scanBtn = document.getElementById('scan-btn');
    const rescanBtn = document.getElementById('rescan-btn');
    if (scanBtn) scanBtn.addEventListener('click', handleScan);
    if (rescanBtn) rescanBtn.addEventListener('click', handleRescan);
  }

  async function initializeStats() {
    try {
      const result = await chrome.storage.local.get(['stats']);
      const stats = result.stats || {
        scansToday: 0,
        threatsBlocked: 0,
        lastReset: new Date().toDateString()
      };
      const today = new Date().toDateString();
      if (stats.lastReset !== today) {
        stats.scansToday = 0;
        stats.lastReset = today;
        await chrome.storage.local.set({ stats });
      }
      updateStatsDisplay(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  function updateStatsDisplay(stats) {
    const scansEl = document.getElementById('scans-today');
    const threatsEl = document.getElementById('threats-blocked');
    const uptimeEl = document.getElementById('uptime');
    if (scansEl) scansEl.textContent = stats.scansToday || 0;
    if (threatsEl) threatsEl.textContent = stats.threatsBlocked || 0;
    if (uptimeEl) uptimeEl.textContent = '100%';
  }

  async function incrementScanCount() {
    try {
      const result = await chrome.storage.local.get(['stats']);
      const stats = result.stats || { scansToday: 0, threatsBlocked: 0, lastReset: new Date().toDateString() };
      stats.scansToday++;
      await chrome.storage.local.set({ stats });
      updateStatsDisplay(stats);
    } catch (error) {
      console.error('Error updating scan count:', error);
    }
  }

  async function incrementThreatCount() {
    try {
      const result = await chrome.storage.local.get(['stats']);
      const stats = result.stats || { scansToday: 0, threatsBlocked: 0, lastReset: new Date().toDateString() };
      stats.threatsBlocked++;
      await chrome.storage.local.set({ stats });
      updateStatsDisplay(stats);
    } catch (error) {
      console.error('Error updating threat count:', error);
    }
  }

  function startTipsCarousel() {
    const tips = document.querySelectorAll('.tip-text');
    const dots = document.querySelectorAll('.tip-dot');
    if (tips.length === 0) return;
    tipInterval = setInterval(() => {
      currentTipIndex = (currentTipIndex + 1) % tips.length;
      showTip(currentTipIndex);
    }, 5000);
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentTipIndex = index;
        showTip(currentTipIndex);
        clearInterval(tipInterval);
        tipInterval = setInterval(() => {
          currentTipIndex = (currentTipIndex + 1) % tips.length;
          showTip(currentTipIndex);
        }, 5000);
      });
    });
  }

  function showTip(index) {
    document.querySelectorAll('.tip-text').forEach((tip, i) => {
      tip.classList.toggle('active', i === index);
    });
    document.querySelectorAll('.tip-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  async function handleScan() {
    console.log('🔍 Scan button clicked');
    showLoading();
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) { showError('Unable to get current tab URL'); return; }
      const url = tab.url;
      const loadingUrlEl = document.getElementById('loading-url');
      if (loadingUrlEl) loadingUrlEl.textContent = url;
      console.log('Sending scan request for:', url);
      chrome.runtime.sendMessage({ type: 'SCAN_CURRENT_TAB' }, (response) => {
        console.log('Received response:', response);
        if (chrome.runtime.lastError) { showError(chrome.runtime.lastError.message); return; }
        if (!response) { showError('No response from extension'); return; }
        if (response.error) { showError(response.error); return; }
        incrementScanCount();
        if (response.result && response.result.classification === 'Phishing') incrementThreatCount();
        console.log('Displaying result:', response.result);
        displayResult(response.result);
      });
    } catch (error) {
      console.error('Scan error:', error);
      showError(error.message);
    }
  }

  async function handleRescan() {
    chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, () => { handleScan(); });
  }

  function displayResult(result) {
    currentResult = result;
    document.getElementById('loading-container').classList.remove('active');
    document.getElementById('result-container').classList.add('active');
    document.querySelector('.scan-section').style.display = 'none';
    document.getElementById('info-section').style.display = 'none';

    const classification = result.classification;
    const confidence = result.confidence || 0;

    console.log('Backend result:', { classification, confidence });

    updateTheme(classification);
    updateResultHeader(classification, confidence);
    updateConfidenceChart(classification, confidence);
    updateMetrics(result);
  }

  function updateTheme(classification) {
    document.body.classList.remove('safe', 'phishing', 'warning');
    if (classification === 'Phishing') document.body.classList.add('phishing');
    else if (classification === 'Suspicious') document.body.classList.add('warning');
    else document.body.classList.add('safe');
  }

  function updateResultHeader(classification, confidence) {
    const icon = document.getElementById('result-icon');
    const title = document.getElementById('result-title');
    const subtitle = document.getElementById('result-subtitle');
    if (classification === 'Phishing') {
      icon.textContent = '🚫';
      title.textContent = 'Phishing Detected';
      title.className = 'result-title danger';
      subtitle.textContent = 'This website is attempting to steal your data';
    } else if (classification === 'Suspicious') {
      icon.textContent = '⚠️';
      title.textContent = 'Suspicious Website';
      title.className = 'result-title warning';
      subtitle.textContent = 'Exercise caution when interacting with this site';
    } else {
      icon.textContent = '✅';
      title.textContent = 'Website Appears Safe';
      title.className = 'result-title safe';
      subtitle.textContent = 'No immediate threats detected';
    }
  }

  function updateConfidenceChart(classification, confidence) {
    const circle = document.getElementById('confidence-circle');
    const valueEl = document.getElementById('confidence-value');

    circle.classList.remove('safe', 'danger', 'warning');
    valueEl.classList.remove('safe', 'danger', 'warning');

    if (classification === 'Phishing') {
      circle.classList.add('danger');
      valueEl.classList.add('danger');
    } else if (classification === 'Suspicious') {
      circle.classList.add('warning');
      valueEl.classList.add('warning');
    } else {
      circle.classList.add('safe');
      valueEl.classList.add('safe');
    }

    // ✅ FIX: No decimals
    valueEl.textContent = Math.round(confidence) + '%';

    // ✅ FIX: radius is now 80 (matches popup.html SVG)
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (confidence / 100) * circumference;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    setTimeout(() => {
      circle.style.strokeDashoffset = offset;
    }, 100);
  }

  function updateMetrics(result) {
    const metricsBox = document.getElementById('metrics-box');
    metricsBox.innerHTML = '';

    addMetricSection(metricsBox, 'Detection Results');
    addMetric(metricsBox, 'Classification', result.classification, getClassColor(result.classification));
    // ✅ FIX: renamed to "Threat Score", no decimals
    addMetric(metricsBox, 'Threat Score', Math.round(result.confidence) + '%', 'normal');
    addMetric(metricsBox, 'Risk Level', (result.risk_level || 'low').toUpperCase(), getRiskColor(result.risk_level));

    if (result.modules) {
      addMetricSection(metricsBox, 'Module Scores');
      const m = result.modules;
      if (m.ml !== undefined)         addMetric(metricsBox, 'ML Model',    Math.round(m.ml)         + '%', 'normal');
      if (m.lexical !== undefined)    addMetric(metricsBox, 'Lexical',     Math.round(m.lexical)    + '%', 'normal');
      if (m.reputation !== undefined) addMetric(metricsBox, 'Reputation',  Math.round(m.reputation) + '%', 'normal');
      if (m.behavior !== undefined)   addMetric(metricsBox, 'Behavior',    Math.round(m.behavior)   + '%', 'normal');
      if (m.nlp !== undefined)        addMetric(metricsBox, 'NLP',         Math.round(m.nlp)        + '%', 'normal');
    }

    addMetricSection(metricsBox, 'Metadata');
    addMetric(metricsBox, 'Model', result.model || 'Unknown', 'normal');
    addMetric(metricsBox, 'Timestamp', formatTimestamp(result.timestamp), 'normal');
    if (result.whitelisted) addMetric(metricsBox, 'Status', 'Whitelisted', 'good');
    if (result.error) addMetric(metricsBox, 'Error', result.errorMessage || 'API Error', 'bad');
  }

  function addMetricSection(container, title) {
    const header = document.createElement('div');
    header.className = 'metric-section-header';
    header.textContent = title;
    container.appendChild(header);
  }

  function addMetric(container, label, value, colorClass) {
    const row = document.createElement('div');
    row.className = 'metric-item';
    const labelEl = document.createElement('span');
    labelEl.className = 'metric-label';
    labelEl.textContent = label;
    const valueEl = document.createElement('span');
    valueEl.className = `metric-value ${colorClass}`;
    valueEl.textContent = value;
    row.appendChild(labelEl);
    row.appendChild(valueEl);
    container.appendChild(row);
  }

  function getClassColor(classification) {
    if (classification === 'Phishing') return 'bad';
    if (classification === 'Suspicious') return 'warning';
    return 'good';
  }

  function getRiskColor(riskLevel) {
    if (riskLevel === 'high') return 'bad';
    if (riskLevel === 'medium') return 'warning';
    return 'good';
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      // Backend returns UTC time. Ensure it's parsed as UTC by appending Z if missing.
      let ts = timestamp;
      if (typeof ts === 'string' && !ts.endsWith('Z') && !ts.includes('+')) {
        ts = ts + 'Z'; // force UTC interpretation
      }
      return new Date(ts).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
    } catch { return 'N/A'; }
  }

  function showLoading() {
    document.querySelector('.scan-section').style.display = 'none';
    document.getElementById('info-section').style.display = 'none';
    document.getElementById('result-container').classList.remove('active');
    document.getElementById('loading-container').classList.add('active');
  }

  function showError(message) {
    document.getElementById('loading-container').classList.remove('active');
    document.querySelector('.scan-section').style.display = 'block';
    document.getElementById('info-section').style.display = 'block';
    alert('Error: ' + message);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('beforeunload', () => {
    if (tipInterval) clearInterval(tipInterval);
  });

})();
