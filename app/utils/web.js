'use strict';

const r = require('request');
const logger = require('./logger');

exports.post = (url, data, headers) => _call(url, 'POST', {headers, data});
exports.get = (url, data, headers) => _call(url, 'GET', {headers, data});
exports.call = (url, data) => {
    return _call(url, 'GET', {
        data: {json: false},
        encoding: data.encoding
    });
};

/**
 * @private
 * @param {string} url
 * @param {string} method
 * @param {object} data
 * @return {Promise}
 */
function _call(url, method, data) {
    let options = {
        url: url,
        method: method || 'GET',
        json: data.json || true,
        encoding: data.encoding || 'utf-8',
        headers: data.headers,
        body: data.data,
        qs: data.data
    };

    return new Promise((resolve, reject) => {
        logger.debug.web(`Calling url: ${url}`);

        r(options, (err, resp, body) => {
            if (err) {
                reject(err);
            }

            resolve(body);
        });
    });
}

