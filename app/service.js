'use strict';

const Bot = require('./bot');
const crons = require('./crons');

const appdata = require('../app.json');
const TOKEN = appdata.token;
const WEBHOOK = appdata.webhook;

const serviceBot = new Bot(TOKEN);

const SERVICE_BOT_COMMANDS = {
    daily: {
        matches: /^Ежедневник/,
        requires: 'user'
    }
};

function init() {
    serviceBot
        .setCommands(SERVICE_BOT_COMMANDS)
        .auth()
        .setWebhook(WEBHOOK.replace('{token}', TOKEN))
        .invoke()
        .then(() => {
            serviceBot.call('getUpdates')
                .then(() => {
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
            console.log('upd', upd);
        })
        .on('daily', function (update) {
            console.log('update', update);
            crons
                .getDaily()
                .then(function (daily) {
                    serviceBot.call('sendMessage', {
                            chat_id: update.message.chat.id,
                            text: daily,
                            parse_mode: 'Markdown'
                        }).then(data => {
                            console.log('data', data);
                        })
                        .catch(error => {
                            console.log('error', error);
                        });
                });
        });
}

module.exports = {
    init,
    subscribeApi,
    subscribe,
};
