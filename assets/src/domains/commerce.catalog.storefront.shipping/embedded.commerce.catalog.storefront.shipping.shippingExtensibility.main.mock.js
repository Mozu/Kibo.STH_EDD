// Development version using Mock EasyPost SDK
const { MockEasyPostSdk } = require('../../easypost/mockEasyPostSdk');
const { route } = require('./shared-shipping-logic');

function getEasyPostClient(context) {
  return new MockEasyPostSdk(context);
}

module.exports = function (context, callback) {
  console.log('ok');
  route(context, callback, getEasyPostClient)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};


