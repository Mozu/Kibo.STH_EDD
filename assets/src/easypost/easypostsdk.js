//var _ = require("underscore");
const { ApiService } = require('../utils/apiService');
const { api_url_sandbox, api_url_prod, deliver_by_route} = require('./constants');
const {EasyPostShipment} = require("./models/Shipment");

function EasyPost(config, sandbox = false) {
    const headers = getHeaders(config.apiKey);
    this.apiWrapper = new ApiService(headers);
    const baseUrl = sandbox ? api_url_sandbox : api_url_prod;
    this.deliverByUrl = baseUrl + deliver_by_route;
}

//https://docs.easypost.com/docs/smartrate#smart-deliver-by
//body is SmartDeliverByRequest model
EasyPost.prototype.getSmartDeliverBy = async function(body) {
  try {
    const epDeliveryDates = await this.apiWrapper.post(this.deliverByUrl, body);
    return epDeliveryDates;
  }
  catch (e) {
    console.log('Error in getSmartDeliverBy: ', e);
    throw e;
    //return {};
  }
};

//easypost requires basic authorization with base64 encoded API key
// https://docs.easypost.com/docs/authentication
const getHeaders = function (apiKey, contentType = 'application/json') {
  return {
    'Content-Type': contentType,
    'Authorization': 'Basic ' + Buffer.from(apiKey).toString('base64')
  };
};

// Given a TransitTimesRequest, builds an EasyPost shipment
const buildShipment = function (requestBody) {
  return new EasyPostShipment(requestBody);
};

exports.EasyPostSdk = EasyPost;
