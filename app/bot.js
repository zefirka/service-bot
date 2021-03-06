'use strict';

const EventEmitter = require('events');
const util = require('util');
const mongoose = require('mongoose');

const lodash = require('lodash');
const find = lodash.find;

const utils = require('./utils/web');
const logger = require('./utils/logger');
const models = require('./db/model');

function Bot(token, mongolabUri) {
    this.mongolabUri = mongolabUri;
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

/**
 * @public
 * @param {object} update
 */
Bot.prototype.processUpdate = function (update) {
    const text = update.message.text;
    const self = this;

    Object.keys(this.commands).forEach(function (command) {
        const commandBody = self.commands[command];
        const matches = commandBody.matches;
        const commandText = commandBody.isBotCommand && command;

        /**
         * Если бот в каком-то состоянии, и команда реагирует только на состояние и эти состояние не равны
         */
        if (self.state && commandBody.onState && commandBody.onState !== self.state) {
            return;
        }

        if (commandBody.onState && !self.state) {
            return;
        }

        let matching = false;

        if (Array.isArray(matches)) {
            matching = find(matches, function (descriptor) {
                return isTextMatchesToCommand(descriptor, text, commandText, self, update.message);
            });
        } else {
            matching = isTextMatchesToCommand(matches, text, commandText, self, update.message);
        }

        if (matching) {
            console.log('matching', matching);
            self.emit(commandBody.event || command, {
                update,
                command,
                matching
            });
            return;
        }

        if (commandBody.onState && commandBody.onState === self.state) {
            self.emit('wrong', {
                update,
                command
            });
        }
    });
};

/**
 * @public
 * @param {string} method
 * @param {object} data
 * @return {Promise}
 */
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
                logger  .success('Auth is successfull')
                        .dev.success(data.result);
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

/**
 * @public
 * @param {function} fn
 * @param {boolean} async
 * @return {Bot}
 */
Bot.prototype.register = function (fn, async) {
    if (async) {
        return fn;
    } else {
        this._actions.push(fn);
        return this;
    }
};

/**
 * @public
 * @return {Promise}
 */
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
        timezone: 'Europe/Moscow' // @TODO: get an right user's timezone
    };

    const newUser = new models.User(userData);

    return newUser
        .save(newUser)
        .then(() => userData);
};

/**
 * @public
 * @param {number|string} id
 * @return {Promise}
 */
Bot.prototype.getUserById = function (id) {
    let userId = this.get('users')[id];
    return userId ? Promise.resolve(userId) : models.User.find({id: String(id)}).then(users => {
        if (users.length <= 1) {
            return users[0] && users[0].toJSON();
        }

        let errorMessage = `Duplicate user.id at table Users: ${id}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }).catch(error => {
        logger.error(error);
        throw new Error(error);
    });
};

/**
 * @public
 * @sync
 * @param {number|string} id
 * @return {string|undefined}
 */
Bot.prototype.getUserLang = function (id) {
    return this.get('users')[id].lang;
};

/**
 * @public
 * @param {number} id
 * @param {string} lang
 * @return {Promise}
 */
Bot.prototype.setLang = function (id, lang) {
    return models.User.update({id: String(id)}, {lang: lang})
        .then(res => {
            logger.debug(res);
            this.get('users')[id].lang = lang;
            logger(`Updated user's lang to ${lang}`);
        });
};

/**
 * Connects to MongoDB. Get's URL from config.mongolabUri
 * @public
 * @return {Promise}
 */
Bot.prototype.connectToDb = function () {
    const self = this;
    return new Promise((resolve, reject) => {
        mongoose.connect(self.mongolabUri, error => {
            if (error) {
                logger.error('An error was occured while connecting to Mongo')
                      .dev.error(error);
                reject(error);
                return;
            }
            logger.success('Service Bot connected with database');
            self._connected = true;
            resolve();
        });
    });
};

/**
 * @private
 * @param {function} commandMatch - executable suite for match(bot, message)
 * @param {string|RegExp|[RegExp]|[string]}  commandMatch - matching command or array of commands
 * @param {Object|[{}]} commandMatch - matching object or list of objects
 * @param {string} text - message text
 * @param {string|undefined} commandName - name of command if it's bot's command
 * @param {Bot} bot - Bot instance
 * @param {object} messge
 * @return {*}
 */
function isTextMatchesToCommand(commandMatch, text, commandName, bot, message) {
    if (typeof commandMatch === 'function') {
        return commandMatch(bot, message);
    }else
    if (typeof commandMatch === 'string' && commandMatch === text) {
        return commandMatch;
    }else
    if (commandMatch instanceof RegExp && commandMatch.test(text)) {
        return commandMatch;
    }else
    if (commandName && new RegExp(`^/${commandName}`).test(text)) {
        return commandName;
    }else
    if (Array.isArray(commandMatch)) {
        return commandMatch.some(itemOfCommandMatch => {
            return isTextMatchesToCommand(itemOfCommandMatch, text, commandName, bot, message);
        });
    }else
    if (typeof commandMatch === 'object' && commandMatch.match) {
        return isTextMatchesToCommand(commandMatch.match, text, commandName, bot, message);
    }else {
        return false;
    }
}

module.exports = Bot;
