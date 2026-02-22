// Configuration - Whitelist Only

const CONFIG = {
  // Backend API endpoint - supports both development and production
  API_URL: (() => {
    // Development environment
    if (chrome.runtime.getURL('').includes('extension')) {
      // Local development
      return 'https://phishguardai-nnez.onrender.com/api/scan';
    }
    // Production - use environment or fallback to deployed URL
    return process.env.REACT_APP_API_URL || 'https://phishing-detection-api.onrender.com/api/scan';
  })(),
  
  // Cache duration (15 minutes)
  CACHE_TTL_MS: 15 * 60 * 1000,
  
  // Request timeout
  REQUEST_TIMEOUT_MS: 10000,
  
  // Whitelist - Skip API calls for these domains
  WHITELIST: [
    // Development
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    
    // Indian Universities
    'charusat.edu.in',
    'charusat.ac.in',
    'iitb.ac.in',
    'iitd.ac.in',
    'iitm.ac.in',
    'iitk.ac.in',
    'iisc.ac.in',
    'bits-pilani.ac.in',
    'dtu.ac.in',
    'vit.ac.in',
    
    // Indian Government
    'india.gov.in',
    'mygov.in',
    'uidai.gov.in',
    'incometax.gov.in',
    'rbi.org.in',
    'irctc.co.in',
    
    // Indian Banks
    'sbi.co.in',
    'hdfcbank.com',
    'icicibank.com',
    'axisbank.com',
    
    // Global Tech
    'google.com',
    'youtube.com',
    'github.com',
    'microsoft.com',
    'apple.com',
    'amazon.com',
    'facebook.com',
    'twitter.com',
    'linkedin.com',
    'instagram.com',
    'wikipedia.org',
    'cloudflare.com',
    'mozilla.org',
    'vercel.app',
    'onrender.com'
  ]
};

// Export for ES modules
export default CONFIG;