'use strict';

const r = require('request');
const toArray = require('lodash').toArray;

exports.post = (url, headers, query) => _call(url, 'POST', {body: {query}, headers});
exports.get = (url, headers, data) => _call(url, 'GET', {headers, data});
exports.empty = empty;
exports.lense = lense;

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
        encoding: 'utf-8',
        headers: data.headers,
        body: data.body,
        qs: data.data
    };

    return new Promise((resolve, reject) => {
        r(options, (err, resp, body) => {
            if (err) {
                reject(err);
            }

            resolve(body);
        });
    });
}

/**
 * @return {function}
 */
function lense() {
    const argv = toArray(arguments);
    return function (item) {
        return argv.reduce((sum, arg) => {
            if (Array.isArray(arg)) {
                sum[arg[0]] = item[arg[1]];
            } else {
                sum[arg] = item[arg];
            }

            return sum;
        }, {});
    };
}

/**
 * @return {string}
 */
function empty() {
    return '';
}
