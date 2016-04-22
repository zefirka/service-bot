'use strict';

const lodash = require('lodash');
const moment = require('moment');

const config = require('../config');

const DAILY = {
    ru: (obj) => `
*${obj.title}* _(${moment(Date.now()).format('DD MMM YYYY')})_

_${obj.annotation}_
*${obj.from}*

${obj.body}

${obj.end.replace('ТОЛЬКО СЕГОДНЯ:', '*ТОЛЬКО СЕГОДНЯ:*')}

`,
    en: (obj) => `
*${obj.title}* _(${moment(Date.now()).format('MMMM DD, YYYY')})_

_${obj.from}_
_${obj.annotation}_

${obj.body}
---
${obj.end.replace('Just for Today:', '*Just for Today:*')}

`
};

/**
 * @public
 * @param {object} obj
 * @param {string} locale
 * @return {string}
 */
module.exports = function (obj, locale) {
    locale = locale || config.defaults.locale;
    moment.locale(locale);

    let text = DAILY[locale](obj);

    return lodash.unescape(text)
        .replace(/\&laquo;/g, '«')
        .replace(/\&raquo;/g, '»')
        .replace(/\&mdash;/g, '–');
};
