'use strict';

const logger = require('../utils/logger');
const CronJob = require('cron').CronJob;

function every(time, fn, timezone) {
    return new CronJob({
        cronTime: time,
        onTick: fn,
        timezone: timezone || 'Europe/Moscow'
    });
}

function daily(cronName, fn, customTimezone, customTime) {
    logger.debug.note(`Cron "${cronName}" started`);

    return every(`${customTime || '00 00 00'} * * *`, () => {
        logger.prod.note(`Cron "${cronName}" executed`);
        fn();
    }, customTimezone).start();
}

module.exports = daily;
