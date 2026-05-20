
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobs } = body;

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs provided' }, { status: 400 });
    }

    const jobsList = jobs.map((job: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #333;">
          <strong style="color: #ff4444;">${job.title || 'Unknown'}</strong><br/>
          <span style="color: #999;">${job.company || 'Unknown Company'}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #333; color: #999;">
          ${job.source || 'Unknown'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #333;">
          <span style="color: #ff4444; font-weight: bold;">${job.legitimacyScore || 0}%</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #333;">
          <a href="${job.url}" style="color: #4488ff;">View Posting</a>
        </td>
      </tr>
    `).join('');

    const { data, error } = await resend.emails.send({
      from: 'ScamShield Jobs <onboarding@resend.dev>',
      to: process.env.ALERT_EMAIL!,
      subject: `🚨 ScamShield Alert: ${jobs.length} Scam Job${jobs.length > 1 ? 's' : ''} Detected`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px;">
          <h1 style="color: #ffffff; margin: 0 0 24px 0;">🛡️ ScamShield <span style="color: #4488ff;">Jobs</span></h1>
          <div style="background: #1a1a2e; border: 1px solid #ff4444; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h2 style="color: #ff4444; margin: 0 0 8px 0;">⚠️ Scam Alert</h2>
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
          <p style="color: #666; font-size: 12px; text-align: center;">Stay safe. Stay informed. ScamShield Jobs 🛡️</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Email alert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const maxDuration = 60;