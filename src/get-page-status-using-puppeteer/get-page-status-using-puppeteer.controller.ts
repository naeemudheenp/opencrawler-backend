import { Controller, Get, Query, Res } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { Response } from 'express';

let browser;

// Initialize the browser instance
async function getBrowser() {
  if (browser) return browser;

  // Use Render's provided Chromium binary path
  const executablePath = process.env.CHROME_BIN || '/usr/bin/chromium';

  browser = await puppeteer.launch({
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process',
      '--no-zygote',
    ],
    headless: true,
  });

  return browser;
}

// Cleanup browser instance on process exit
process.on('exit', async () => {
  if (browser) {
    await browser.close();
  }
});

// Function to check page status and fetch internal links
async function checkPageStatusAndGetLinks(url) {
  let statusCode = 404;
  let links = [];

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Navigate to the URL
    const response = await page.goto(url, { waitUntil: 'networkidle0' });

    // Check if the page loaded successfully
    if (response && response.status() === 200) {
      statusCode = 200;

      // Extract domain to filter internal links
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;

      // Collect all internal links
      links = await page.$$eval(
        'a',
        (anchors, domain) => {
          return anchors
            .map((anchor) => anchor.href)
            .filter((href) => {
              try {
                const linkDomain = new URL(href).hostname;
                return linkDomain === domain; // Filter links within the same domain
              } catch {
                return false; // Ignore invalid URLs
              }
            });
        },
        domain,
      );
    }

    await page.close();
  } catch (error) {
    console.error('Error fetching page:', error);
  }

  return { statusCode, links };
}

// Controller to handle the GET request
@Controller('get-page-status-using-puppeteer')
export class GetPageStatusUsingPuppeteerController {
  @Get()
  async getPageStatusUsingPuppeteer(
    @Query('url') url: string,
    @Res() res: Response,
  ) {
    // Validate input URL
    if (!url) {
      return res.status(400).json({
        error: 'URL parameter is required',
      });
    }

    const { statusCode, links } = await checkPageStatusAndGetLinks(url);

    // Return results based on status code
    if (statusCode === 200) {
      return res.status(200).json({ links });
    } else {
      return res.status(404).json({ links });
    }
  }
}
