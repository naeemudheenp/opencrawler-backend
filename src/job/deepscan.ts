import puppeteer from 'puppeteer';
import { Emailer } from 'src/emails/emailer';

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
    console.log(
      'Puppeteer browser launched v5 with spoofing and fetch as backup',
    );
  }
  return browser;
}

async function fetchPageLinks(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return { statusCode: response.status, links: [] };
    const text = await response.text();
    const links = Array.from(
      new DOMParser().parseFromString(text, 'text/html').querySelectorAll('a'),
    ).map((anchor) => anchor.href);
    return { statusCode: 200, links };
  } catch {
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
        waitUntil: 'networkidle2',
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
        return fetchPageLinks(url);
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

  try {
    while (pageToVisit.size > 0) {
      const url = pageToVisit.values().next().value;
      pageToVisit.delete(url);

      try {
        const response = await checkPageStatusAndGetLinks(url);
        console.log('Crawling:', url, response.statusCode);
        if (response.statusCode === 404) brokenLinks.add(url);
        response.links.forEach((link) => {
          if (!allPages.has(link)) {
            allPages.add(link);
            pageToVisit.add(link);
          }
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
