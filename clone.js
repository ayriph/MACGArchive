const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const START_URL = 'https://melbacg.au';
const OUTPUT_DIR = './mirror';

const visited = new Set();
const downloaded = new Set();
const queue = [START_URL];

function cleanPathFromUrl(url) {
  const u = new URL(url);

  // remove query/hash
  let filePath = u.pathname;

  // if it's a directory → index.html
  if (filePath.endsWith('/')) filePath += 'index.html';

  return filePath;
}

function urlToFilePath(url) {
  return path.join(OUTPUT_DIR, cleanPathFromUrl(url));
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  );

  await page.setRequestInterception(true);
  page.on('request', req => req.continue());

  // 🔥 Capture ALL non-HTML responses
  page.on('response', async (res) => {
    try {
      const url = res.url();

      // skip if already downloaded
      if (downloaded.has(url)) return;

      const headers = res.headers();
      const contentType = headers['content-type'] || '';

      // skip HTML pages (handled separately)
      if (contentType.includes('text/html')) return;

      const buffer = await res.buffer();

      const filePath = path.join(
        OUTPUT_DIR,
        cleanPathFromUrl(url)
      );

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, buffer);

      downloaded.add(url);

      console.log('Saved asset:', filePath);

    } catch (e) {}
  });

  while (queue.length > 0) {
    const currentUrl = queue.shift();

    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    console.log('Visiting:', currentUrl);

    try {
      await page.goto(currentUrl, { waitUntil: 'networkidle2' });

      await autoScroll(page);

      const html = await page.content();
      const $ = cheerio.load(html);

      // 🔗 Extract ALL links (pages + files)
      $('[href], [src]').each((_, el) => {
        let link = $(el).attr('href') || $(el).attr('src');
        if (!link) return;

        // normalize relative URLs
        if (link.startsWith('/')) {
          link = new URL(link, START_URL).href;
        }

        // skip external domains
        if (!link.startsWith(START_URL)) return;

        // add to crawl queue if not visited
        if (!visited.has(link)) {
          queue.push(link);
        }
      });

      // 🔁 Rewrite links for offline use
      $('[href], [src]').each((_, el) => {
        let attr = $(el).attr('href') ? 'href' : 'src';
        let link = $(el).attr(attr);
        if (!link) return;

        if (link.startsWith(START_URL)) {
          const localPath = urlToFilePath(link);

          const relativePath = path.relative(
            path.dirname(urlToFilePath(currentUrl)),
            localPath
          );

          $(el).attr(attr, relativePath);
        }
      });

      // 💾 Save HTML
      const outputPath = urlToFilePath(currentUrl);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, $.html());

    } catch (err) {
      console.log('Failed:', currentUrl);
    }
  }

  await browser.close();
})();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;

      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}