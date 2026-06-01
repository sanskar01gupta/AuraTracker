import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

export interface ScrapeResult {
  title: string;
  price: number;
  image?: string;
  storeName: string;
  inStock: boolean;
}

/**
 * Helper to get a random user agent to help bypass simple bot filters
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Extract domain name/store name from product URL
 */
export function extractStoreName(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    const parts = host.split('.');
    if (parts.length > 1) {
      // Return capitalized store name, e.g. amazon.in -> Amazon
      return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
    }
    return host;
  } catch {
    return 'E-commerce Store';
  }
}

/**
 * Cleans a price string and parses it into a float number
 * e.g. "₹24,999.00" -> 24999, "$1,299" -> 1299
 */
export function cleanPrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove currency symbols, commas, spaces, and other non-numeric chars except decimals/digits
  const cleaned = priceStr.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Scrapes product details from a given URL
 */
export async function scrapeProduct(url: string): Promise<ScrapeResult> {
  const storeName = extractStoreName(url);
  const userAgent = getRandomUserAgent();

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    let title = '';
    let price = 0;
    let image = '';
    let inStock = true;

    // --- 1. Try parsing JSON-LD Structured Data ---
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const text = $(element).html();
        if (!text) return;
        
        // Remove trailing commas/weird chars if any
        const data = JSON.parse(text.trim());
        
        // Helper to extract product from JSON-LD
        const checkProductObj = (obj: any) => {
          if (!obj) return;
          if (obj['@type'] === 'Product' || obj['@type']?.includes('Product')) {
            if (obj.name && !title) title = obj.name;
            if (obj.image) {
              if (Array.isArray(obj.image) && obj.image.length > 0) {
                image = obj.image[0];
              } else if (typeof obj.image === 'string') {
                image = obj.image;
              }
            }
            if (obj.offers) {
              const offers = obj.offers;
              if (Array.isArray(offers) && offers.length > 0) {
                const activeOffer = offers.find(o => o.price) || offers[0];
                if (activeOffer.price) price = cleanPrice(activeOffer.price.toString());
                if (activeOffer.availability) {
                  inStock = !activeOffer.availability.includes('OutOfStock') && 
                            !activeOffer.availability.includes('out-of-stock');
                }
              } else if (typeof offers === 'object') {
                if (offers.price) price = cleanPrice(offers.price.toString());
                else if (offers.lowPrice) price = cleanPrice(offers.lowPrice.toString());
                
                if (offers.availability) {
                  inStock = !offers.availability.includes('OutOfStock') && 
                            !offers.availability.includes('out-of-stock');
                }
              }
            }
          }
        };

        if (Array.isArray(data)) {
          data.forEach(checkProductObj);
        } else if (data['@graph'] && Array.isArray(data['@graph'])) {
          data['@graph'].forEach(checkProductObj);
        } else {
          checkProductObj(data);
        }
      } catch {
        // Suppress parsing errors for specific scripts
      }
    });

    // --- 2. Try parsing OpenGraph Metadata ---
    if (!title) {
      title = $('meta[property="og:title"]').attr('content') || 
              $('meta[name="twitter:title"]').attr('content') || 
              $('title').text().trim() || 
              '';
    }

    if (!image) {
      image = $('meta[property="og:image"]').attr('content') || 
              $('meta[name="twitter:image"]').attr('content') || 
              '';
    }

    if (!price) {
      const ogPrice = $('meta[property="product:price:amount"]').attr('content') || 
                      $('meta[property="og:price:amount"]').attr('content') ||
                      $('meta[name="twitter:price:amount"]').attr('content');
      if (ogPrice) {
        price = cleanPrice(ogPrice);
      }
    }

    // --- 3. Custom Fallback Selectors by Store Name ---
    const isAmazon = storeName.toLowerCase().includes('amazon');
    const isFlipkart = storeName.toLowerCase().includes('flipkart');

    if (isAmazon) {
      // Price Selector
      if (!price) {
        const amazonPriceText = $('.a-price-whole').first().text().trim() || 
                                $('#priceblock_ourprice').text().trim() ||
                                $('#priceblock_dealprice').text().trim() ||
                                $('.a-size-medium.a-color-price').first().text().trim() ||
                                $('.a-offscreen').first().text().trim();
        price = cleanPrice(amazonPriceText);
      }
      // Title Selector
      if (!title || title.includes('Amazon.')) {
        title = $('#productTitle').text().trim();
      }
      // Image Selector
      if (!image) {
        const landingImg = $('#landingImage').attr('data-a-dynamic-image') || $('#landingImage').attr('src');
        if (landingImg && landingImg.startsWith('{')) {
          try {
            image = Object.keys(JSON.parse(landingImg))[0];
          } catch {}
        } else if (landingImg) {
          image = landingImg;
        }
      }
      // Stock Selector
      const availabilityText = $('#availability').text().trim().toLowerCase();
      if (availabilityText.includes('currently unavailable') || availabilityText.includes('out of stock')) {
        inStock = false;
      }
    } else if (isFlipkart) {
      // Price Selector
      if (!price) {
        const flipPriceText = $('.Nx9b7S').first().text().trim() ||
                              $('._30jeq3._16Jk6d').first().text().trim() ||
                              $('.C13Coz').first().text().trim();
        price = cleanPrice(flipPriceText);
      }
      // Title Selector
      if (!title) {
        title = $('.B_NuCI').text().trim() || $('.VU-ZEz').text().trim();
      }
      // Image Selector
      if (!image) {
        image = $('._396cs4._2amPTt._3qX0UX').attr('src') || $('.DByo1B').attr('src') || '';
      }
      // Stock Selector
      const outOfStockText = $('._19mPvQ').text().trim().toLowerCase() || $('.Z3n5DJ').text().trim().toLowerCase();
      if (outOfStockText.includes('sold out') || outOfStockText.includes('out of stock')) {
        inStock = false;
      }
    }

    // Generic CSS Selectors Fallback
    if (!title) {
      title = $('h1').first().text().trim();
    }

    if (!price) {
      // Find elements containing 'price' in class/id and parse their content
      const priceSelectors = [
        '[itemprop="price"]',
        '.price',
        '.product-price',
        'span[class*="price"]',
        'div[class*="price"]',
        'span[id*="price"]',
        'div[id*="price"]'
      ];
      
      for (const selector of priceSelectors) {
        const text = $(selector).first().text().trim();
        if (text) {
          const tempPrice = cleanPrice(text);
          if (tempPrice > 0) {
            price = tempPrice;
            break;
          }
        }
      }
    }

    // Clean up title (remove trailing spaces, line breaks, emojis)
    title = title.replace(/\s+/g, ' ').trim();
    
    // Ensure title has a backup if scraping failed
    if (!title) {
      title = `${storeName} Product`;
    }

    return {
      title,
      price,
      image: image || undefined,
      storeName,
      inStock
    };
  } catch (error: any) {
    console.error(`Scraping failed for URL: ${url}`, error.message);
    throw new Error(`Could not fetch details from this link. The store might be blocking requests, or the link is invalid.`);
  }
}
