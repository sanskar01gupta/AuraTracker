import { NextRequest, NextResponse } from 'next/server';
import { scrapeProduct } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Product URL is required' },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const scrapedData = await scrapeProduct(url);

    return NextResponse.json({
      success: true,
      data: scrapedData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Scraping failed' },
      { status: 500 }
    );
  }
}
