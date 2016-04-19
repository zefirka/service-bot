'use strict';

const grabber = require('./grabber');
const CronJob = require('cron').CronJob;
const formatDaily = require('./formatter').formatDaily;
const DAILY = require('../app.json').daily;

let cache = {

};

module.exports.getDaily = getDaily;

function getDaily() {
    if (cache.daily) {
        return new Promise(resolve => resolve(cache.daily));
    }

    return grabber(DAILY)
        .then($ => {
            let text = formatDaily({
                title: $('.day_title').text().trim(),
                annotation: $('.evd_cont').find('p').eq(0).text().trim(),
                from: $('.evd_cont').find('p').eq(1).text().trim(),
                body: $('.evd_cont').find('div').eq(1).text().trim(),
                end: $('.evd_cont').find('div').eq(2).text().trim()
            });

            cache.daily = text;
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
