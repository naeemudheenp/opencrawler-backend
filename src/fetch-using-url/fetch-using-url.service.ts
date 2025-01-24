import { Injectable } from '@nestjs/common';
const { parseStringPromise } = require('xml2js');

@Injectable()
export class FetchUsingUrlService {
  public async crawlSitemap(initialUrl: string) {
    let brokenUrl = [];
    let allPages = [];

    const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url);

          if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
          return response;
        } catch (error) {
          console.warn(`Retry ${i + 1} for ${url}: ${error}`);
          if (i === retries - 1) throw error;
          await new Promise((resolve) => setTimeout(resolve, delay * 2 ** i));
        }
      }
    };

    const processUrlsInBatches = async (urls, batchSize = 10) => {
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (url) => {
            try {
              const response = await fetchWithRetry(url);
              if (response.status != 200) {
                brokenUrl.push(url);
              }

              allPages.push(url);
            } catch (error) {
              console.log(error, 'error');
            }
          }),
        );
      }
    };

    try {
      let response = await fetchWithRetry(initialUrl);
      const xml = await response.text();
      const result = await parseStringPromise(xml);
      let urls = [];

      if (result.sitemapindex) {
        const sitemapUrls = result.sitemapindex.sitemap.map(
          (entry) => entry.loc[0],
        );

        for (const sitemapUrl of sitemapUrls) {
          await new Promise((resolve) => setTimeout(resolve, 500)); // Throttle requests
          const subResponse = await fetchWithRetry(sitemapUrl);
          const subXml = await subResponse.text();
          const subResult = await parseStringPromise(subXml);

          try {
            const subUrls = subResult.urlset.url.map((entry) => entry.loc[0]);
            urls = urls.concat(subUrls);
          } catch {
            console.warn(`No valid URLs found in ${sitemapUrl}`);
          }
        }
      } else {
        urls = result.urlset.url.map((entry) => entry.loc[0]);
      }

      await processUrlsInBatches(urls, 10);
    } catch (error) {
      console.error('Failed to parse sitemap:', error);
    }

    return { brokenUrl, allPages };
  }
}
