import puppeteer from "puppeteer";
import { PageTarget } from "puppeteer";

const proxyUrls = [
  "65.109.232.223",
  // 'http://43.132.172.26:3128',
  // Add more proxy URLs here
];
// List of User-Agent strings
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A5341f Safari/604.1",
  "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:92.0) Gecko/20100101 Firefox/92.0",
];

// Function to get a random User-Agent
function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
async function createBrowser() {
  const randomProxyUrl =
    proxyUrls[Math.floor(Math.random() * proxyUrls.length)];

  console.log("random:" + randomProxyUrl);

  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--lang=fi-FI",
      "--disable-setuid-sandbox",
      "--no-first-run",
      "--no-zygote",
    ],
    headless: process.env.HEADLESS || false,
  });
  const page = await browser.newPage();

  await page.setDefaultTimeout(0);
  await page.setViewport({
    width: 1280,
    height: 1024,
  });

  return [page, browser];
}
export async function navigateMedium() {
  const [page, browser] = await createBrowser();
  page.setUserAgent(getRandomUserAgent());
  const client = await page.target().createCDPSession();
  await client.send("Network.clearBrowserCookies");

 
  await page.goto("https://medium.com/@semitaho");
  
  const selector = `//article//a`;

  const pages = await page.$$eval("xpath/.//article//a[descendant::h2]", links => links.map(a => a.href));
  console.log('web pages',pages);

  
  for (const webpage of pages) {
    await page.goto(
       webpage
    );
    console.log('reading page: '+webpage);
    await readPage(page);
    console.log('reading page: '+webpage+", done");

  }
  //await browser.close();
  console.log('all ok..');
  
 
}

async function readPage(page) {
  await page.evaluate(async () => {
    function getRandomIntInclusive(min, max) {
      const minCeiled = Math.ceil(min);
      const maxFloored = Math.floor(max);
      return Math.floor(
        Math.random() * (maxFloored - minCeiled + 1) + minCeiled
      ); // The maximum is inclusive and the minimum is inclusive
    }

    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = getRandomIntInclusive(30, 40); // distance to scroll each step (in pixels)
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        console.log(`navigation height: ${totalHeight} of ${document.body.scrollHeight}`);

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          console.log("PAGE read successfully!");
          resolve();
        }
      }, 100); // delay between each scroll (in milliseconds)
    });
  });
}
