import puppeteer from 'puppeteer';
import { Emailer } from 'src/emails/emailer';
import { URL } from 'url';

let browser = null;

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    return u.href.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
      headless: true,
      timeout: 120000,
    });
    console.log('[SCAN] Puppeteer browser launched');
  }
  return browser;
}

async function fetchPageLinks(url: string): Promise<{ statusCode: number; links: string[] }> {
  try {
    const response = await fetch(url);
    if (!response.ok) return { statusCode: 404, links: [] };
    const text = await response.text();
    const links = Array.from(text.matchAll(/<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/g)).map((match) => match[1]);
    return { statusCode: 200, links };
  } catch (error) {
    console.error(`[SCAN] Fetch failed for ${url}:`, error);
    return { statusCode: 404, links: [] };
  }
}

async function checkPageStatusAndGetLinks(page, url: string): Promise<{ statusCode: number; links: string[] }> {
  let statusCode = 404;
  let links: string[] = [];

  try {
    await page.setRequestInterception(true);
    page.removeAllListeners('request');

    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    statusCode = response?.status() || 404;
    if (statusCode === 200) {
      links = await page.$$eval('a', (anchors) => anchors.map((anchor) => anchor.href));
    }
  } catch (error) {
    console.error(`[SCAN] Puppeteer failed for ${url}, falling back to fetch...`, error);
    const fallback = await fetchPageLinks(url);
    statusCode = fallback.statusCode;
    links = fallback.links;
  }

  return { statusCode, links };
}

export async function deepScan(initialUrl: string, email: string, postActionApi?: string) {
  const allPages = new Set<string>();
  const brokenLinks = new Set<string>();
  const pageToVisit = new Set<string>();
  const emailer = new Emailer();

  const baseDomain = new URL(initialUrl).origin;
  const normalizedInitial = normalizeUrl(initialUrl);
  allPages.add(normalizedInitial);
  pageToVisit.add(normalizedInitial);

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    while (pageToVisit.size > 0 && allPages.size < 999) {
      const url = pageToVisit.values().next().value;
      pageToVisit.delete(url);

      try {
        const response = await checkPageStatusAndGetLinks(page, url);
        console.log(`[SCAN] Crawled: ${url} (${response.statusCode})`);

        if (response.statusCode === 404) brokenLinks.add(url);

        for (const link of response.links) {
          try {
            const normalizedLink = normalizeUrl(new URL(link, url).href);
            const linkDomain = new URL(normalizedLink).origin;
            if (!allPages.has(normalizedLink) && linkDomain === baseDomain) {
              allPages.add(normalizedLink);
              pageToVisit.add(normalizedLink);
            }
          } catch {}
        }
      } catch (error) {
        console.error(`[SCAN] Error crawling ${url}:`, error);
        brokenLinks.add(url);
      }

      await delay(1000); // ⏳ Delay between requests
    }

    await page.close();

    if (postActionApi) {
      console.log('[SCAN] Posting results to API...');
      await fetch(postActionApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokenLinks: [...brokenLinks],
          allPages: [...allPages],
        }),
      });
    } else {
      await emailer.crawlingCompletedEmail(email, brokenLinks, allPages);
    }
  } catch (error) {
    console.error('[SCAN] Error during deep scan:', error);
  } finally {
    if (browser) {
      console.log('[SCAN] Closing Puppeteer browser...');
      await browser.close();
      browser = null;
    }
  }
}

process.on('SIGINT', async () => {
  if (browser) {
    console.log('[SCAN] Gracefully closing Puppeteer browser...');
    await browser.close();
    browser = null;
  }
  process.exit(0);
});
