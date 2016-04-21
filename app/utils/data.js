'use strict';

const toArray = require('lodash').toArray;

exports.empty = empty;
exports.lense = lense;
exports.exec = exec;

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
