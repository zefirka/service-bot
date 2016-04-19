'use strict';

const EventEmitter = require('events');
const util = require('util');
const utils = require('./utils');

function Bot(token) {
    this.token = token;
    this._actions = [];
    this._url = `https://api.telegram.org/bot${token}/{method}`;

    EventEmitter.call(this);
}

util.inherits(Bot, EventEmitter);

Bot.prototype.assign = function (app) {
    const self = this;
    console.log(`/token/${this.token}/`);
    app.post(`/token/${this.token}/`, (req, res) => {
        console.log(req.body);
        const update = req.body;
        console.log('update', update);
        self.processUpdate(update);
        self.emit('update', update);
        res.send('ok');
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
        const match = self.commands[command].matches;

        if (match.test(text)) {
            self.emit(command, update);
        }
    });
};

Bot.prototype.call = function (method, data) {
    const url = this._url.replace('{method}', method);

    return utils.get(url, data);
};

Bot.prototype.auth = function (async) {
    const self = this;
    const call = () => {
        return self.call('getMe').then(data => {
            if (data.ok) {
                console.log('Auth is successfull', data.result);
                return data;
            } else {
                throw data;
            }
        });
    };

    return this.register(call, async);
};

Bot.prototype.setWebhook = function (hook, async) {
    const self = this;
    const call = () => {
        return self.call('setWebhook', {
            url: hook
        }).then(data => {
            if (data.ok) {
                return data;
            } else {
                throw data;
            }
        });
    };

    return this.register(call, async);

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

module.exports = Bot;
