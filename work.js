const fetch = require('node-fetch');

const { createBrowser, fetchYleistiedot, fetchVertailut, getCurrentOsakeMyyntihinta, acceptCookies, login, navigateToOsakePage, keraaOsakeData, keraaSeurantalistaOsakkeet, buy, sell } = require('./nordnet-robot');
const { VOITTO, VALITYSPALKKIOBUYSELL, SUMMAPERINDIKAATTORI } = require('./indicators');

const AIKA_BETWEEN_MINUTES = 5;
function aikaBetween(currentTime, osake) {
  var diff = (currentTime.getTime() - osake.aika.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

const namesEqual = (osake1, osake2) => {
  const osakeLower1 = osake1.toLowerCase();
  const osakeLower2 = osake2.toLowerCase();
  return osakeLower1.indexOf(osakeLower2) >= 0 || osakeLower2.indexOf(osakeLower1) >= 0;


};

const shouldSellOrDecrease = (inderesSellList, osakeInstrument) => {
  const recommendToSell = !!inderesSellList.find((sellItem) => namesEqual(sellItem.nimi, osakeInstrument.nimi));
  console.log('recommendToSell', osakeInstrument.nimi, recommendToSell);
  return recommendToSell;
};

const checkSellOsake = async (page, inderesSellList, yleistiedot) => {
  for (let i = 0; i < yleistiedot.osakkeet.length; i++) {
    const osakeInstrument = yleistiedot.osakkeet[i];
    console.log('osake instrument for', osakeInstrument.nimi);
    const hasAvoinToimeksianto = yleistiedot.avoimetToimeksiannot.find(toimeksianto => toimeksianto.insref === osakeInstrument.insref);
    if (hasAvoinToimeksianto) {
      console.log('has already avoin toimeksianto', osakeInstrument.nimi);
      continue;
    }
    const hinta = await getCurrentOsakeMyyntihinta(page, osakeInstrument);
    const canSell = shouldSellOrDecrease(inderesSellList, osakeInstrument) && ((osakeInstrument.maara * osakeInstrument.kurssi) + VALITYSPALKKIOBUYSELL + VOITTO) <= (hinta * osakeInstrument.maara);
    if (canSell) {
      console.log('NYT MYYDÄÄN osake: ' + osakeInstrument.nimi + ' markkinahintaan.');
      await sell(page, osakeInstrument);
      console.log('SOLD osake for toimeksianto: ' + osakeInstrument.nimi);
      return true;
    }
  }
  return false;
};

exports.doJob = async () => {

  const page = await createBrowser();
  await page.goto('https://www.nordnet.fi/kirjaudu');
  await acceptCookies(page);
  await login(page);
  /*
  const yleistiedot = await fetchYleistiedot(page);

  const inderesBuyList = inderesList.filter((instrument) => instrument.suositus === 'Lisää' || instrument.suositus === 'Osta')
    .sort((a, b) => {
      if (a.suositus === 'Osta' && b.suositus === 'Lisää') {
        return -1;
      }
      if (b.suositus === 'Osta' && a.suositus === 'Lisää') {
        return 1;
      }
      return b.potentiaali - a.potentiaali;
    }).slice(0,20);
  const inderesSellList = inderesList.filter((instrument) => instrument.suositus === 'Vähennä' || instrument.suositus === 'Myy');
  const sold = await checkSellOsake(page, inderesSellList, yleistiedot);

  if (sold) {
    console.log('Osake sold, QUITTING');
    return;
  }
  console.log('buy list', inderesBuyList);
  
  if (yleistiedot.saldo - (VALITYSPALKKIOBUYSELL / 2) < SUMMAPERINDIKAATTORI) {
    console.log('no nyt ei ole varaa sijoittaa mihinkään! Saldo: ' + yleistiedot.saldo);
    return;
  }
  
  let currentDate = new Date();
  for (let index = 0; index < inderesBuyList.length; index++) {
    let osakeItem = inderesBuyList[index];
    const foundOsake = yleistiedot.osakkeet.find((yleistietoOsake) => namesEqual(yleistietoOsake.nimi, osakeItem.nimi));
    if (foundOsake) {
      console.log('youve GOT already osake: '+osakeItem.nimi);
      continue;
    }
    const avoinAnto = yleistiedot.avoimetToimeksiannot.find((toimeksianto) => toimeksianto.href.indexOf(osake.href) > -1);
    if (avoinAnto) {
      console.log('FOUND avoin ' + osake.nimi + ', so skipping it...');
      continue;
    }
    const osakeData = await keraaOsakeData(page, osakeItem);
    const osakeSignal = osakeData
      .reverse()
      .filter(osakeCurrent => osakeCurrent.signal && osakeCurrent.signal === 'buy')
      .filter(osakeCurrent => aikaBetween(currentDate, osakeCurrent) <= AIKA_BETWEEN_MINUTES)
      .find(osakeCurrent => osakeCurrent);
    if (osakeSignal) {
      console.log('GOT OSAKESIGNAL!!!', osakeSignal);
      await buy(page);
      console.log('BOUGHT osake for toimeksianto', osakeItem.nimi);
      break;
    }
  }

    */

}