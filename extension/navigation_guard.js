// Navigation Guard - Scan all URLs, but never block trusted domains

import apiClient from './api_client.js';
import CONFIG from './config.js';

class NavigationGuard {
  constructor() {
    this.scanningUrls = new Set();
    this.blockedTabs  = new Set();
    this.tabAllowlist = new Map();
  }

  // Check if URL belongs to a trusted domain (exact or subdomain match)
  isTrusted(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
      return CONFIG.TRUSTED_DOMAINS.some(trusted =>
        hostname === trusted || hostname.endsWith('.' + trusted)
      );
    } catch (_) {
      return false;
    }
  }

  init() {
    chrome.webNavigation.onBeforeNavigate.addListener(
      (details) => this.handleNavigation(details),
      { url: [{ schemes: ['http', 'https'] }] }
    );

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.tabAllowlist.delete(tabId);
      this.blockedTabs.delete(tabId);
    });

    console.log('✓ Navigation guard initialized');
  }

  allowUrlForTab(tabId, url) {
    if (!this.tabAllowlist.has(tabId)) {
      this.tabAllowlist.set(tabId, new Set());
    }
    this.tabAllowlist.get(tabId).add(url);
    console.log(`✅ Tab ${tabId} bypass: ${url}`);
  }

  async handleNavigation(details) {
    if (details.frameId !== 0) return;

    const { url, tabId } = details;

    if (!url.startsWith('http://') && !url.startsWith('https://')) return;

    // Skip if we just redirected this tab to blocked.html
    if (this.blockedTabs.has(tabId)) return;

    // Skip if user manually bypassed this URL for this tab
    const allowed = this.tabAllowlist.get(tabId);
    if (allowed && allowed.has(url)) {
      console.log(`✅ User bypass — skipping: ${url}`);
      return;
    }

    // Deduplicate concurrent scans for same tab+url
    const key = `${tabId}:${url}`;
    if (this.scanningUrls.has(key)) return;
    this.scanningUrls.add(key);

    try {
      // Always scan — popup needs real data regardless of trusted status
      const result = await apiClient.scanURL(url);
      console.log(`📊 ${result.classification} — ${url}`);

      if (result.classification === 'Phishing') {
        // Check trusted domain ONLY at blocking decision — never skip the scan itself
        if (this.isTrusted(url)) {
          console.log(`🛡️ Trusted domain — NOT blocking despite Phishing flag: ${url}`);
        } else {
          await this.blockTab(tabId, url, result);
        }
      }

    } catch (err) {
      console.error('✗ Scan error (fail open):', err);
    } finally {
      setTimeout(() => this.scanningUrls.delete(key), 5000);
    }
  }

  async blockTab(tabId, url, result) {
    try {
      this.blockedTabs.add(tabId);

      await chrome.storage.local.set({
        lastDetection: {
          originalUrl:    url,
          url:            url,
          classification: result.classification,
          confidence:     result.confidence  ?? 95,
          risk_level:     result.risk_level  ?? 'high',
          modules:        result.modules     || {},
          timestamp:      Date.now()
        }
      });

      const blockedPage = chrome.runtime.getURL('blocked.html');
      await chrome.tabs.update(tabId, { url: blockedPage });
      console.log('🚫 Blocked:', url);

    } catch (err) {
      console.error('✗ Block error:', err);
      this.blockedTabs.delete(tabId);
    } finally {
      setTimeout(() => this.blockedTabs.delete(tabId), 4000);
    }
  }
}

const navigationGuard = new NavigationGuard();
export default navigationGuard;
