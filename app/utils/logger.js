'use strict';

const config = require('../config');
const toArray = require('lodash').toArray;

module.exports = logger;

function logger() {
    _print(arguments);
    return logger;
}

logger.dev = dev;
logger.prod = prod;
logger.all = logger;

function dev() {
    const args = arguments;
    config.onDev(() => {
        _print(args);
    });
    return logger;
}

function prod() {
    const args = arguments;
    config.onProd(() => {
        _print(args);
    });
    return logger;
}

function _print(args) {
    toArray(args).forEach(arg => {
        console.log(arg);
    });

    if (args.length === 1) {
        console.log('');
    }
}
