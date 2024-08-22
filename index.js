const { doJob }  = require('./work');

/**
 * Background Cloud Function to be triggered by Pub/Sub.
 * This function is exported by index.js, and executed when
 * the trigger topic receives a message.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */

exports.checkStocks = async (req, res) => {
  console.log('starting to trade');
  await doJob();
  console.log('trade completed.')

};