'use strict';

const Bot = require('./bot');
const crons = require('./crons');
const config = require('./config');

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
            serviceBot.call('getUpdates')
                .then((update) => {
                    onDev(() => {
                        let chatId = update.result.pop().message.chat.id;
                        serviceBot.set('chatId', chatId);
                        return config;
                    });

                    logger('Service Bot is ready');
                    serviceBot.emit('ready');
                });
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
        })
        .on('daily', function (data) {
            const update = data.update;
            logger.dev('/daily command recieved');
            crons
                .getDaily()
                .then(function (daily) {
                    serviceBot.send({
                            chat_id: onProd(update.message.chat.id, serviceBot.get('chatId')),
                            text: daily,
                            parse_mode: 'Markdown'
                        }).then(data => {
                            logger('Message sent with status: ok')
                                .dev(`message_id: ${data.result.message_id}`);
                        })
                        .catch(error => {
                            logger('An error was occured', error);
                        });
                });
        })
        .on('language:request', function (data) {
            const update = data.update;
            serviceBot.keyboard('Выберите язык', {
                chat_id: onProd(update.message.chat.id, serviceBot.get('chatId')),
                markup: {
                    keyboard: [
                        ['ru', 'en'],
                        ['Передумал']
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }).then(() => {
                serviceBot.setState('language:await');
            });
        })
        .on('language:change', function (data) {
            const update = data.update;
            serviceBot
                .send({
                    chat_id: onProd(update.message.chat.id, serviceBot.get('chatId')),
                    text: 'Language changed'
                })
                .then(() => {
                    serviceBot.flushState();
                });
        })
        .on('wrong', function (data) {
            const update = data.update;
            serviceBot
                .send({
                    chat_id: onProd(update.message.chat.id, serviceBot.get('chatId')),
                    text: 'Неправильная комнада'
                })
                .then(() => {
                    serviceBot.flushState();
                });
        });
}

module.exports = {
    init,
    subscribeApi,
    subscribe,
};
