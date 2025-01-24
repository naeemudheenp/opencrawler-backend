import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Resend } from 'resend';
const { parseStringPromise } = require('xml2js');

@Processor('emailQueue')
export class EmailProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    const resend = new Resend('re_Mvnz2kcJ_6LbmNMnxezBNyHWC6a5VDwHg');
    await resend.emails.send({
      from: 'opencrawler <no-replay@opencrawler.in>',
      to: [job.data.email],
      subject: 'Crawling Initiated',
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          color: #333;
          margin: 0;
          padding: 0;
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          text-align: center;
          border-bottom: 1px solid #e5e5e5;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .email-header h1 {
          font-size: 24px;
          color: #2c3e50;
        }
        .email-content {
          font-size: 16px;
          line-height: 1.8;
        }
        .email-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          font-size: 14px;
          color: #777;
        }
        .email-footer a {
          color: #3498db;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Crawling Initiated</h1>
        </div>
        <div class="email-content">
          <p>Dear User,</p>
          <p>
            Thank you for choosing <strong>Opencrawler</strong> to analyze your website. We have successfully initiated the crawling process for your website.
          </p>
          <p>
            Please note that this process may take some time, depending on the size and complexity of your site. Once the scan is complete, we will send you a detailed report with the results.
          </p>
          <p>
            If you have any questions in the meantime, feel free to reach out to our support team.
          </p>
        </div>
        <div class="email-footer">
          <p>Best regards,</p>
          <p><strong>Opencrawler Team</strong></p>
          <p>
            <a href="https://opencrawler.in" target="_blank">Visit our website</a> | 
          
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
    });

    let brokenUrl = [];
    let allPages = [];

    const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url);

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
      let response = await fetchWithRetry(new URL(job.data.url));
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

    await resend.emails.send({
      from: 'opencrawler <no-replay@opencrawler.in>',
      to: [job.data.email],
      subject: 'Crawling Completed',
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          color: #333;
          margin: 0;
          padding: 0;
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          text-align: center;
          border-bottom: 1px solid #e5e5e5;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .email-header h1 {
          font-size: 24px;
          color: #2c3e50;
        }
        .email-content {
          font-size: 16px;
          line-height: 1.8;
        }
        .highlight {
          color: #e74c3c;
          font-weight: bold;
        }
        .broken-links {
          background-color: #f2f2f2;
          padding: 10px;
          border: 1px solid #e5e5e5;
          border-radius: 5px;
          font-family: monospace;
          font-size: 14px;
        }
        .email-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          font-size: 14px;
          color: #777;
        }
        .email-footer a {
          color: #3498db;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Opencrawler Report</h1>
        </div>
        <div class="email-content">
          <p>Dear User,</p>
          <p>
            Thank you for choosing <strong>Opencrawler</strong> for your crawling needs. Here is a summary of your request:
          </p>
          <ul>
            <li>Total pages scanned: <span class="highlight">${allPages.length}</span></li>
            <li>Number of broken links found: <span class="highlight">${brokenUrl.length}</span></li>
          </ul>
          <p>
            Below is the list of broken links detected during the crawl:
          </p>
          <div class="broken-links">
            ${brokenUrl.join('<br>')}
          </div>
          <p>
            We hope this report helps you address the issues found. If you have any questions, feel free to contact our support team.
          </p>
        </div>
        <div class="email-footer">
          <p>Best regards,</p>
          <p><strong>Opencrawler Team</strong></p>
          <p>
            <a href="https://opencrawler.in" target="_blank">Visit our website</a> | 
      
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
    });
  }

  @OnWorkerEvent('completed')
  onCompleted() {}
}
