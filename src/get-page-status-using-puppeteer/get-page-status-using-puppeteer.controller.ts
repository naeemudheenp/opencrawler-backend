import { Controller, Get, Query, Res } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { Response } from 'express';

async function checkPageStatusAndGetLinks(url: string) {
  let statusCode = 404;
  let links: string[] = [];

  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process',
      '--no-zygote',
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(15000);

    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

    if (response?.status() === 200) {
      statusCode = 200;

      const domain = new URL(url).hostname;

      links = await page.$$eval(
        'a',
        (anchors, domain) =>
          anchors
            .map((anchor) => anchor.href)
            .filter((href) => {
              try {
                return new URL(href).hostname === domain;
              } catch {
                return false;
              }
            }),
        domain,
      );
    }

    await page.close();
  } catch (error) {
    console.error('Error fetching page:', error);
  } finally {
    await browser.close();
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
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const { statusCode, links } = await checkPageStatusAndGetLinks(url);

    return res.status(statusCode).json({ links });
  }
}
