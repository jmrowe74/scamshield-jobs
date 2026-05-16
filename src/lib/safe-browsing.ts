/**
 * Google Safe Browsing API integration
 * Checks URLs against Google's database of malicious sites
 */
export async function checkGoogleSafeBrowsing(url: string): Promise<{
    isMalicious: boolean;
    threats: string[];
  }> {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    
    if (!apiKey) {
      return { isMalicious: false, threats: [] };
    }
  
    try {
      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: {
              clientId: 'scamshield-jobs',
              clientVersion: '1.0.0'
            },
            threatInfo: {
              threatTypes: [
                'MALWARE',
                'SOCIAL_ENGINEERING',
                'UNWANTED_SOFTWARE',
                'POTENTIALLY_HARMFUL_APPLICATION'
              ],
              platformTypes: ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries: [{ url }]
            }
          })
        }
      );
  
      const data = await response.json();
      
      if (data.matches && data.matches.length > 0) {
        const threats = data.matches.map((match: any) => match.threatType);
        return { isMalicious: true, threats };
      }
  
      return { isMalicious: false, threats: [] };
    } catch (error) {
      console.error('Safe Browsing API error:', error);
      return { isMalicious: false, threats: [] };
    }
  }