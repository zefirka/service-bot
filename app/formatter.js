'use strict';

const _unescape = require('lodash').unescape;
const moment = require('moment');

module.exports = {
    formatDaily
};

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

function formatDaily(obj, locale) {
    locale = locale || 'ru';
    moment.locale(locale);

    let text = DAILY[locale](obj);

    return _unescape(text)
        .replace(/\&laquo;/g, '«')
        .replace(/\&raquo;/g, '»')
        .replace(/\&mdash;/g, '–');
}
