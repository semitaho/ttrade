const puppeteer = require('puppeteer');
const { calculateEMA, calculateRSI, calculateSignal, calculateValue, calculateSMA, SUMMAPERINDIKAATTORI } = require('./indicators');
const { formatDateToStr, formatTime } = require('./util');
exports.createBrowser = async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--lang=fi-FI',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-zygote',], headless: process.env.HEADLESS || false
  });
  const page = await browser.newPage();
  await page.setDefaultTimeout(0);
  await page.setViewport({
    width: 1280,
    height: 1024
  });

  return page;
}

exports.loginNetsuite = async (page) => {

  await page.goto('https://system.na0.netsuite.com/pages/customerlogin.jsp');
  console.log('navigation success...');
  await page.waitFor('input[id=userName]');
  await page.type('#userName', 'toni@tahoo.fi');
  console.log('username given');
  await page.waitFor(500);
  await page.type('#password', process.env.NORDNET_PASSWORD);
  console.log('password given');
  await page.waitFor(500)
  await page.click('#submitButton');



}
exports.login = async (page) => {
  await page.goto('https://www.nordnet.fi/fi');
  let link = await page.waitForXPath("//a[contains(., 'Kirjaudu sisään')]");

  await link.click();
  console.log('login info loaded');
  await page.waitFor('input[id=username]');
  await page.type('#username', process.env.NORDNET_USERNAME);
  await page.waitFor('input[id=password]');
  await page.type('#password', process.env.NORDNET_PASSWORD);
  await page.click('.button.primary');
  return await page.waitForNavigation();
}

exports.getCurrentOsakeMyyntihinta = async (page, osake) => {
  await page.goto(osake.myyhref);
  await page.waitFor('#price');
  const hinta = await page.$eval('#price', id =>  +(id.value.replace(',', '.')));
  return hinta;
};

const navigateToOsakePage = async (page, osake) => {

  const button = await page.waitForXPath("//button[contains(., 'Etsi')]");
  await button.click();
  const el = await page.evaluateHandle(() => document.activeElement);
  await el.type(osake.nimi);
  await page.waitFor(500);
  const path = "//div[contains(., 'Osakkeet')]/ul/li/a";
  await page.waitForXPath(path);
  const data = await page.$x(path);
  const url = await page.evaluate((ahref) => {
    return ahref.href+'/toimeksianto/osta?accid=3';

  }, data[0])
  await page.goto(url);
  return url;
 
};

exports.keraaOsakeData = async (page, osake) => {
  console.log('collect osakedata from', osake.nimi);
  page.removeAllListeners('response');
  await navigateToOsakePage(page,osake);

  let osakeDataPromise = new Promise(resolve =>
    page.on('response', async interceptedRequest => {
      if (interceptedRequest.url().indexOf('instruments/historical') > -1) {
        const body = await interceptedRequest.json();
        resolve(calculateSignal(calculateValue(calculateRSI(calculateEMA(calculateSMA(body[0].prices
          .slice(-200)
          .map((tickit) => {
            const date = new Date(tickit.time);
            return {
              timestamp: tickit.time,
              aika: date,
              suomiaika: formatDateToStr(date) + ' ' + formatTime(date),
              closed: tickit.last
            };
          })))))));

      }
    }));
  let button = await page.waitForXPath("//button[contains(., '1 vk')]");
  await button.click();
  button = await page.waitForXPath("//button[contains(., '1 pv')]");
  await button.click();
  const osakeData = await osakeDataPromise;
  return osakeData;

};

exports.keraaSeurantalistaOsakkeet = async (page) => {
  await page.goto('https://www.nordnet.fi/seurantalistat/407631');
  const data = await page.$x("//table[contains(., 'Osakekurssitaulukko')]/tbody/tr");
  const kaikki = await page.evaluate((...elements) => {
    return elements.map(row => {
      return {
        ostahref: row.childNodes[1].firstChild.firstChild.href,
        myyhref: row.childNodes[1].firstChild.lastChild.href,
        href: row.childNodes[3].firstChild.href,
        nimi: row.childNodes[3].textContent,
        prefixNimi: row.childNodes[3].textContent.substring(0, row.childNodes[3].textContent.indexOf('...'))
      };
    });

  }, ...data);

  return kaikki;

}

