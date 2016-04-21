'use strict';

const join = require('path').join;

module.exports = require('../../node_modules/yai/node/lang')(join(__dirname, '../../etc/lang')).i18n;
