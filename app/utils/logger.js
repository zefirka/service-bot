'use strict';

require('colors');

const config = require('../config');
const lodash = require('lodash');

const toArray = lodash.toArray;
const get = lodash.get;

module.exports = logger;

/**
 * @public
 * @return {function[object]}
 */
function logger() {
    _print(arguments);
    return logger;
}

logger.dev = dev;
logger.prod = prod;
logger.all = logger;
logger.debug = debug;

const methods = {
    important: 'bold',
    warning: 'bold.yallow',
    dange: 'bold.red',
    error: 'red',
    note: 'underline.cyan',
    bold: 'bold',
    success: 'green',
    hoorai: 'underline.green',
    web: 'magenta'
};

matchOn();
matchOn('dev');
matchOn('prod');
matchOn('debug');

/**
 * @public
 * @return {function[object]}
 */
function dev() {
    const args = arguments;
    config.onDev(() => {
        _print(args);
    });
    return logger;
}

/**
 * @public
 * @return {function[object]}
 */
function debug() {
    const args = arguments;
    config.onDebug(() => {
        _print(args);
    });
    return logger;
}

/**
 * @public
 * @return {function[object]}
 */
function prod() {
    const args = arguments;
    config.onProd(() => {
        _print(args);
    });
    return logger;
}

/**
 * @public
 * @return {function[object]}
 */
function _print(args) {
    toArray(args).forEach(arg => {
        console.log(arg);
    });

    if (args.length === 1) {
        console.log('');
    }
}

/**
 * @private
 * @param {string|undefined} logLevel
 */
function matchOn(logLevel) {
    Object.keys(methods).forEach(method => {
        const path = methods[method];
        const logFn = logLevel ? logger[logLevel] : logger;
        logFn[method] = str => {
            if (typeof str !== 'string') {
                str = JSON.stringify(str);
            }
            return logFn(get(str, path));
        };
    });
}
