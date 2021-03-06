'use strict';

const lodash = require('lodash');
const spread = lodash.spread;

const Bot = require('./bot');
const provider = require('./provider');
const config = require('./config');
const i18n = require('./utils/i18n');

const onProd = config.onProd;
const onDev = config.onDev;

const logger = require('./utils/logger');

const authToken = config.token;
const webhook = config.webhook;
const mongolabUri = config.mongolabUri;

const webhookAddress = onProd(webhook.replace('{token}', authToken), '');

const serviceBot = new Bot(authToken, mongolabUri);

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

            logger.hoorai('Service Bot is ready');
            serviceBot.emit('ready');

        }))
        .catch((error) => {
            logger(error);
            throw error;
        });

    provider
        .getDaily();

    return serviceBot;
}

function subscribeApi(app) {
    return serviceBot.assign(app);
}

function subscribe() {
    return serviceBot
        .on('update', function (upd) {
            logger.note(`Update: "${upd.message.text}" from @${upd.message.from.username} recieved`)
                .debug(upd);

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

            provider
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
                            logger.error('An error was occured', error);
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
            const answerBody = answer(serviceBot, currentLang);

            matching.action(serviceBot, userId)
                .then(() => {
                    serviceBot
                        .send(Object.assign(answerBody, {
                            chat_id: onProd(update.message.chat.id, serviceBot.get('chatId')),
                        }));
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
