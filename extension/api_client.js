// API Client - Scans ALL URLs so popup always gets real data
// Trusted domain blocking prevention is handled in navigation_guard.js

import CONFIG from './config.js';

class APIClient {
  constructor() {
    this.cache = new Map();
  }

  getCached(url) {
    const cached = this.cache.get(url);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CONFIG.CACHE_TTL_MS) {
      this.cache.delete(url);
      return null;
    }
    return cached.result;
  }

  setCached(url, result) {
    this.cache.set(url, { result, timestamp: Date.now() });
    if (this.cache.size > 100) this.cache.delete(this.cache.keys().next().value);
  }

  async _fetch(url, timeoutMs) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: ctrl.signal
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  }

  async scanURL(url) {
    // Skip only internal browser/extension pages — these can't be scanned
    try {
      const p = new URL(url).protocol;
      if (['chrome:', 'chrome-extension:', 'about:', 'file:'].includes(p)) {
        return { url, classification: 'Legitimate', confidence: 0, risk_level: 'low', skipped: true };
      }
    } catch (_) {}

    // Check cache
    const hit = this.getCached(url);
    if (hit) { console.log('⚡ Cache hit:', url); return hit; }

    // Scan with retry: 15s → 20s → 25s
    const timeouts = [15000, 20000, 25000];
    const delays   = [1000, 2000];
    let lastErr;

    for (let i = 0; i < timeouts.length; i++) {
      try {
        console.log(`🔍 Attempt ${i + 1}: ${url}`);
        const result = await this._fetch(url, timeouts[i]);
        this.setCached(url, result);
        return result;
      } catch (e) {
        lastErr = e;
        console.warn(`❌ Attempt ${i + 1} failed: ${e.message}`);
        if (i < delays.length) await new Promise(r => setTimeout(r, delays[i]));
      }
    }

    console.error('❌ All attempts failed:', url);
    return { url, classification: 'Error', confidence: 0, risk_level: 'unknown', error: true };
  }

  clearCache() { this.cache.clear(); }
}

const apiClient = new APIClient();
export default apiClient;
