'use strict';

const toArray = require('lodash').toArray;

module.exports = {
    lense,
    empty,
    exec,
    inject
};

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

/**
 * @public
 * @param {function|*} val
 * @return {*}
 */
function exec(val) {
    return typeof val === 'function' ? val() : val;
}

/**
 * @public
 * @param {string} str
 * @param {object} o
 * @return {string}
 */
function inject(str, o) {
    return str.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
}
