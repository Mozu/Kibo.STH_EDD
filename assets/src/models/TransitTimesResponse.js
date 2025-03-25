exports.TransitTimesResponse = class {
  constructor(carrierTransitTimes) {
    this.transitTimes = carrierTransitTimes;
  }
};

exports.CarrierTransitTimes = class {
  constructor(carrierId, estimatedDeliveryDates) {
    this.carrierId = carrierId;
    this.estimatedDeliveryDates = Array.isArray(estimatedDeliveryDates) ? estimatedDeliveryDates.map(x => x instanceof EstimatedDeliveryDate ? x : null) : [];
  }
};

exports.EstimatedDeliveryDate = class {
  constructor(fulfillmentMethod, shippingMethod, deliveryDate, windows) {
    this.fulfillmentMethod = fulfillmentMethod;
    this.serviceType = shippingMethod;
    this.deliveryDate = deliveryDate;
    this.windows = Array.isArray(windows) ? windows.map(x => x instanceof Window ? x : null) : [];
  }
};

exports.Window = class {
  constructor(pickupTime, dropoffTime) {
    this.pickupTime = pickupTime;
    this.dropoffTime = dropoffTime;
  }
};
