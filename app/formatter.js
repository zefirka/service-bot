'use strict';

const _unescape = require('lodash').unescape;
const moment = require('moment');

module.exports = {
    formatDaily
};

function formatDaily(obj, locale) {
    locale = locale || 'ru';
    moment.locale(locale);

    let text = `
*${obj.title}* _(${moment(Date.now()).format('DD MMM YYYY')})_

_${obj.annotation}_

${obj.body}

${obj.end.replace('ТОЛЬКО СЕГОДНЯ:', '*ТОЛЬКО СЕГОДНЯ:*')}

`;
    return _unescape(text)
            .replace(/\&laquo;/g, '«')
            .replace(/\&raquo;/g, '»');
}
