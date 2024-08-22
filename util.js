exports.formatTime = date => {
    return date.toLocaleTimeString('fi-FI');
  }
  
  exports.formatDateToStr = date => {
    return date.toLocaleDateString()
      .split('-')
      .map(datePart => {
        if (datePart.length >= 2) {
          return datePart;
        }
        return '0' + datePart;
  
      })
      .join('-');
  
  };
  
  exports.formatDateAddTime = (date, time) => {
  
    const currentDate = new Date(date);
    const [hours, minutes, seconds] = time.split(':');
    currentDate.setHours(+hours);
    currentDate.setMinutes(+minutes);
    currentDate.setSeconds(+seconds);
    return currentDate;
  }
  
  exports.formatSignal = signal => {
    if ('sell' === signal) {
      return 'MYY';
    }
  
    if ('buy' === signal) {
      return 'OSTA';
    }
    return '';
  }