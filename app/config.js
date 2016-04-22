'use strict';

const utils = require('./utils/data');

const config = {
    mode: process.env.MODE || 'dev',
    debug: process.env.DEBUG || 'false',
    mongolabUri: process.env.MONGOLAB_URI,

    defaults: {
        locale: 'ru'
    },

    onProd: (val, _else) => config.mode === 'prod' ? utils.exec(val) : (utils.exec(_else) || null),
    onDev: (val, _else) => config.mode === 'dev' ? utils.exec(val) : (utils.exec(_else) || null),
    onDebug: val => config.debug === 'true' ? utils.exec(val) : null
};

const devApp = require('../app.dev.json');
const app = require('../app.json');

module.exports = Object.assign({},
	config.onProd(app, devApp),
	config);
