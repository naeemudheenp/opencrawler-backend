import puppeteer from 'puppeteer';
import { Emailer } from 'src/emails/emailer';
import { URL } from 'url';

let browser = null;

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    return u.href.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function delay(ms: number) {
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
    console.log('Puppeteer browser launched v10');
  }
  return browser;
}

async function fetchPageLinks(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return { statusCode: 404, links: [] };
    const text = await response.text();
    const links = Array.from(
      text.matchAll(/<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/g),
    ).map((match) => match[1]);
    return { statusCode: 200, links };
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    return { statusCode: 404, links: [] };
  }
}

async function checkPageStatusAndGetLinks(url) {
  const browser = await getBrowser();
  let statusCode = 404;
  let links = [];
  let page = null;

  try {
    page = await browser.newPage();
    await page.setRequestInterception(true);
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
      links = await page.$$eval('a', (anchors) =>
        anchors.map((anchor) => anchor.href),
      );
    }
  } catch (error) {
    console.error(`Puppeteer failed for ${url}:`, error);
    const fallback = await fetchPageLinks(url);
    statusCode = fallback.statusCode;
    links = fallback.links;
  } finally {
    if (page) await page.close();
  }

  return { statusCode, links };
}

export async function deepScan(initialUrl, email, postActionApi) {
  const visitedUrls = new Set<string>();
  const brokenLinks = new Set<string>();
  const pageToVisit = new Set<string>();

  const emailer = new Emailer();
  const baseDomain = new URL(initialUrl).origin;

  const normalizedInitial = normalizeUrl(initialUrl);
  visitedUrls.add(normalizedInitial);
  pageToVisit.add(normalizedInitial);

  try {
    while (pageToVisit.size > 0 && visitedUrls.size < 999) {
      const url = pageToVisit.values().next().value;
      pageToVisit.delete(url);

      console.log(`[SCAN] Crawling: ${url} (${visitedUrls.size + 1}/999)`);

      let statusCode = 404;
      let links: string[] = [];

      try {
        const fetchResult = await fetchPageLinks(url);
        statusCode = fetchResult.statusCode;
        links = fetchResult.links;

        if (statusCode !== 200) {
          const fallback = await checkPageStatusAndGetLinks(url);
          statusCode = fallback.statusCode;
          links = fallback.links;
        }

        if (statusCode === 404) {
          brokenLinks.add(url);
          console.log(`[SCAN] Broken: ${url}`);
        }

        visitedUrls.add(url);

        links.forEach((link) => {
          try {
            const normalizedLink = normalizeUrl(new URL(link, url).href);
            const linkDomain = new URL(normalizedLink).origin;

            if (
              linkDomain === baseDomain &&
              !visitedUrls.has(normalizedLink) &&
              !pageToVisit.has(normalizedLink)
            ) {
              pageToVisit.add(normalizedLink);
            }
          } catch {}
        });
      } catch (error) {
        console.error(`[SCAN] Error crawling ${url}:`, error);
        brokenLinks.add(url);
      }

      console.log(`[SCAN] Waiting for 1000ms before next request...`);
      await delay(1000);
    }

    if (visitedUrls.size >= 999) {
      console.log(`[SCAN] 🚫 Scan limit of 999 pages reached.`);
    }

    if (postActionApi) {
      console.log(`[SCAN] Sending crawl data to API...`);
      await fetch(postActionApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokenLinks: [...brokenLinks],
          allPages: [...visitedUrls],
        }),
      });
    } else {
      console.log(`[SCAN] Sending crawl results via email...`);
      await emailer.crawlingCompletedEmail(email, brokenLinks, visitedUrls);
    }
  } catch (error) {
    console.error(`[SCAN] Error during deep scan:`, error);
  } finally {
    if (browser) {
      console.log(`[SCAN] Closing Puppeteer browser...`);
      await browser.close();
      browser = null;
    }
  }
}


process.on('SIGINT', async () => {
  if (browser) {
    console.log('Closing Puppeteer browser...');
    await browser.close();
    browser = null;
  }
  process.exit(0);
});
