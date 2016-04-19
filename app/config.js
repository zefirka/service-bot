'use strict';

const utils = require('./utils');

const config = {
    mode: process.env.MODE || 'dev',
    onProd: (val, _else) => config.mode === 'prod' ? utils.exec(val) : (utils.exec(_else) || null),
    onDev: (val, _else) => config.mode === 'dev' ? utils.exec(val) : (utils.exec(_else) || null),
};

const devApp = require('../app.dev.json');
const app = require('../app.json');

module.exports = Object.assign({},
	config.onProd(app, devApp),
	config);
