import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminAuth } from '@/firebase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(unsafe: string): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let verifiedEmail: string | undefined;
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      verifiedEmail = decodedToken.email;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!verifiedEmail) {
      return NextResponse.json({ error: 'No verified email on account' }, { status: 400 });
    }

    const body = await request.json();
    const { jobs } = body;

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs provided' }, { status: 400 });
    }

    if (jobs.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 jobs per alert' }, { status: 400 });
    }

    const jobsList = jobs.map((job: any) => {
      const safeTitle = escapeHtml(job.title || 'Unknown');
      const safeCompany = escapeHtml(job.company || 'Unknown Company');
      const safeSource = escapeHtml(job.source || 'Unknown');
      const safeScore = Number.isFinite(job.legitimacyScore) ? job.legitimacyScore : 0;

      let safeUrl = '#';
      try {
        const parsed = new URL(job.url);
        if (['http:', 'https:'].includes(parsed.protocol)) {
          safeUrl = parsed.toString();
        }
      } catch {
        safeUrl = '#';
      }

      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #333;">
          <strong style="color: #ff4444;">${safeTitle}</strong><br/>
          <span style="color: #999;">${safeCompany}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #999;">
          ${safeSource}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #333;">
          <span style="color: #ff4444; font-weight: bold;">${safeScore}%</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #333;">
          <a href="${safeUrl}" style="color: #4488ff;">View Posting</a>
        </td>
      </tr>
    `;
    }).join('');

    const { data, error } = await resend.emails.send({
      from: 'ScamShield Jobs <onboarding@resend.dev>',
      to: verifiedEmail,
      subject: `ScamShield Alert: ${jobs.length} Scam Job${jobs.length > 1 ? 's' : ''} Detected`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px;">
          <h1 style="color: #ffffff; margin: 0 0 24px 0;">ScamShield <span style="color: #4488ff;">Jobs</span></h1>
          <div style="background: #1a1a2e; border: 1px solid #ff4444; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h2 style="color: #ff4444; margin: 0 0 8px 0;">Scam Alert</h2>
            <p style="color: #cccccc; margin: 0;">
              <strong>${jobs.length}</strong> verified scam job posting${jobs.length > 1 ? 's have' : ' has'} been detected.
            </p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #1a1a2e;">
                <th style="padding: 12px; text-align: left; color: #4488ff;">Job Title</th>
                <th style="padding: 12px; text-align: left; color: #4488ff;">Source</th>
                <th style="padding: 12px; text-align: left; color: #4488ff;">Score</th>
                <th style="padding: 12px; text-align: left; color: #4488ff;">Link</th>
              </tr>
            </thead>
            <tbody>${jobsList}</tbody>
          </table>
          <p style="color: #666; font-size: 12px; text-align: center;">Stay safe. Stay informed. ScamShield Jobs</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Email alert error:', error);
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 });
  }
}

export const maxDuration = 60;
