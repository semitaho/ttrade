const fetch = require('node-fetch');
const { calculateSMA, calculateEMA, calculateRSI, calculateSignal, calculateValue, filterBySignal } = require('./indicators');
const { formatDateAddTime, formatDateToStr } = require('./util');


const TONIS_POPULAR_STOCKS = ['STCBV', 'SAMPO', 'KNEBV', 'NOKIA'];
async function fetchMostPopularStocks() {
  return TONIS_POPULAR_STOCKS;
  /*
  
  return fetch("https://sentiment.inderes.fi/requestQuickTopList")
          .then(res => res.json())
          .then((data) => data.topList )
          .then((topList) => topList.sort((stockA, stockB) => stockA.position - stockB.position))
          .then((topListSorted) => topListSorted.map((stock) => stock.name) );
          */
}

async function fetchStockIds() {
  return fetch('https://www.kauppalehti.fi/api/pages/stocklist/XHEL')
    .then(res => res.json())
    .then(results => results.shares);

}

exports.fetchStocks = async function (yleistiedot) {
  const currentDate = new Date();
  const minDate = new Date();
  minDate.setDate(currentDate.getDate());
  const minDateStr = formatDateToStr(minDate);
  console.log('min date str', minDateStr);

  let populars = await fetchMostPopularStocks();
  let stockIds = await fetchStockIds();
  const popularStocks = stockIds
    .filter(stock => populars.some(popular => stock.symbol.toLowerCase() === popular.toLowerCase()));
  //https://sandbox.millistream.com/mws.fcgi?usr=sandbox&pwd=sandbox&cmd=trades&fields=insref,name,time,tradeprice&limit=300&timezone=Europe/Helsinki&insref=469&filetype=json&orderby=time&order=desc&startDate=2020-02-04
  const promises = popularStocks
    .filter(osake => !yleistiedot || yleistiedot.avoimetToimeksiannot.indexOf(osake.symbol) === -1)
    .map(osake =>

      fetch('https://chart.millistream.com/html5/millistream/dataservice.php?q=cmd%3Dtrades%26compress%3D1%26adjusted%3D1%26fields=insref,name,symbol,date,time,tradeprice,tradecode%26insref%3D' + osake.insRef + '%26limit=20%26orderby=date,time%26startdate=' + minDateStr + '%26order%3Ddesc%2Cdesc%26timezone=Europe/Helsinki')
        //fetch('https://chart.millistream.com/html5/millistream/dataservice.php?q&cmd=trades&fields=insref,name,time,tradeprice&timezone=Europe/Helsinki&insref='+osake.insRef+'&filetype=json&orderby=time&order=desc&startdate=2020-02-06')  
        .then(res => res.json())
        .then(jsonOsake => {
          return {
            id: osake.symbol,
            name: osake.name,
            insref: osake.insRef,
            stocks: !jsonOsake.length ? [] : jsonOsake[0].trade.map(item => {
              return {

                aika: formatDateAddTime(new Date(), item.time),
                suomiaika: item.date + ' ' + item.time,
                closed: item.tradeprice
              };
            })
          };
        })
        .then(stockTrader => Object.assign(
          {},
          stockTrader,
          {
            stocks: filterBySignal( yleistiedot, stockTrader.id,  calculateValue(calculateSignal(calculateRSI(calculateEMA((calculateSMA(stockTrader.stocks)))))))
          }
        )));
  return Promise.all(promises);

}
