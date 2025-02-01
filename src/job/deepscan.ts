import puppeteer from 'puppeteer';
import { Emailer } from 'src/emails/emailer';

let browser: any = null;

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
      timeout: 60000,
    });

    console.log('Puppeteer browser launched');
  }
  return browser;
}

async function checkPageStatusAndGetLinks(
  url: string,
  retries = 3,
  delay = 5000,
) {
  const browser = await getBrowser();
  let statusCode = 404;
  let links: string[] = [];
  let page: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      page = await browser.newPage();
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      console.log(response, 'response', url);

      statusCode = response?.status() || 404;

      if (statusCode === 200) {
        const domain = new URL(url).hostname;
        links = await page.$$eval(
          'a',
          (anchors: HTMLAnchorElement[], domain: string) => {
            return anchors
              .map((anchor) => anchor.href)
              .filter((href) => {
                try {
                  return new URL(href).hostname === domain;
                } catch (e) {
                  console.error('Error parsing URL:', e);
                  return false;
                }
              });
          },
          domain,
        );
      }

      break;
    } catch (error) {
      console.error(`Error on attempt ${attempt} fetching page ${url}:`, error);
      if (attempt === retries) {
        throw new Error(`Failed after ${retries} attempts: ${url}`);
      }
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await sleep(delay);
    } finally {
      if (page) await page.close();
    }
  }

  return { statusCode, links };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deepScan(
  initialUrl: string,
  email: string,
  postActionApi: string,
) {
  const allPages = new Set<string>([initialUrl]);
  const brokenLinks = new Set<string>();
  const pageToVisit = [initialUrl];
  const emailer = new Emailer();
  const MAX_PAGES_TO_VISIT = 5000;

  try {
    await getBrowser();

    while (pageToVisit.length > 0) {
      if (allPages.size >= MAX_PAGES_TO_VISIT) {
        console.log('Reached page crawl limit, stopping further requests.');
        break;
      }

      const url = pageToVisit.shift();
      if (!url) continue;

      await sleep(500);

      try {
        const response = await checkPageStatusAndGetLinks(url);
        console.log('Crawling:', url);

        if (response.statusCode !== 200) {
          brokenLinks.add(url);
        }

        response.links.forEach((link) => {
          if (!allPages.has(link)) {
            allPages.add(link);
            pageToVisit.push(link);
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
