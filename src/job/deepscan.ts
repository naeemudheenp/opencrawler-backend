import puppeteer from 'puppeteer';
import { Emailer } from 'src/emails/emailer';

let browser: any = null;

async function getBrowser() {
  if (browser) return browser;

  if (process.env.NEXT_PUBLIC_VERCEL_ENVIRONMENT === 'production') {
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
    });
  } else {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
  }

  return browser;
}

async function checkPageStatusAndGetLinks(url: string) {
  let statusCode = 404;
  let links: string[] = [];

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    const response = await page.goto(new URL(url), {
      waitUntil: 'networkidle0',
    });

    statusCode = response?.status() === 200 ? 200 : 404;

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
                console.log(e + 'error');
                return false;
              }
            });
        },
        domain,
      );
    }
  } catch (error) {
    console.error(`Error fetching page ${url}:`, error);
  }

  return { statusCode, links };
}

export async function deepScan(initialUrl: string, email: string) {
  const allPages = new Set<string>([initialUrl]);
  const brokenLinks = new Set<string>();
  const pageToVisit = [initialUrl];
  const emailer = new Emailer();

  while (pageToVisit.length > 0) {
    const url = pageToVisit.shift();
    if (!url) continue;

    const response = await checkPageStatusAndGetLinks(url);

    if (response.statusCode !== 200) {
      brokenLinks.add(url);
    }

    response.links.forEach((link) => {
      if (!allPages.has(link)) {
        allPages.add(link);
        pageToVisit.push(link);
      }
    });
  }
  await emailer.crawlingCompletedEmail(email, brokenLinks, allPages);
}
