// Configuration

const CONFIG = {
  API_URL: 'https://phishguardai-nnez.onrender.com/api/scan',

  CACHE_TTL_MS: 15 * 60 * 1000,

  REQUEST_TIMEOUT_MS: 15000,

  // Trusted domains — these are ALWAYS scanned normally so popup shows real info,
  // but they are NEVER blocked even if ML model says Phishing (false positive protection).
  TRUSTED_DOMAINS: [
    // Google
    'google.com', 'google.co.in', 'google.co.uk', 'google.com.au',
    'googleapis.com', 'gstatic.com', 'gmail.com', 'googlemail.com',
    'googlevideo.com', 'googleusercontent.com',
    // YouTube
    'youtube.com', 'youtu.be', 'ytimg.com', 'youtube-nocookie.com',
    // Microsoft
    'microsoft.com', 'microsoftonline.com', 'live.com', 'outlook.com',
    'office.com', 'office365.com', 'sharepoint.com', 'bing.com',
    'msn.com', 'skype.com', 'azure.com', 'azurewebsites.net',
    'windows.com', 'xbox.com', 'onedrive.com',
    // Apple
    'apple.com', 'icloud.com', 'itunes.com',
    // Meta / Facebook
    'facebook.com', 'fb.com', 'instagram.com', 'whatsapp.com',
    'fbcdn.net', 'messenger.com',
    // Amazon / AWS
    'amazon.com', 'amazon.in', 'amazon.co.uk', 'amazonaws.com', 'awsstatic.com',
    // Government India
    'gov.in', 'nic.in', 'gujarat.gov.in', 'india.gov.in',
    'mygov.in', 'digitalindia.gov.in', 'irctc.co.in',
    // Education / Dev
    'wikipedia.org', 'wikimedia.org',
    'stackoverflow.com', 'github.com', 'githubusercontent.com',
    'gitlab.com', 'npmjs.com', 'pypi.org',
    // Indian Finance
    'sbi.co.in', 'hdfcbank.com', 'icicibank.com', 'axisbank.com',
    'kotakbank.com', 'paytm.com', 'phonepe.com',
    'razorpay.com', 'billdesk.com', 'ccavenue.com',
    // Social / Media
    'twitter.com', 'x.com', 't.co',
    'linkedin.com', 'licdn.com',
    'reddit.com', 'redd.it', 'redditmedia.com',
    'medium.com', 'quora.com',
    'netflix.com', 'hotstar.com', 'disneyplus.com', 'primevideo.com',
    // CDN / Infra
    'cloudflare.com', 'cloudfront.net', 'akamaized.net',
    'fastly.net', 'jsdelivr.net',
    // Vercel / Render (your own backend)
    'vercel.app', 'netlify.app', 'onrender.com',
    // Search
    'duckduckgo.com', 'yahoo.com',
  ]
};

export default CONFIG;
