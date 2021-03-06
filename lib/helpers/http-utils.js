const util = require('util');
const request = require('request');

/**
 * This function creates a header value for Authentication header
 * using Basic base64 authentication encoding.
 *
 * For example username 'foo' and password 'bar' will be transformed into
 *
 * 'Basic Zm9vOmJhcg=='
 *
 * @param username
 * @param password
 * @return {String}
 */
exports.createBasicAuthorization = function createBasicAuthorization(username, password) {
  const credentials = util.format('%s:%s', username, password);
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

/**
 * This function fetches JSON response and do a necessary parsing and control
 * of the exception handling in case unexpected return code is returned
 *
 * It accept following parameters as properties of the first parameter
 *
 * url - required url to be fetched
 * auth - optional authentication header value
 * headers - optional hash with header values,
 * please note authentication header will be added automatically as well as Accept header
 *
 * @param logger
 * @param params
 * @param cb
 */
exports.getJSON = function getJSON(logger, params, cb) {
  const { url } = params;
  const method = params.method || 'get';
  const headers = params.headers || {};
  const expectedStatus = params.statusExpected || 200;

  if (params.auth) {
    headers.Authorization = params.auth;
  }

  logger.trace('Sending %s request to %s', method, url);

  request[method.toLowerCase()]({
    url,
    agent: false,
    headers,
    form: params.form,
    json: params.json,
    // eslint-disable-next-line consistent-return
  }, (err, resp, body) => {
    if (err) {
      logger.error(`Failed to fetch JSON from ${url} with error: ${err}`);
      return cb(err);
    }
    if (resp.statusCode === expectedStatus) {
      let result = body;
      try {
        if (typeof body === 'string') {
          result = JSON.parse(body);
        }
      } catch (parseError) {
        logger.error('Failed to parse JSON', body);
        cb(parseError);
      }
      if (result) {
        try {
          logger.trace('Have got %d response from %s to %s', expectedStatus, method, url);
          cb(null, result);
        } catch (e) {
          logger.error('Exception happened when passing data down the chain', e);
        }
      } else {
        logger.info('Have got empty response');
        cb(null, result);
      }
    } else {
      const msg = util.format(
        'Unexpected return code %d, expected %d, body %j',
        resp.statusCode,
        expectedStatus,
        body,
      );
      logger.error(msg);

      const errorResponse = new Error(msg);
      errorResponse.responseBody = body;
      errorResponse.statusCode = resp.statusCode;
      cb(errorResponse);
    }
  });
};
