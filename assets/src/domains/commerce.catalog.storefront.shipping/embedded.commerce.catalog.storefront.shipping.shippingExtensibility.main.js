// Production version using Real EasyPost SDK
const { EasyPostSdk } = require('../../easypost/easypostsdk');
const { route, getConfig } = require('./shared-shipping-logic');

function getEasyPostClient(context) {
  const config = getConfig(context);
  return new EasyPostSdk(config, false); // false = production mode
}

module.exports = function (context, callback) {
  route(context, callback, getEasyPostClient)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};
