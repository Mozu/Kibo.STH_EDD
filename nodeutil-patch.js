// Monkey patch for Node.js compatibility with older grunt plugins
// The nodeUtil.isError function was removed in newer Node.js versions
// but some grunt plugins still depend on it

const util = require('util');

// Check if isError is missing and add it back
if (!util.isError) {
    util.isError = function(object) {
        return object instanceof Error;
    };
    console.log('Monkey patched util.isError for grunt compatibility');
}

module.exports = {};
