import puppeteer, { Page } from "puppeteer";

const browser = await puppeteer.launch({
    headless: false,
    dumpio: true
});
const timeout = 5000;


async function acceptAllCookies(page) {
    await page.click("#cookie-accept-all-secondary");
}

async function clickButtonContainingText(page, textToContain) {
    const [btn] = await page.$x(`//button[contains(., '${textToContain}')]`);
    if (btn) {
        await btn.click();
    }
}
async function selectSecondaryLogin(page) {
    await clickButtonContainingText(page, "toinen kirjautumistapa");
    await clickButtonContainingText(page, "käyttäjätunnus ja salasana")

}

async function loginWithUsernameAndPassword(page) {
    const fieldsAndValues = {
        username: process.env.NORDNET_EMAIL,
        password: process.env.NORDNET_PASSWORD
    };
    
    const names = Object.keys(fieldsAndValues)
    for (const key of names) {
        const value = fieldsAndValues[key];

        await page.type(`input[name=${key}]`, value);
     //   await page.$eval(`input[name=${key}]`, (el, val) => el.value = val, value);
    }
    await clickButtonContainingText(page, "Kirjaudu sisään");
}

const page = await browser.newPage();
await page.goto("https://www.nordnet.fi/kirjaudu");
await acceptAllCookies(page);
await selectSecondaryLogin(page);
await loginWithUsernameAndPassword(page);