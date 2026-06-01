import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapeProduct } from '@/lib/scraper';
import { sendPriceAlertEmail } from '@/lib/email';

// Helper delay to respect scraping rate limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Secure the cron endpoint to prevent unauthorized triggers
    const envSecret = process.env.CRON_SECRET;
    if (envSecret && secret !== envSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Invalid CRON_SECRET.' },
        { status: 401 }
      );
    }

    const activeAlerts = db.getActiveAlerts();
    console.log(`Cron execution started. Found ${activeAlerts.length} active alerts to check.`);

    let checkedCount = 0;
    let triggeredCount = 0;
    let failedCount = 0;
    const details: Array<{ id: string; title: string; previousPrice: number; newPrice: number; status: string }> = [];

    for (const alert of activeAlerts) {
      try {
        // Polite delay of 1.5 seconds between requests to avoid hammer throttling
        await delay(1500);

        const scraped = await scrapeProduct(alert.product_url);
        checkedCount++;

        const originalPrice = alert.current_price;
        const newPrice = scraped.price;
        let isTriggered = false;
        let triggerReason = '';

        // Check condition 1: Current price is at or below the target price
        if (newPrice > 0 && newPrice <= alert.target_price) {
          isTriggered = true;
          triggerReason = `Target price of INR ${alert.target_price} reached! (Now: INR ${newPrice})`;
        }

        // Check condition 2: Price drop is >= 10% compared to original recorded price
        if (!isTriggered && alert.notify_percentage_drop === 1 && newPrice > 0) {
          const dropRatio = (originalPrice - newPrice) / originalPrice;
          if (dropRatio >= 0.10) {
            isTriggered = true;
            triggerReason = `Price dropped by ${(dropRatio * 100).toFixed(0)}%! (Was: INR ${originalPrice}, Now: INR ${newPrice})`;
          }
        }

        // Check condition 3: Stock availability toggle is active and product is back in stock
        // Wait, standard stock triggers can check if scraped.inStock is true
        if (!isTriggered && alert.notify_stock === 1 && scraped.inStock) {
          // If we had recorded out-of-stock previously or just notify if it is in-stock now
          isTriggered = true;
          triggerReason = `Product is back in stock!`;
        }

        if (isTriggered && newPrice > 0) {
          console.log(`Alert ${alert.id} triggered! Reason: ${triggerReason}`);
          
          // Send notification email
          const emailSent = await sendPriceAlertEmail({
            to: alert.email,
            subject: `Price Alert Triggered: ${alert.product_title.slice(0, 40)}...`,
            productName: alert.product_title,
            currentPrice: newPrice,
            targetPrice: alert.target_price,
            productUrl: alert.product_url,
            storeName: alert.store_name || scraped.storeName,
          });

          // Mark alert as triggered
          db.updateAlert(alert.id, {
            current_price: newPrice,
            status: 'triggered',
            last_checked_at: new Date().toISOString(),
          });

          triggeredCount++;
          details.push({
            id: alert.id,
            title: alert.product_title,
            previousPrice: originalPrice,
            newPrice,
            status: `Triggered - ${triggerReason}`,
          });
        } else {
          // Alert not triggered, but we update the current price and checked timestamp
          db.updateAlert(alert.id, {
            current_price: newPrice > 0 ? newPrice : originalPrice, // Keep original if scrape price is 0 (blocked)
            last_checked_at: new Date().toISOString(),
          });

          details.push({
            id: alert.id,
            title: alert.product_title,
            previousPrice: originalPrice,
            newPrice: newPrice > 0 ? newPrice : originalPrice,
            status: 'Checked - No Trigger',
          });
        }
      } catch (err: any) {
        console.error(`Cron failed to process alert ${alert.id}:`, err.message);
        failedCount++;
        
        db.updateAlert(alert.id, {
          last_checked_at: new Date().toISOString(),
        });
        
        details.push({
          id: alert.id,
          title: alert.product_title,
          previousPrice: alert.current_price,
          newPrice: alert.current_price,
          status: `Failed scraping: ${err.message}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron check finished. Evaluated ${activeAlerts.length} alerts.`,
      summary: {
        total: activeAlerts.length,
        checked: checkedCount,
        triggered: triggeredCount,
        failed: failedCount,
      },
      details,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Cron execution failed' },
      { status: 500 }
    );
  }
}
