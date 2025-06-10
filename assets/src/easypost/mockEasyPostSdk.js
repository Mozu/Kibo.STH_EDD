const mockData = require('./data.json');

function MockEasyPost(context) {
    this.mockData = (context.configuration || {}).shippingEstimates || mockData;
    this.requestedServiceTypes = ((context.get.request() ||{}).request ||{}) .shippingServiceTypes || [];
    const [carrierPart = '', serviceTypePart = ''] = (this.requestedServiceTypes[0] || '').split(/_(.+)/);
    this.serviceType = serviceTypePart || 'groundadvantage';
    this.carrier = carrierPart || 'usps';
}

// Mock implementation of getSmartDeliverBy using data.json
MockEasyPost.prototype.getSmartDeliverBy = async function(body) {
    try {
        // Extract from_zip and to_zip from the request body
        const fromPostalCode = body.from_zip || body.fromPostalCode;
        const toPostalCode = body.to_zip || body.toPostalCode;
        const plannedShipDate = body.planned_ship_date || new Date().toISOString().split('T')[0];

        // Filter data based on from_zip and to_zip
        const matchingData = mockData.filter(item => {
            const fromMatch = item.fromPostalCode.toString() === fromPostalCode.toString();
            const toMatch = item.toPostalCode.toString() === toPostalCode.toString();
            return fromMatch && toMatch;
        });

        // If no matching data found, return default 10 days for all service codes
        const dataToUse = matchingData.length > 0 ? matchingData : getDefaultServices(fromPostalCode, toPostalCode);

        // Convert service codes to service names
        const results = dataToUse.map(item => {
            const serviceName = this.serviceType || mapServiceCodeToName(item.serviceCode);
            const daysInTransit = item.daysInTransit;
            const estimatedDeliveryDate = calculateDeliveryDate(plannedShipDate, daysInTransit);

            return {
                carrier: this.carrier,
                easypost_time_in_transit_data: {
                    easypost_estimated_delivery_date: estimatedDeliveryDate
                },
                service: serviceName
            };
        });

        // Build response in EasyPost format
        const response = {
            carriers_without_tint_estimates: null,
            from_zip: fromPostalCode.toString(),
            planned_ship_date: plannedShipDate,
            results: results,
            saturday_delivery: false,
            to_zip: toPostalCode.toString()
        };

        return response;
    }
    catch (e) {
        console.log('Error in MockEasyPost getSmartDeliverBy: ', e);
        throw e;
    }
};

// Map service codes to service names
const mapServiceCodeToName = function(serviceCode) {
    // Extract the last few digits to determine service type
    const lastDigits = serviceCode.slice(-2);
    
    switch(lastDigits) {
        case '34': return 'express';
        case '35': return 'groundadvantage';
        case '36': return 'priority';
        case '37': return 'librarymail';
        case '38': return 'mediamail';
        case '39': return 'first';
        case '40': return 'parcelselect';
        case '41': return 'critical';
        case '42': return 'express';
        case '43': return 'groundadvantage';
        case '44': return 'priority';
        case '45': return 'librarymail';
        case '46': return 'mediamail';
        case '47': return 'first';
        case '48': return 'parcelselect';
        default: return 'groundadvantage'; // default service
    }
};

// Calculate delivery date by adding days in transit to planned ship date
const calculateDeliveryDate = function(plannedShipDate, daysInTransit) {
    const shipDate = new Date(plannedShipDate);
    const deliveryDate = new Date(shipDate);
    deliveryDate.setDate(shipDate.getDate() + parseInt(daysInTransit));
    return deliveryDate.toISOString().split('T')[0];
};

// Generate default services with 10 days transit when no matching data found
const getDefaultServices = function(fromPostalCode, toPostalCode) {
    const defaultServices = [
        'TSAZS225926034', // express
        'TSAZS225926035', // groundadvantage  
        'TSAZS225926036', // priority
        'TSAZS225926037', // librarymail
        'TSAZS225926038'  // mediamail
    ];

    return defaultServices.map(serviceCode => ({
        serviceCode: serviceCode,
        fromPostalCode: fromPostalCode,
        toPostalCode: toPostalCode,
        daysInTransit: 10
    }));
};

exports.MockEasyPostSdk = MockEasyPost;
