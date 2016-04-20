'use strict';

const r = require('request');
const toArray = require('lodash').toArray;

exports.post = (url, data, headers) => _call(url, 'POST', {headers, data});
exports.get = (url, data, headers) => _call(url, 'GET', {headers, data});
exports.call = (url, data) => {
    return _call(url, 'GET', {
        data: {json: false},
        encoding: data.encoding
    });
};

exports.empty = empty;
exports.lense = lense;
exports.promisify = promisify;
exports.exec = exec;

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
        r(options, (err, resp, body) => {
            if (err) {
                reject(err);
            }

            resolve(body);
        });
    });
}

function promisify(fn) {
    return new Promise((resolve, reject) => {
        fn(resolve, reject);
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

function exec(val) {
    return typeof val === 'function' ? val() : val;
}
