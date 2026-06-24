// scripts/scrapeProducts.ts
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface ScrapedProduct {
  id: number;
  name: string;
  price: string;
  priceNum: number;
  rating: number;
  reviews: number;
  img: string;
  category: string;
}

// Helper to convert price string to number (handles formats like "48,000 DT" or "48 000 DT")
function parsePrice(priceStr: string): number {
  const numeric = priceStr.replace(/[\s\u202FDT,]/g, ''); // remove spaces, non‑breaking spaces, currency, commas
  const value = parseFloat(numeric);
  return isNaN(value) ? 0 : value;
}

// Helper for fetch with headers
async function fetchWithHeaders(url: string) {
  return fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }
  });
}

// Fetch all top‑level category URLs from the homepage
async function fetchCategoryUrls(base: string): Promise<{ name: string; url: string }[]> {
  const res = await fetchWithHeaders(base);
  const html = await res.text();
  const $ = cheerio.load(html);
  const categories: { name: string; url: string }[] = [];
  // WooCommerce categories are usually under .product-category a
  $('.product-category a').each((_, elem) => {
    const name = $(elem).text().trim();
    const href = $(elem).attr('href');
    if (href) {
      categories.push({ name, url: href });
    }
  });
  return categories;
}

// Scrape a single product list page (could be a paginated page)
async function scrapeProductPage(pageUrl: string, categoryName: string): Promise<ScrapedProduct[]> {
  const res = await fetchWithHeaders(pageUrl);
  const html = await res.text();
  const $ = cheerio.load(html);
  const products: ScrapedProduct[] = [];

  $('.product').each((_, elem) => {
    const name = $(elem).find('.woocommerce-loop-product__title').text().trim();
    const price = $(elem).find('.price').first().text().trim();
    const img = $(elem).find('img').attr('src') || '';
    const ratingAttr = $(elem).find('.star-rating').attr('title');
    const rating = ratingAttr ? parseFloat(ratingAttr.split(' ')[0]) : 0;
    const reviewsText = $(elem).find('.woocommerce-review-link').text();
    const reviewsMatch = reviewsText.match(/(\d+)/);
    const reviews = reviewsMatch ? parseInt(reviewsMatch[1], 10) : 0;
    const idMatch = $(elem).attr('id')?.match(/post-(\d+)/);
    const id = idMatch ? parseInt(idMatch[1], 10) : Date.now() + Math.random();

    products.push({
      id,
      name,
      price,
      priceNum: parsePrice(price),
      rating,
      reviews,
      img,
      category: categoryName,
    });
  });

  return products;
}

// Iterate through all pagination links for a given category page
async function scrapeCategoryAllPages(categoryUrl: string, categoryName: string): Promise<ScrapedProduct[]> {
  const allProducts: ScrapedProduct[] = [];
  let nextPageUrl: string | null = categoryUrl;
  const visited = new Set<string>();

  while (nextPageUrl && !visited.has(nextPageUrl)) {
    visited.add(nextPageUrl);
    const pageProducts = await scrapeProductPage(nextPageUrl, categoryName);
    allProducts.push(...pageProducts);

    // Look for pagination "next" link – WooCommerce uses .next.page-numbers
    const res = await fetchWithHeaders(nextPageUrl);
    const html = await res.text();
    const $ = cheerio.load(html);
    const nextLink = $('.next.page-numbers').attr('href');
    nextPageUrl = nextLink && !visited.has(nextLink) ? nextLink : null;
  }
  return allProducts;
}

async function main() {
  const base = 'https://librairielecolier.tn/';
  // 1️⃣ Get all category URLs from the homepage
  const categories = await fetchCategoryUrls(base);

  const allProducts: ScrapedProduct[] = [];
  for (const cat of categories) {
    console.log('Scraping category', cat.name, cat.url);
    try {
      const products = await scrapeCategoryAllPages(cat.url, cat.name);
      allProducts.push(...products);
    } catch (e) {
      console.error('Failed to scrape', cat.url, e);
    }
  }

  // Write output JSON inside src/data folder (create if missing)
  const outPath = path.resolve(process.cwd(), 'src/data/products.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(allProducts, null, 2), 'utf-8');
  console.log('Scraped', allProducts.length, 'products to', outPath);
}

main().catch(console.error);
