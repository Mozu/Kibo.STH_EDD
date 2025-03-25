exports.EasyPostShipment = class {
  constructor(transitTimesRequest) {
    this.shipment = {
      to_address: {
        street1: transitTimesRequest.destinationAddress.address1,
        city: transitTimesRequest.destinationAddress.cityOrTown,
        state: transitTimesRequest.destinationAddress.stateOrProvince,
        zip: transitTimesRequest.destinationAddress.postalOrZipCode,
        country: transitTimesRequest.destinationAddress.countryCode
      },
      from_address: {
        street1: transitTimesRequest.originAddress.address1,
        street2: transitTimesRequest.originAddress.address2,
        city: transitTimesRequest.originAddress.cityOrTown,
        state: transitTimesRequest.originAddress.stateOrProvince,
        zip: transitTimesRequest.originAddress.postalOrZipCode,
        country: transitTimesRequest.originAddress.countryCode
      },
      parcel: {
        length: null,
        width: null,
        height: null,
        weight: null
      }
    };

    //easypost expects distance in inches and mass in ounces, kibo distance will be "in" or "ft" and mass "lbs"
    //All possible Kibo units can be found with Reference API, GET /platform/reference/unitsofmeasure
    function calculateEasyPostMeasurement(kiboMeasurement) {
      const kiboDistanceUnits = ['in','ft'];
      if(kiboDistanceUnits.includes(kiboMeasurement.unit)) {
        if(kiboMeasurement.unit == 'in'){
          return kiboMeasurement.value;
        } else {
          return kiboMeasurement.value * 12; //ft to in conversion
        }
      } else {
        //assume if not distance, then weight, and kibo weight is always in pounds (lbs)
        return kiboMeasurement.value * 16; //lb to oz conversion
      }
    }

    this.shipment.parcel.length = calculateEasyPostMeasurement(transitTimesRequest.item.unitMeasurements.length);
    this.shipment.parcel.width = calculateEasyPostMeasurement(transitTimesRequest.item.unitMeasurements.width);
    this.shipment.parcel.height = calculateEasyPostMeasurement(transitTimesRequest.item.unitMeasurements.height);
    this.shipment.parcel.weight = calculateEasyPostMeasurement(transitTimesRequest.item.unitMeasurements.weight);
  }
};
