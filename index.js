
/**
 * Background Cloud Function to be triggered by Pub/Sub.
 * This function is exported by index.js, and executed when
 * the trigger topic receives a message.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */

import functions  from '@google-cloud/functions-framework';
import  { navigateMedium } from './medium.js';

// Register an HTTP function with the Functions Framework that will be executed
// when you make an HTTP request to the deployed function's endpoint.
functions.http('readArticles', async(req, res) => {
  await navigateMedium();
  res.send('ok');
});


