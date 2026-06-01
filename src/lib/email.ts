import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  subject: string;
  productName: string;
  currentPrice: number;
  targetPrice: number;
  productUrl: string;
  storeName: string;
}

/**
 * Renders a highly-polished minimalist HTML email template
 */
function renderHtmlTemplate({
  productName,
  currentPrice,
  targetPrice,
  productUrl,
  storeName,
}: Omit<EmailParams, 'to' | 'subject'>): string {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR', // Default to INR, fallback clean numbers otherwise
    maximumFractionDigits: 0
  }).format(currentPrice);

  const formattedTarget = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(targetPrice);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Price Alert Triggered</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f5f5f7;
      color: #1d1d1f;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f5f5f7;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .tag {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #0071e3;
      background-color: rgba(0, 113, 227, 0.08);
      padding: 6px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0;
      color: #1d1d1f;
    }
    .content {
      margin-bottom: 32px;
    }
    .product-title {
      font-size: 18px;
      font-weight: 500;
      color: #515154;
      line-height: 1.5;
      margin-bottom: 24px;
      text-align: center;
    }
    .price-grid {
      display: flex;
      justify-content: space-around;
      background-color: #f5f5f7;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 32px;
      text-align: center;
    }
    .price-col {
      flex: 1;
    }
    .price-label {
      font-size: 12px;
      color: #86868b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .price-value {
      font-size: 22px;
      font-weight: 600;
      color: #1d1d1f;
    }
    .price-value.drop {
      color: #1d1d1f;
    }
    .btn-container {
      text-align: center;
      margin-top: 10px;
    }
    .btn {
      display: inline-block;
      background-color: #1d1d1f;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 500;
      text-decoration: none !important;
      padding: 14px 32px;
      border-radius: 30px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      font-size: 12px;
      color: #86868b;
      line-height: 1.5;
    }
    .footer a {
      color: #0071e3;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="tag">${storeName} Alert</span>
        <h1>Price Drop Detected!</h1>
      </div>
      <div class="content">
        <p class="product-title">${productName}</p>
        
        <div class="price-grid">
          <div class="price-col" style="border-right: 1px solid #e5e5e7;">
            <div class="price-label">Your Target</div>
            <div class="price-value">${formattedTarget}</div>
          </div>
          <div class="price-col">
            <div class="price-label">Current Price</div>
            <div class="price-value drop">${formattedPrice}</div>
          </div>
        </div>

        <div class="btn-container">
          <a href="${productUrl}" target="_blank" class="btn">Buy Product Now</a>
        </div>
      </div>
      <div class="footer">
        You are receiving this because you set a price alert on our minimalist Price Alert app.<br>
        Store: <strong>${storeName}</strong>.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Unified helper to send an alert email.
 * Supports Resend API (preferred) or Nodemailer SMTP fallback.
 * If neither is configured, logs output to the console for debug ease.
 */
export async function sendPriceAlertEmail(params: EmailParams): Promise<boolean> {
  const { to, subject, productName, currentPrice, targetPrice, productUrl, storeName } = params;
  const htmlContent = renderHtmlTemplate({ productName, currentPrice, targetPrice, productUrl, storeName });

  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    // 1. Resend API call (ultra lightweight, no extra packages)
    try {
      console.log('Sending price alert email using Resend API...');
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Price Alert <alerts@price-alerts.dev>',
          to: [to],
          subject: subject,
          html: htmlContent,
        }),
      });

      if (response.ok) {
        console.log(`Resend email successfully sent to ${to}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Resend API error:', errorText);
      }
    } catch (err: any) {
      console.error('Failed to send email via Resend:', err.message);
    }
  }

  // 2. Nodemailer SMTP Fallback
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    try {
      console.log('Sending price alert email using Nodemailer SMTP...');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // True for 465, false for 587 or other
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Price Alert" <no-reply@price-alerts.dev>',
        to,
        subject,
        html: htmlContent,
      });

      console.log(`SMTP email successfully sent to ${to}`);
      return true;
    } catch (err: any) {
      console.error('Failed to send email via SMTP:', err.message);
    }
  }

  // 3. Fallback dry-run logging (very helpful for personal local scales!)
  console.log('\n--- [EMAIL DRY-RUN LOG] ---');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Product: ${productName}`);
  console.log(`Target Price: INR ${targetPrice} | Current Price: INR ${currentPrice}`);
  console.log(`Store: ${storeName}`);
  console.log(`Purchase Link: ${productUrl}`);
  console.log('----------------------------\n');
  console.log('Tip: Configure RESEND_API_KEY or SMTP credentials in your .env.local to send live emails!');

  return true;
}
