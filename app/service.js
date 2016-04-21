'use strict';

const lodash = require('lodash');
const spread = lodash.spread;

const Bot = require('./bot');
const crons = require('./crons');
const config = require('./config');
const i18n = require('./utils/i18n');

const onProd = config.onProd;
const onDev = config.onDev;

const logger = require('./utils/logger');

const TOKEN = config.token;
const WEBHOOK = config.webhook;

const webhookAddress = onProd(WEBHOOK.replace('{token}', TOKEN), '');

const serviceBot = new Bot(TOKEN);

const SERVICE_BOT_COMMANDS = require('./commands/serviceBot');

function init() {
    serviceBot
        .setCommands(SERVICE_BOT_COMMANDS)
        .auth()
        .setWebhook(webhookAddress)
        .invoke()
        .then(() => {
            return Promise.all([
                serviceBot.call('getUpdates'),
                serviceBot.connectToDb()]);
        }).then(spread(updates => {
            onDev(() => {
                let chatId = updates.result.pop().message.chat.id;
                serviceBot.set('chatId', chatId);
                return config;
            });

            logger('Service Bot is ready');
            logger('Service Bot connected with database');
            serviceBot.emit('ready');

        }))
        .catch((error) => {
            logger(error);
            throw error;
        });

    crons
        .getDaily();

    return serviceBot;
}

function subscribeApi(app) {
    return serviceBot.assign(app);
}

function subscribe() {
    return serviceBot
        .on('update', function (upd) {
            logger('Update recieved:')
                .dev(upd)
                .prod(upd.message.text);

            const user = upd.message.from;

            if (serviceBot.get('users')[user.id]) {
                serviceBot.processUpdate(upd);
                return;
            }

            serviceBot
                .getUserById(user.id)
                .then(userByUserId => userByUserId || serviceBot.createUser(user))
                .then(newUser => {
                    serviceBot.set('users', user.id, newUser);
                    serviceBot.processUpdate(upd);
                });

        })
        .on('daily', function (data) {
            const update = data.update;
            const userId = update.message.from.id;
            const userLang = serviceBot.getUserLang(userId);

            logger.dev('/daily command recieved');

            crons
                .getDaily(userLang)
                .then(function (daily) {
                    serviceBot.send({
                            chat_id: onProd(update.message.chat.id, serviceBot.get('chatId')),
                            text: daily,
                            parse_mode: 'Markdown'
                        }).then(data => {
                            logger('Message sent with status: ok')
                                .dev(data)
                                .dev(`message_id: ${data.result.message_id}`);
                        })
                        .catch(error => {
                            logger('An error was occured', error);
                        });
                });
        })
        .on('language:request', function (data) {
            const update = data.update;
            const currentLang = serviceBot.getUserLang(update.message.from.id);

            i18n.lang(currentLang);

            serviceBot.keyboard(i18n('Choose language'), {
                chat_id: onProd(update.message.chat.id, serviceBot.get('chatId')),
                markup: {
                    keyboard: [
                        ['ru', 'en'],
                        [i18n('I change my mind')]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }).then(() => serviceBot.setState('language:await'));
        })
        .on('language:change', function (data) {
            const update = data.update;
            const matching = data.matching;
            const answer = matching && matching.answer;
            const userId = update.message.from.id;
            const currentLang = serviceBot.getUserLang(userId);
            const answerText = answer(serviceBot, currentLang);

            matching.action(serviceBot, userId)
                .then(() => {
                    serviceBot
                        .send({
                            chat_id: onProd(update.message.chat.id, serviceBot.get('chatId')),
                            text: answerText
                        });
                });
        })
        .on('wrong', function (data) {
            const update = data.update;
            const currentLang = serviceBot.getUserLang(update.message.from.id);

            i18n.lang(currentLang);
            serviceBot
                .send({
                    chat_id: onProd(update.message.chat.id, serviceBot.get('chatId')),
                    text: i18n('Wrong command') || 'Wrong command'
                });
        });
}

module.exports = {
    init,
    subscribeApi,
    subscribe,
};
