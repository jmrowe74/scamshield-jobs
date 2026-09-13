import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminAuth } from '@/firebase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { pdfBase64 } = body;

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return NextResponse.json({ error: 'No report data provided' }, { status: 400 });
    }

    const dateStr = new Date().toISOString().split('T')[0];

    const { data, error } = await resend.emails.send({
      from: 'ScamShield Jobs <noreply@mail.scamshieldjobs.com>',
      to: verifiedEmail,
      subject: 'Your ScamShield Jobs Audit Report',
      html: `
        <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px;">
          <h1 style="color: #ffffff; margin: 0 0 16px 0;">ScamShield <span style="color: #4488ff;">Jobs</span></h1>
          <p style="color: #cccccc;">Your latest audit report is attached as a PDF.</p>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">Stay safe. Stay informed. ScamShield Jobs</p>
        </div>
      `,
      attachments: [
        {
          filename: `ScamShield-Report-${dateStr}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Email report error:', error);
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 });
  }
}

export const maxDuration = 60;