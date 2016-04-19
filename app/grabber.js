'use strict';

const iconv = require('iconv');
const cheerio = require('cheerio');
const utils = require('./utils');
const call = utils.call;

function grab(url) {
    return call(url, {
            encoding: 'binary'
        })
        .then(body => {
            return cheerio.load(convert(body), {
                decodeEntities: false
            });
        })
        .catch(error => {
            console.log('Произошла ошибка: ' + error);
        });
}

function convert(body) {
    body = new Buffer(body, 'binary');
    let conv = new iconv.Iconv('windows-1251', 'utf8');
    return conv.convert(body).toString();
}

module.exports = grab;
