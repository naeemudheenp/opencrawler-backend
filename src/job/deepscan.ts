import puppeteer from 'puppeteer';
import { Emailer } from 'src/emails/emailer';
import { URL } from 'url';

let browser = null;

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    return u.href.replace(/\/$/, ''); // Remove trailing slash
  } catch {
    return url;
  }
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
  const allPages = new Set<string>();
  const brokenLinks = new Set<string>();
  const pageToVisit = new Set<string>();

  const emailer = new Emailer();
  const baseDomain = new URL(initialUrl).origin;

  const normalizedInitial = normalizeUrl(initialUrl);
  allPages.add(normalizedInitial);
  pageToVisit.add(normalizedInitial);

  try {
    while (pageToVisit.size > 0) {
      const url = pageToVisit.values().next().value;
      pageToVisit.delete(url);

      try {
        const response = await checkPageStatusAndGetLinks(url);
        console.log('Crawling:', url, response.statusCode);
        if (response.statusCode === 404) brokenLinks.add(url);

        response.links.forEach((link) => {
          try {
            const normalizedLink = normalizeUrl(new URL(link, url).href);
            const linkDomain = new URL(normalizedLink).origin;
            if (!allPages.has(normalizedLink) && linkDomain === baseDomain) {
              allPages.add(normalizedLink);
              pageToVisit.add(normalizedLink);
            }
          } catch {}
        });
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
        brokenLinks.add(url);
      }
    }

    if (postActionApi) {
      console.log('Sending crawl data to API...');
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
    console.error('Error during deep scan:', error);
  } finally {
    if (browser) {
      console.log('Closing Puppeteer browser...');
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
