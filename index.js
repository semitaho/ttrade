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
  console.log('trade completed.')

};
// Call start
(async() => {
    console.log('before start');
    await doJob();
    console.log('after start');
  })();

