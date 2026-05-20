import { NextRequest, NextResponse } from 'next/server';
import { scamJobAnalysis } from '@/ai/flows/scam-job-analysis';
import { checkKnownScamDomain } from '@/lib/scam-domains';
import { checkGoogleSafeBrowsing } from '@/lib/safe-browsing';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (limit.count >= 10) return false;
  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait 1 minute before trying again.' },
        { status: 429 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.jobUrl) {
      return NextResponse.json({ error: 'jobUrl is required' }, { status: 400 });
    }

    try {
      const url = new URL(body.jobUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    if (body.jobUrl.length > 2000) {
      return NextResponse.json({ error: 'URL too long' }, { status: 400 });
    }
    if (body.jobTitle && body.jobTitle.length > 200) {
      return NextResponse.json({ error: 'Job title too long' }, { status: 400 });
    }
    if (body.companyName && body.companyName.length > 200) {
      return NextResponse.json({ error: 'Company name too long' }, { status: 400 });
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