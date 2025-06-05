const mockData = require('./data.json');

function MockEasyPost(config, sandbox = false) {
    this.config = config;
    this.sandbox = sandbox;
}

// Mock implementation of getSmartDeliverBy using data.json
MockEasyPost.prototype.getSmartDeliverBy = async function(body) {
    try {
        // Extract from_zip and to_zip from the request body
        const fromZip = body.from_zip || body.fromZip;
        const toZip = body.to_zip || body.toZip;
        const plannedShipDate = body.planned_ship_date || new Date().toISOString().split('T')[0];

        // Filter data based on from_zip and to_zip
        const matchingData = mockData.filter(item => {
            const fromMatch = item.fromZip.toString() === fromZip.toString();
            const toMatch = item.toZip.toString() === toZip.toString();
            return fromMatch && toMatch;
        });

        // If no matching data found, return default 10 days for all service codes
        const dataToUse = matchingData.length > 0 ? matchingData : getDefaultServices(fromZip, toZip);

        // Convert service codes to service names
        const results = dataToUse.map(item => {
            const serviceName = mapServiceCodeToName(item.serviceCode);
            const daysInTransit = item.daysInTransit;
            const estimatedDeliveryDate = calculateDeliveryDate(plannedShipDate, daysInTransit);

            return {
                carrier: "usps",
                easypost_time_in_transit_data: {
                    easypost_estimated_delivery_date: estimatedDeliveryDate
                },
                service: serviceName
            };
        });

        // Build response in EasyPost format
        const response = {
            carriers_without_tint_estimates: null,
            from_zip: fromZip.toString(),
            planned_ship_date: plannedShipDate,
            results: results,
            saturday_delivery: false,
            to_zip: toZip.toString()
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
    deliveryDate.setDate(shipDate.getDate() + daysInTransit);
    return deliveryDate.toISOString().split('T')[0];
};

// Generate default services with 10 days transit when no matching data found
const getDefaultServices = function(fromZip, toZip) {
    const defaultServices = [
        'TSAZS225926034', // express
        'TSAZS225926035', // groundadvantage  
        'TSAZS225926036', // priority
        'TSAZS225926037', // librarymail
        'TSAZS225926038'  // mediamail
    ];

    return defaultServices.map(serviceCode => ({
        serviceCode: serviceCode,
        fromZip: fromZip,
        toZip: toZip,
        daysInTransit: 10
    }));
};

exports.MockEasyPostSdk = MockEasyPost;
