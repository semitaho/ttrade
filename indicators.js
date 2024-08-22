


exports.SUMMAPERINDIKAATTORI = process.env.SUMMAPERINDIKAATTORI || 950;

exports.VALITYSPALKKIOBUYSELL = process.env.VALITYSPALKKIOBUYSELL || 14;

exports.VOITTO = process.env.VOITTO || 2.5;

const RSI_DAYS = 14;
const RSI_HIGH = 70;
const RSI_LOW = 30;

const SHORT = process.env.SHORT || 12;
const SUPER_SHORT = process.env.SUPER_SHORT || 9;

const LONG = process.env.LONG || 30;


function calculateSmaFrom(array, start, end) {
  let sum = 0;
  for (let i = start; i <= end; i++) {
    sum += array[i].closed;
  }
  return sum / (end - start + 1);

}

function calculateEmaFrom(array, currentIndex, emaNumber) {
  const emaKey = 'ema' + emaNumber;
  const smaKey = 'sma' + emaNumber
  const multiplier =  2 / (emaNumber + 1);

  const lastStock = array[currentIndex - 1];
  const lastEma = lastStock[emaKey] ? lastStock[emaKey] : lastStock[smaKey];
  const currentStock = array[currentIndex];
  return (currentStock.closed * multiplier) + (lastEma * (1 - multiplier));
}




exports.calculateRSI = array => {
  return array.map((stock, index) => {
    if (index - RSI_DAYS >= 0) {

      doCalculate(array, index - RSI_DAYS, index, index - RSI_DAYS === 0)
    }
    return stock;
  });

}

function doCalculate(array, startIndex, endIndex, firstRsi) {
  let wins = 0;
  let loses = 0;
  const ending = firstRsi ? endIndex : endIndex - 1;
  for (let current = startIndex +  1; current <= ending; current++) {
    let value = array[current].closed - array[current - 1].closed;

    if (value < 0) {
      loses -= value;
    } else {
      wins += value;
    }
  }




  let rs;
  if (firstRsi) {
    let averageWins = wins / RSI_DAYS
    let averageLoses = loses / RSI_DAYS
    rs = averageWins / averageLoses;
    array[endIndex]["rsi_wins"] = averageWins;
    array[endIndex]["rsi_loses"] = averageLoses;
  } else {
    const tuottoTanaan = array[endIndex]['closed'] - array[endIndex - 1]['closed'];
    let averageWins = ((array[endIndex - 1]['rsi_wins'] * (RSI_DAYS - 1)) + (tuottoTanaan > 0 ? tuottoTanaan : 0)) / RSI_DAYS;
    let averageLoses = ((array[endIndex - 1]['rsi_loses'] * (RSI_DAYS - 1)) + (tuottoTanaan < 0 ? -tuottoTanaan : 0)) / RSI_DAYS;
    rs = averageWins / averageLoses;
    array[endIndex]["rsi_wins"] = averageWins;
    array[endIndex]["rsi_loses"] = averageLoses;

  }
  const RSI = 100 - (100 / (1 + rs));

  array[endIndex]['rsi'] = RSI;

}

exports.calculateValue = array => {
  return array.map(stock => {
    delete stock.rsi_wins;
    delete stock.rsi_loses;
    delete stock['sma' + LONG];
    delete stock['sma' + SHORT];
  
    if (stock['ema' + LONG] && stock['ema' + SHORT]) {
      stock['macd'] = stock['ema' + SHORT] - stock['ema' +  LONG]
    }
    delete stock['ema' + LONG];
    delete stock['ema' + SHORT];

    return stock;
  });
}

exports.calculateEMA = (array) => {
  
  return array.map((stock, currentIndex) => {
    if (currentIndex >= SHORT) {
      stock['ema' + SHORT] = calculateEmaFrom(array, currentIndex, SHORT);
    }

    if (currentIndex >= LONG) {
      stock['ema' + LONG] = calculateEmaFrom(array, currentIndex, LONG);
    }
    return stock;
   
  });

}

exports.calculateSMA = array => {
  return array.map((stock, index) => {
    if (index + 1 - SHORT >= 0) {
      stock['sma'+ SHORT]= calculateSmaFrom(array, (index + 1 - SHORT), index);
    }
    if (index + 1 - LONG >= 0) {
      stock['sma'+ LONG] = calculateSmaFrom(array, (index + 1 - LONG), index);
    }
    return stock;
  });
}

exports.calculateSignal = array => {
  return array.map((stock, index) => {
      if (stock.macd && stock.macd > 0 && array[index-1] && array[index-1].macd && array[index-1].macd < 0) {
        stock.signal = 'buy';
      }  else if (stock.macd && stock.macd < 0 && array[index-1] && array[index-1].macd && array[index-1].macd > 0) {
        stock.signal = 'sell';
      }
    
    return stock;
  });

}

exports.filterBySignal = (yleistiedot, id, array) => {
  return array
    .filter(stock => stock.signal)
    .filter((stock) => {

      if (stock.signal === 'buy') {
        return (!yleistiedot || !yleistiedot.osakkeet[id]) 
        && (!yleistiedot || yleistiedot.avoimetToimeksiannot.indexOf(id) === -1)
      }
      // selll
      return (yleistiedot && yleistiedot.osakkeet[id]) 
      && (!yleistiedot || yleistiedot.avoimetToimeksiannot.indexOf(id) === -1)

    });

}