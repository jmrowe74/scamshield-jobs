import { NextRequest, NextResponse } from 'next/server';
import { scamJobAnalysis } from '@/ai/flows/scam-job-analysis';
import { checkKnownScamDomain } from '@/lib/scam-domains';
import { checkGoogleSafeBrowsing } from '@/lib/safe-browsing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.jobUrl) {
      return NextResponse.json({ error: 'jobUrl is required' }, { status: 400 });
    }

    console.log('Starting AI analysis for:', body.jobUrl);

    const scamDomainCheck = checkKnownScamDomain(body.jobUrl);
    if (scamDomainCheck.isScam) {
      console.log('Known scam domain detected:', body.jobUrl);
      return NextResponse.json({
        legitimacyScore: 0,
        classification: 'scam',
        confidence: 99,
        reasoning: '⚠️ KNOWN SCAM SITE DETECTED: ' + scamDomainCheck.reason + ' Do not apply or provide any personal information.',
        title: body.jobTitle || 'Suspicious Job Posting',
        company: body.companyName || 'Unknown - Likely Fraudulent',
        description: 'This URL is from a known scam domain.',
        redFlags: [scamDomainCheck.reason],
        legitimacyIndicators: []
      });
    }

    const safeBrowsingCheck = await checkGoogleSafeBrowsing(body.jobUrl);
    if (safeBrowsingCheck.isMalicious) {
      console.log('Google Safe Browsing threat detected:', body.jobUrl);
      return NextResponse.json({
        legitimacyScore: 0,
        classification: 'scam',
        confidence: 99,
        reasoning: '⚠️ DANGEROUS SITE DETECTED BY GOOGLE. Threat types: ' + safeBrowsingCheck.threats.join(', ') + '. Do not visit this site.',
        title: body.jobTitle || 'Dangerous Job Posting',
        company: body.companyName || 'Unknown - Flagged by Google',
        description: 'This URL has been flagged as malicious by Google Safe Browsing.',
        redFlags: safeBrowsingCheck.threats,
        legitimacyIndicators: []
      });
    }

    const result = await scamJobAnalysis(body);
    console.log('AI analysis complete:', result.classification);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('API Route Error:', error.message);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}

export const maxDuration = 60;