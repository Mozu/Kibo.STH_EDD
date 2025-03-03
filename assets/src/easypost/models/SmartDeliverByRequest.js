exports.SmartDeliveryByRequest = class {
  constructor(fromZip, toZip, plannedShipDate, carriers) {
    this.from_zip = fromZip;
    this.to_zip = toZip;
    this.planned_ship_date = plannedShipDate;
    this.carriers = carriers;
  }
};