const fillOrKill = async (page) => {
  await page.waitFor('#instrument-order-orderType');
  await page.click('#instrument-order-orderType');
  await page.waitFor('#instrument-order-orderType-option-2');
  await page.click('#instrument-order-orderType-option-2');
};


exports.fetchVertailut = async (page) => {
  await page.goto('https://www.inderes.fi/fi/osakevertailu');
  await page.waitFor('#recommendations');
  const handles =  await page.$$('.rt-tr-group');
  const kaikki = await page.evaluate((...elements) => {
    return elements.map(row => {
      return {
        nimi: row.getElementsByClassName('Name')[0].textContent,
        potentiaali: parseInt(row.firstChild.childNodes[2].textContent.trim(), 10),
        suositus: row.firstChild.childNodes[3].textContent.trim()


      };
    });

  }, ...handles);
  return kaikki;

}

exports.buy = async (page) => {
  /* await page.goto(ostahref);
  await page.waitFor('#instrument-order-accounts-select');
  await page.click('#instrument-order-accounts-select');

  await page.waitFor('#instrument-order-accounts-select-option-1');
  await page.click('#instrument-order-accounts-select-option-1');
  */
  await fillOrKill(page);
  const priceElem = await page.waitFor('#price');
  const kurssiNykyinen = await page.evaluate(input => input.value, priceElem)
  const sijoitaRahhoo = Math.floor(SUMMAPERINDIKAATTORI / (+kurssiNykyinen.replace(',', '.')));
  await page.type('#volume', sijoitaRahhoo.toString());
  const button = await page.waitForXPath("//button[contains(., 'Osta')]");
  await button.click();



}

exports.sell = async (page, osakeInstrument) => {
  await page.goto(osakeInstrument.myyhref+'?accid=3');
  await fillOrKill(page);
  await page.waitFor('input[id=volume]');
  await page.type('#volume', osakeInstrument.maara.toString());
  await page.waitFor(1000);
  const button = await page.waitForXPath("//button[contains(., 'Myy')]");
  await button.click();
}


exports.fetchYleistiedot = async (page) => {
  return {
    saldo: await fetchSaldo(page),
    avoimetToimeksiannot: await fetchAvoimetToimeksiannot(page),
    osakkeet: await fetchOsakkeet(page),
  };
}

const fetchSaldo = async (page) => {
  await page.goto('https://www.nordnet.fi/yleisnakyma/tili/3');
  const spanHandle = await page.$x("//div[header[h2[contains(text(),'Käytettävissä')]]]/div//span/div");
  const text = await page.evaluate(body => body.textContent, spanHandle[0]);
  return parseInt(text.replace('EUR', '').replace(/\s/g, ''), 10);
};

const fetchOsakkeet = async(page) => {
  await page.goto('https://www.nordnet.fi/yleisnakyma/tili/3');
  const rows = await page.$x("//div[header//*[contains(text(), 'Pörssilistatut')]]//table/tbody/tr");
  console.log('omat osakkeet count', rows.length);
  const kaikki = await page.evaluate((...elements) => {
    return elements.map(row => {
      return {
        nimi: row.childNodes[1].getElementsByTagName('a')[0].textContent.replace('Finland', ''),
        insref: row.childNodes[1].firstChild.firstChild.lastChild.textContent.replace('Finland', ''),
        myyhref: row.childNodes[0].firstChild.firstChild.firstChild.lastChild.href,
        maara: +row.childNodes[2].textContent,
        kurssi: +(row.childNodes[3].textContent.replace('EUR', '').replace(',', '.').trim())
      };
    });

  }, ...rows);
  return kaikki;

}

const fetchAvoimetToimeksiannot = async (page) => {
  await page.goto('https://www.nordnet.fi/toimeksiannot-kaupat');
  const rows = await page.$x("//div[header//*[contains(text(), 'Pörssilistatut')]]//table/tbody/tr");
  const kaikki = await page.evaluate((...elements) => {
    return elements.map(row => {
      return {
        insref: row.childNodes[2].textContent,
        href: row.childNodes[2].getElementsByTagName('a')[0].href

      };
    });

  }, ...rows);
  return kaikki;
};
