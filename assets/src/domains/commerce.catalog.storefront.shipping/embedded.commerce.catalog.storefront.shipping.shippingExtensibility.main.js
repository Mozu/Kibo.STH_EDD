//var easypostWrapper = require('../../easypost/apiwrapper');
const { EasyPostSdk } = require('../../easypost/easypostsdk');
const {forEach} = require("underscore");
const {EstimatedDeliveryDate, TransitTimesResponse, CarrierTransitTimes, ValidationMessage } = require("../../models/TransitTimesResponse");
const {SmartDeliveryByRequest} = require("../../easypost/models/SmartDeliverByRequest");

module.exports = function (context, callback) {
  route(context, callback)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

const FULFILLMENT_METHOD_SHIP = "Ship"; //Kibo's STH FulfillmentMethod name
const FULFILLMENT_METHOD_DELIVERY = "Delivery"; //Kibo's Delivery FulfillmentMethod name

async function route(context, callback) {
  const request = context.get.request();
  const method = context.get.method();

  const requestContext = request.context;
  const requestPayload = request.request;

  console.log(`DEBUG method: ${method}, request context: `, requestContext);

  if (method === 'transit-times') {
    return await getTransitTimes(context, requestPayload);
  }
}

//Return list of unique carriers for given request
function getCarriersForRequest(request){
  const carriers = [];

  //TransitTimesRequest.ShippingServiceTypes will be formatted like <carrier>_<servicetype>
  request.shippingServiceTypes.forEach(str => {
    const carrier = str.split('_')[0].toLowerCase();
    if(!carriers.some(item => item === carrier)) {
      carriers.push(carrier);
    }
  });
  return carriers;
}

function getEasyPostClient(context) {
  const config = getConfig(context);
  return new EasyPostSdk(config, true);
}

function getConfig(context) {
  //MZDB SecureAppData
  const secureData = context.getSecureAppData('easypostConfig');
  return {
    apiKey: secureData.apiKey
  };
}

//Some UPS service types easypost responds with dont translate well to kibo definition for them...
function formatUpsServices(epService) {
  switch(epService) {
    case '2nddayair':
      return 'SECOND_DAY_AIR';
    case 'nextdayair':
      return 'NEXT_DAY_AIR';
    case '3dayselect':
      return 'THREE_DAY_SELECT';
    case 'nextdayairearly':
      return 'NEXT_DAY_AIR_EARLY';
    case 'nextdayairsaver':
      return 'NEXT_DAY_AIR_SAVER';
    case '2nddayairam':
      return 'SECOND_DAY_AIR_AM';
    case 'worldwideexpedited':
      return 'WORLDWIDE_EXPEDITED';
    case 'worldwideexpeditedplus':
      return 'WORLDWIDE_EXPRESS_PLUS';
    case 'worldwideexpeditedfreight':
      return 'WORLDWIDE_EXPRESS_FREIGHT';
    default:
      return epService.toUpperCase();
  }
}

function formatUspsServices(epService) {
  switch(epService) {
    case 'groundadvantage':
      return 'GROUND ADVANTAGE';
    case 'librarymail':
      return 'LIBRARY MAIL';
    case 'mediamail':
      return 'MEDIA MAIL';
    case 'firstclass':
      return 'FIRST CLASS';
    default:
      return epService.toUpperCase();
  }
}

//easypost and kibo do not use standardized format for carrier service types, so custom logic...
function formatServiceType(carrier, service) {
  const prefix = carrier.toLowerCase() + '_';
  switch(carrier.toLowerCase()) {
    case 'fedex':
      // eg) kibo wants 'fedex_FEDEX_2_DAY', easypost gives 'fedex_2_day'
      return prefix + service.toUpperCase();
    case 'ups': //
      // eg) kibo wants 'ups_UPS_SECOND_DAY_AIR', ep gives '2nddayairam'
      return prefix + carrier.toUpperCase() + '_' + formatUpsServices(service);
    case 'usps':
      // eg) kibo wants 'usps_GROUND ADVANTAGE', ep gives 'groundadvantage'
      return prefix + formatUspsServices(service);
    case 'canadapost':
      // eg) kibo wants 'canadapost_Expedited_Parcel', ep gives TODO
      return prefix + service.toUpperCase(); //TODO probably needs custom formatting
  }

}

//Given an EasyPost SmartDeliverByResponse, build a list of populated Kibo CarrierTransitTimes
function buildCarrierTransitTimesList(kiboServices, epResponse, itemIds) {
  // will populate transitTimes with list of CarrierTransitTimes
  let carrierTransitTimesList = [];

  //For each carrier result in EasyPost response...
  epResponse.results.forEach(function(result) {
    const shippingMethod = formatServiceType(result.carrier, result.service);
    console.debug('ep carrier/service: ' + result.carrier + ', ' + result.service);
    console.debug('translated to servicetype: ' + shippingMethod);

    //Ignore service types kibo doesnt want
    if(!kiboServices.some(service => service === shippingMethod)) {
      return;
    }

    //Form the Kibo EstimatedDeliveryDate object for the current rate,
    let rateEdd = new EstimatedDeliveryDate(FULFILLMENT_METHOD_SHIP, shippingMethod, result.easypost_time_in_transit_data.easypost_estimated_delivery_date, null);

    const carrierIndex = carrierTransitTimesList.findIndex(x => x.carrierId == result.carrier);
    if(carrierIndex != -1) {
      //If carrier already present in transitTimes list, update it
      carrierTransitTimesList[carrierIndex].estimatedDeliveryDates.push(rateEdd);
    }
    //If carrier not already present, add it
    else {
      let carrierTransitTimes = new CarrierTransitTimes();
      carrierTransitTimes.carrierId = result.carrier.toLowerCase(); //kibo uses lowercase carrierIds
      carrierTransitTimes.itemIds = itemIds; //Easypost SmartDeliverBy request doesnt take item info, so all are applicable
      carrierTransitTimes.estimatedDeliveryDates.push(rateEdd);
      carrierTransitTimesList.push(carrierTransitTimes);
    }
  });

  return carrierTransitTimesList;
}

//Given list of CarrierTransitTimes, build a TransitTimesResponse
function buildTransitTimesResponse(carrierTransitTimes) {
  const kiboResp = new TransitTimesResponse(carrierTransitTimes);
  return kiboResp;
}

//TODO not used, remove?
function filterServiceTypes(transitTimesResponse, shippingServiceTypes) {
  //TODO filter
  return transitTimesResponse;
}

// Errors for this app can be returned to Kibo in Messages field
function processErrorResponse(error, itemIds) {
  const message = 'ErrorCode: ' + error.error.code + ', ErrorMessage: ' + error.error.message;
  const validationMessage = new ValidationMessage("Error", message, null);
  let erroredEdd = new EstimatedDeliveryDate(FULFILLMENT_METHOD_SHIP, null, null, null, [validationMessage]);
  let erroredCarrierTransitTimes = new CarrierTransitTimes();
  erroredCarrierTransitTimes.itemIds = itemIds;
  erroredCarrierTransitTimes.estimatedDeliveryDates.push(erroredEdd);
  const resp = new TransitTimesResponse([erroredCarrierTransitTimes]);
  console.debug('FINAL ERROR RESPONSE: ' + JSON.stringify(resp));
  return resp;
}

/*
Given a Kibo TransitTimesRequest,
gets estimated delivery dates from EasyPost, then builds and returns a Kibo TransitTimesResponse
where TransitTimesResponse.TransitTimes is populated.
Other fields in TransitTimesResponse may be populated, but Kibo will ensure they get populated in final response if they arent set here

Request's ShippingServiceTypes will be populated with allowed service types for the request's OriginLocation if you wish to use them,
but Kibo will ensure service types that arent allowed are removed from final response even if you respond with them from here
 */
async function getTransitTimes(context, request) {

  //Delivery supported by a different application. Alternatives which this app supports are null and Ship
  if(request.fulfillmentMethod == FULFILLMENT_METHOD_DELIVERY) {
    return new TransitTimesResponse([]);
  }

  //will be used when forming response, EasyPost doesnt take item info, so all are applicable
  const itemIds = request.items.map(item => item.itemId);

  const client = getEasyPostClient(context);
  const carriers = getCarriersForRequest(request);
  const plannedShipDate = request.shipDate.split('T')[0];
  const easyPostRequest = new SmartDeliveryByRequest(request.originAddress.postalOrZipCode, request.destinationAddress.postalOrZipCode, plannedShipDate, carriers);
  return client.getSmartDeliverBy(easyPostRequest)
    .then(function (result) {
      console.debug('----- EASYPOST RESPONSE -----');
      console.debug(JSON.stringify(result));
      const carrierTransitTimes = buildCarrierTransitTimesList(request.shippingServiceTypes, result, itemIds);
      const kiboTransitTimeResponse = buildTransitTimesResponse(carrierTransitTimes);
      console.debug('----- FINAL RESPONSE -----');
      console.debug(JSON.stringify(kiboTransitTimeResponse));
      return kiboTransitTimeResponse;
    }, function (error) {
      console.error("---------EP DelivDates Error-----------", error);
      return processErrorResponse(error, itemIds);
    }).catch(function (err) {
      console.error("---------EP DelivDates Error catch-----------", err);
      return processErrorResponse(err, itemIds);
    });
}
