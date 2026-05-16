/**
 * Known scam job posting domains and patterns
 * Updated regularly based on reported scams
 */
export const KNOWN_SCAM_DOMAINS = [
    // Known job scam sites
    'job-application.net',
    'jobapplication.net',
    'hiring-now.net',
    'hiringnow.net',
    'remotejobs24.com',
    'job-offer.net',
    'joboffer.net',
    'work-from-home.net',
    'workfromhome.net',
    'easy-money.net',
    'easymoney.net',
    'quickjobs.net',
    'quick-jobs.net',
    'jobscam.net',
    'careersusa.net',
    'usjobs24.com',
    'jobs-usa.net',
    'jobsusa.net',
    'americanjobs24.com',
    'jobpostings24.com',
    'jobposting.net',
    'job-postings.net',
    'employmentnow.net',
    'employment-now.net',
    'hiremenow.net',
    'hire-me-now.net',
    'jobboard24.com',
    'job-board24.com',
    'onlinejobs24.com',
    'online-jobs24.com',
    'workathome24.com',
    'work-at-home24.com',
  ];
  
  export const SCAM_PATTERNS = [
    // URL patterns that indicate scams
    /jobs?\d{2,}\.com/i,           // jobs123.com
    /career\d{2,}\.com/i,          // career123.com
    /hiring\d{2,}\.com/i,          // hiring123.com
    /work\d{2,}\.com/i,            // work123.com
    /employment\d{2,}\.com/i,      // employment123.com
    /apply\d{2,}\.com/i,           // apply123.com
    /job-[a-z]+-[a-z]+\.net/i,    // job-easy-money.net
    /free-job[s]?\.com/i,          // free-jobs.com
    /urgent-hiring\.com/i,         // urgent-hiring.com
    /urgentjobs\.com/i,            // urgentjobs.com
  ];
  
  export const SCAM_TLDS = [
    // Top level domains commonly used by scammers
    '.xyz',
    '.click',
    '.buzz',
    '.gq',
    '.ml',
    '.cf',
    '.ga',
    '.tk',
  ];
  
  /**
   * Check if a URL matches known scam patterns
   */
  export function checkKnownScamDomain(url: string): {
    isScam: boolean;
    reason: string;
  } {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const fullUrl = url.toLowerCase();
  
      // Check against known scam domains
      for (const scamDomain of KNOWN_SCAM_DOMAINS) {
        if (domain === scamDomain || domain.endsWith('.' + scamDomain)) {
          return {
            isScam: true,
            reason: `Domain "${domain}" is on the known scam domains list.`
          };
        }
      }
  
      // Check against scam patterns
      for (const pattern of SCAM_PATTERNS) {
        if (pattern.test(domain)) {
          return {
            isScam: true,
            reason: `Domain "${domain}" matches a known scam URL pattern.`
          };
        }
      }
  
      // Check against scam TLDs
      for (const tld of SCAM_TLDS) {
        if (domain.endsWith(tld)) {
          return {
            isScam: true,
            reason: `Domain uses suspicious TLD "${tld}" commonly associated with scam sites.`
          };
        }
      }
  
      return { isScam: false, reason: '' };
    } catch {
      return { isScam: false, reason: '' };
    }
  }