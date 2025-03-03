const needle = require("needle");

function ApiService(headers) {
  this.headers = headers;
}

ApiService.prototype.get = async function (url, headers) {
  try {
    headers = this.constructHeaders(headers);
    const options = { headers };

    const res = await send(url, null, options);
    return res;
  }
  catch (err) {
    throw err;
  }
};

ApiService.prototype.post = async function (url, body, headers) {
  try {
    headers = this.constructHeaders(headers);
    const options = { headers };
    const res = await send(url, body, options, 'post');
    return res;
  }
  catch (err) {
    throw err;
  }
};

ApiService.prototype.patch = async function (url, body, headers) {
  try {
    headers = this.constructHeaders(headers);
    const options = { headers };
    const res = await send(url, body, options, 'patch');
    return res;
  }
  catch (err) {
    throw err;
  }
};

ApiService.prototype.constructHeaders = function (headers) {
  headers = { ...this.headers, ...headers };
  return headers;
};

const isJson = (options) => options.headers['Content-Type'] === 'application/json';

// Needle wrapper to send request
const send = (url, body, options, method = 'get') => {
  var promise = new Promise(function (resolve, reject) {
    body = method === 'get' ? null : body;
    if (isJson(options)) {
      options = { ...options, json: true };
    }
    needle.request(
      method,
      url,
      body,
      options,
      function (err, response, data) {
        if (![201, 200, 204].includes(response.statusCode)) {
          const err = {
            ...response.body,
            statusCode: response.statusCode
          };
          reject(err);

        }
        else {
          resolve(data);
        }
      }
    );
  });
  return promise;
};

exports.ApiService = ApiService;
