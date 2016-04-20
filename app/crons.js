'use strict';

const grabber = require('./grabber');
const CronJob = require('cron').CronJob;
const formatDaily = require('./formatter').formatDaily;
const i18n = require('./utils/i18n');

const config = require('./config');

let cache = {

};

module.exports.getDaily = getDaily;

function getDaily(lang) {
    if (cache.daily && cache.lang === lang) {
        return Promise.resolve(cache.daily);
    }

    i18n.lang(lang);

    const dailyAddress = i18n('Daily URL') || config.daily;

    return grabber(dailyAddress)
        .then($ => {
            let text = formatDaily({
                title: $('.day_title').text().trim(),
                annotation: $('.evd_cont').find('p').eq(0).text().trim(),
                from: $('.evd_cont').find('p').eq(1).text().trim(),
                body: $('.evd_cont').find('div').eq(1).text().trim(),
                end: $('.evd_cont').find('div').eq(2).text().trim()
            }, lang);

            cache.daily = text;
            cache.lang = lang;
            return text;
        })
        .catch(error => {
            console.log('error', error);
        });
}

every('00 00 00 * * *', function () {
    getDaily();
}).start();

function every(time, fn) {
    return new CronJob({
        cronTime: time,
        onTick: fn,
    });
}
