// blocked_page.js - reads lastDetection from storage and wires buttons

document.addEventListener('DOMContentLoaded', async () => {

  const blockedUrlEl     = document.getElementById('blocked-url');
  const riskLevelEl      = document.getElementById('risk-level');
  const confidenceEl     = document.getElementById('confidence');
  const classificationEl = document.getElementById('classification');
  const timestampEl      = document.getElementById('timestamp');
  const goBackBtn        = document.getElementById('go-back');
  const proceedBtn       = document.getElementById('proceed');

  let originalUrl = null;

  // ── Load detection data ──────────────────────────────────────────────────
  try {
    const data = await chrome.storage.local.get('lastDetection');
    const d = data.lastDetection;

    if (d) {
      originalUrl = d.originalUrl || d.url || null;

      if (blockedUrlEl) {
        blockedUrlEl.textContent = originalUrl || 'Unknown URL';
        blockedUrlEl.title = originalUrl || '';
      }
      if (riskLevelEl && d.risk_level)
        riskLevelEl.textContent = d.risk_level.toUpperCase();
      if (confidenceEl && d.confidence != null)
        confidenceEl.textContent = Number(d.confidence).toFixed(2) + '%';
      if (classificationEl && d.classification)
        classificationEl.textContent = d.classification;
      if (timestampEl && d.timestamp) {
        // d.timestamp is always epoch ms (Date.now()) from navigation_guard
        const date = new Date(d.timestamp);
        timestampEl.textContent = date.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false
        });
      }
    } else {
      if (blockedUrlEl) blockedUrlEl.textContent = 'URL unavailable';
    }
  } catch (err) {
    console.error('PhishGuard: failed to load detection data', err);
    if (blockedUrlEl) blockedUrlEl.textContent = 'Error loading URL';
  }

  // ── Helper: navigate tab to a URL ────────────────────────────────────────
  async function navigateTo(url) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) await chrome.tabs.update(tab.id, { url });
      else window.location.href = url;
    } catch (_) {
      window.location.href = url;
    }
  }

  // ── Go Back to Safety ────────────────────────────────────────────────────
  if (goBackBtn) {
    goBackBtn.addEventListener('click', async () => {
      const ok = window.confirm(
        '🛡️ Going back to safety!\n\n' +
        '📌 You will be redirected to Google homepage.\n\n' +
        'Click OK to continue.'
      );
      if (ok) await navigateTo('https://www.google.com');
    });
  }

  // ── Ignore Warning / Proceed ─────────────────────────────────────────────
  if (proceedBtn) {
    proceedBtn.addEventListener('click', async () => {
      if (!originalUrl) { alert('Original URL unavailable.'); return; }

      const confirmed = window.confirm(
        '⚠️ DANGER: This site was flagged as PHISHING.\n\n' +
        'Proceeding may expose you to:\n' +
        '  • Password / credential theft\n' +
        '  • Financial fraud\n' +
        '  • Malware installation\n\n' +
        'Are you absolutely sure you want to continue?\n\n' +
        '📌 Note: This bypass only lasts for this tab.\n' +
        'If you close and reopen this tab, the site will be blocked again.'
      );

      if (!confirmed) return;

      try {
        await chrome.storage.local.remove('lastDetection');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          // Register bypass first, then navigate
          await chrome.runtime.sendMessage({
            type: 'ALLOW_URL_FOR_TAB',
            tabId: tab.id,
            url: originalUrl
          });
          await chrome.tabs.update(tab.id, { url: originalUrl });
        } else {
          window.location.href = originalUrl;
        }
      } catch (err) {
        console.error('Proceed error:', err);
        window.location.href = originalUrl;
      }
    });
  }

});
