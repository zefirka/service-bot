'use strict';

const logger = require('./utils/logger');
const grabber = require('./grabber');
const CronJob = require('cron').CronJob;
const formatDaily = require('./formatter').formatDaily;
const i18n = require('./utils/i18n');

const config = require('./config');

let cache = {
    daily: {}
};

const getDailyData = {
    ru: ($) => {
        return {
            title: $('.day_title').text().trim(),
            annotation: $('.evd_cont').find('p').eq(0).text().trim(),
            from: $('.evd_cont').find('p').eq(1).text().trim(),
            body: $('.evd_cont').find('div').eq(1).text().trim(),
            end: $('.evd_cont').find('div').eq(2).text().trim()
        };
    },
    en: ($) => {
        let t = $('table');
        return {
            title: t.find('tr').eq(1).find('td').text().trim(),
            annotation: t.find('tr').eq(3).find('td').text().trim(),
            from: t.find('tr').eq(4).find('td').text(),
            body: t.find('tr').eq(5).find('td').html().replace(/<br>/g, '\n'),
            end: t.find('tr').eq(6).find('td').text()
        };
    }
};

module.exports.getDaily = getDaily;

function getDaily(lang, update) {
    lang = lang || 'ru';
    logger('Getting daily on', lang);

    if (!update && cache.daily[lang] && cache.lang === lang) {
        return Promise.resolve(cache.daily[lang]);
    }

    i18n.lang(lang);

    const dailyAddress = i18n('Daily URL') || config.daily;

    return grabber(dailyAddress)
        .then($ => {
            let text = formatDaily(getDailyData[lang]($), lang);

            cache.daily[lang] = text;
            cache.lang = lang;
            return text;
        })
        .catch(error => {
            console.log('error', error);
        });
}

every('00 00 00 * * *', function () {
    getDaily('ru', true);
    getDaily('en', true);
}).start();

function every(time, fn) {
    return new CronJob({
        cronTime: time,
        onTick: fn,
    });
}
