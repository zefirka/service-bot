'use strict';

const _unescape = require('lodash').unescape;

module.exports = {
    formatDaily
};

function formatDaily(obj) {
    let text = `
*${obj.title}*

_${obj.annotation}_

${obj.body}

${obj.end.replace('ТОЛЬКО СЕГОДНЯ:', '*ТОЛЬКО СЕГОДНЯ:*')}

`;
    return _unescape(text)
            .replace(/\&laquo;/g, '«')
            .replace(/\&raquo;/g, '»');
}
