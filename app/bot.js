'use strict';

const EventEmitter = require('events');
const util = require('util');
const mongoose = require('mongoose');
const lodash = require('lodash');

const utils = require('./utils');
const logger = require('./utils/logger');
const models = require('./db/model');

function Bot(token) {
    this.token = token;
    this._actions = [];
    this._connected = false;
    this._url = `https://api.telegram.org/bot${token}/{method}`;

    let storage = {
        users: {},
        groups: {}
    };

    this.set = function (key, valueOrKey, valueOrNothing) {
        if (valueOrNothing !== undefined) {
            let inner = storage[key];
            if (inner) {
                storage[key][valueOrKey] = valueOrNothing;
                return valueOrNothing;
            }
        } else {
            storage[key] = valueOrKey;
        }
        return valueOrKey;
    };

    this.get = function (key) {
        return lodash.get(storage, key);
    };

    EventEmitter.call(this);
}

util.inherits(Bot, EventEmitter);

Bot.prototype.assign = function (app) {
    const self = this;
    app.post(`/token/${this.token}/`, (req, res) => {
        const update = req.body;
        self.emit('update', update);
        res.status(200).send('Ok');
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

        if (self.state && commandBody.onState && commandBody.onState !== self.state) {
            return;
        }

        const isMatchingAnyCommand = [
            Array.isArray(matches) ? matches.some(isCommand(text)) : matches.test(text),
            commandBody.isBotCommand && new RegExp(`^/${command}`).test(text)
        ].some(Boolean);

        if (isMatchingAnyCommand) {
            self.emit(commandBody.event || command, {
                update,
                command
            });
        }

        if (commandBody.onState && commandBody.onState === self.state) {
            self.emit('wrong', {
                update,
                command
            });
        }
    });
};

Bot.prototype.call = function (method, data) {
    const url = this._url.replace('{method}', method);
    return utils.get(url, data);
};

Bot.prototype.send = function (data) {
    return this.call('sendMessage', data);
};

Bot.prototype.setState = function (state) {
    this.state = state;
};

Bot.prototype.flushState = function () {
    this.state = null;
};

Bot.prototype.keyboard = function (text, data) {
    return this.call('sendMessage', {
        text: text,
        reply_markup: JSON.stringify(data.markup),
        chat_id: data.chat_id
    });
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

/**
 * @public
 * @param {object} user
 * @return {Promise}
 */
Bot.prototype.createUser = function (user) {
    logger('Saving new user: ')
        .prod(user.username)
        .dev(user);

    const userData = {
        id: user.id,
        username: user.username,
        lang: 'ru',
        timezone: 'GMT +3: MSK'
    };

    const newUser = new models.User(userData);

    return newUser
        .save(newUser)
        .then(() => userData);
};

Bot.prototype.getUserById = function (id) {
    let userId = this.get('users')[id];
    return userId ? Promise.resolve(userId) : models.User.find({id: String(id)}).then(users => {
        if (users.length <= 1) {
            return users[0].toJSON();
        } else {
            throw 'Duplicate USER_ID at table Users';
        }
    }).catch(error => {
        console.log('error', error);
    });
};

Bot.prototype.getUserLang = function (id) {
    return this.get('users')[id].lang;
};

Bot.prototype.connectToDb = function () {
    const self = this;
    return new Promise((resolve, reject) => {
        mongoose.connect(process.env.MONGOLAB_URI, error => {
            if (error) {
                logger('An error was occured while connecting to Mongo')
                    .dev(error);
                reject(error);
                return;
            }
            self._connected = true;
            resolve();
        });
    });
};

function isCommand(text) {
    return function (match) {
        return match.test(text);
    };
}

module.exports = Bot;
