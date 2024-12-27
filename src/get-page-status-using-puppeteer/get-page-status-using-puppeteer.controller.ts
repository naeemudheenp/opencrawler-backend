import { Controller, Get, Query, Res } from '@nestjs/common';
import chromium from '@sparticuz/chromium-min';
import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer';
import { Response } from 'express';

const remoteExecutablePath =
  'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar';

let browser;

async function getBrowser() {
  if (browser) return browser;

  if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'productions') {
    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(remoteExecutablePath),
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

async function checkPageStatusAndGetLinks(url) {
  let statusCode;
  let links = [];
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Wait for the page to load completely
    const response = await page.goto(url, { waitUntil: 'networkidle0' });
    statusCode = response && response.status() === 200 ? 200 : 404;

    // Fetch all anchor tags if the page loaded successfully
    if (statusCode === 200) {
      // Extract the domain from the input URL
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;

      // Fetch all links and filter them by domain
      links = await page.$$eval(
        'a',
        (anchors, domain) => {
          return anchors
            .map((anchor) => anchor.href)
            .filter((href) => {
              try {
                const linkDomain = new URL(href).hostname;
                return linkDomain === domain; // Only include links from the same domain
              } catch (e) {
                return false; // Ignore invalid or malformed URLs
              }
            });
        },
        domain,
      );
    }

    await page.close();
  } catch (error) {
    statusCode = 404;
  }
  return { statusCode, links };
}

@Controller('get-page-status-using-puppeteer')
export class GetPageStatusUsingPuppeteerController {
  @Get()
  async getPageStatusUsingPuppeteer(
    @Query('url') url: string,
    @Res() res: Response,
  ) {
    if (!url) {
      res.status(200).json({
        text: 'URL parameter is required',
      });
    }

    const { links } = await checkPageStatusAndGetLinks(url);
    if (links.length > 0) {
      res.status(200).json({
        links: links,
      });
    } else {
      res.status(404).json({
        links: links,
      });
    }
  }
}
