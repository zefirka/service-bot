'use strict';

const EventEmitter = require('events');
const util = require('util');
const utils = require('./utils');

const logger = require('./utils/logger');

function Bot(token) {
    this.token = token;
    this._actions = [];
    this._url = `https://api.telegram.org/bot${token}/{method}`;

    let storage = {};

    this.set = function (key, value) {
        storage[key] = value;
        return value;
    };

    this.get = function (value) {
        return storage[value];
    };

    EventEmitter.call(this);
}

util.inherits(Bot, EventEmitter);

Bot.prototype.assign = function (app) {
    const self = this;

    app.post(`/token/${this.token}/`, req => {
        const update = req.body;
        self.emit('update', update);
        self.processUpdate(update);
    });

    return this;
};

Bot.prototype.setCommands = function (commands) {
    this.commands = commands;
    return this;
};

Bot.prototype.processUpdate = function (update) {
    const text = update.message.text;
    const self = this;

    Object.keys(this.commands).forEach(function (command) {
        const commandBody = self.commands[command];
        const matches = commandBody.matches;

        const isMatchingAnyCommand = [
            Array.isArray(matches) ? matches.some(isCommand(text)) : matches.test(text),
            commandBody.isBotCommand && new RegExp(`^/${command}`).test(text)
        ].some(Boolean);

        if (isMatchingAnyCommand) {
            self.emit(command, {
                update: update,
                command: command
            });
        }
    });
};

Bot.prototype.call = function (method, data) {
    const url = this._url.replace('{method}', method);
    return utils.get(url, data);
};

Bot.prototype.auth = function (async) {
    const self = this;
    return this.register(() => {
        return self.call('getMe').then(data => {
            if (data.ok) {
                logger('Auth is successfull').dev(data.result);
                return data;
            } else {
                throw data;
            }
        });
    }, async);
};

Bot.prototype.setWebhook = function (hook, async) {
    const self = this;
    return this.register(() => {
        return self.call('setWebhook', {
            url: hook
        }).then(data => {
            if (data.ok) {
                logger(`Setup webhok: ${hook}`);
                return data;
            } else {
                throw data;
            }
        });
    }, async);

};

Bot.prototype.removeWebhook = function (async) {
    return this.setWebhook('', async);
};

Bot.prototype.register = function (fn, async) {
    if (async) {
        return fn;
    } else {
        this._actions.push(fn);
        return this;
    }
};

Bot.prototype.invoke = function () {
    return this._actions.reduce((prom, fn) => {
        if (!prom) {
            return fn();
        }
        return prom.then(data => {
            return fn(data);
        });
    }, null);
};

function isCommand(text) {
    return function (match) {
        return match.test(text);
    };
}

module.exports = Bot;
