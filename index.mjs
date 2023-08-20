import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
    headless: false
});
const page = await browser.newPage();
await page.goto("https://www.nordnet.fi/kirjaudu")