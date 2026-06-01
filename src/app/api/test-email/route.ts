import { NextRequest, NextResponse } from 'next/server';
import { sendPriceAlertEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to') || 'sanskar01gupta@gmail.com';

    console.log(`[Test Email Endpoint] Triggering mock email dispatch to: ${to}`);

    const success = await sendPriceAlertEmail({
      to,
      subject: 'Aura Alert Test: Dummy Price Drop!',
      productName: 'Sony WH-1000XM5 Premium Noise Cancelling Headphones (Silver)',
      currentPrice: 24999,
      targetPrice: 26999,
      productUrl: 'https://www.amazon.in/dp/B09XS7JLHX',
      storeName: 'Amazon',
    });

    return NextResponse.json({
      success,
      message: `Test email process triggered successfully for ${to}.`,
      deliveryMode: process.env.RESEND_API_KEY ? 'Resend' : process.env.SMTP_HOST ? 'SMTP' : 'Dry-run console log',
      note: 'If credentials are not yet configured in .env.local, check your Next.js running terminal for the full HTML printout!'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process test email' },
      { status: 500 }
    );
  }
}
