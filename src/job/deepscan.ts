import puppeteer from 'puppeteer';
import { Emailer } from 'src/emails/emailer';
import { URL } from 'url';

let browser = null;

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

async function checkPageStatusAndGetLinks(url, retries = 3, delay = 5000) {
  const browser = await getBrowser();
  let statusCode = 404;
  let links = [];
  let page = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      page = await browser.newPage();
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      statusCode = response?.status() || 404;
      if (statusCode === 200) {
        links = await page.$$eval('a', (anchors) =>
          anchors.map((anchor) => anchor.href),
        );
      }
      break;
    } catch (error) {
      console.error(`Error on attempt ${attempt} fetching page ${url}:`, error);
      if (attempt === retries) {
        console.log(`Falling back to fetch for ${url}`);
        const fetchResponse = await fetchPageLinks(url);
        statusCode = fetchResponse.statusCode;
        links = fetchResponse.links;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      if (page) await page.close();
    }
  }
  return { statusCode, links };
}

export async function deepScan(initialUrl, email, postActionApi) {
  const allPages = new Set([initialUrl]);
  const brokenLinks: any = new Set();
  const pageToVisit = new Set([initialUrl]);
  const emailer = new Emailer();
  const baseDomain = new URL(initialUrl).origin;

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
            const linkDomain = new URL(link, initialUrl).origin;
            if (!allPages.has(link) && linkDomain === baseDomain) {
              allPages.add(link);
              pageToVisit.add(link);
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
