'use strict';

const i18n = require('../utils/i18n');

function flush(bot) {
    bot.flushState();
}

function _null() {
    return Promise.resolve(null);
}

let onRussianMatch = {
    match: /^ru$/,
    answer: function (bot, lang) {
        if (lang === 'ru') {
            onRussianMatch.action = _null;
            return 'Язык и так русский';
        }
        onRussianMatch.action = function (bot, uid) {
            flush(bot);
            return bot.setLang(uid, 'ru');
        };
        return 'Готовенько!';

    },
    action: flush
};

let onEnglishMatch = {
    match: /^en$/,
    answer: function (bot, lang) {
        if (lang === 'en') {
            onEnglishMatch.action = _null;
            return 'Language is already English';
        }
        onEnglishMatch.action = function (bot, uid) {
            flush(bot);
            return bot.setLang(uid, 'en');
        };
        return 'Ready!';
    },
    action: flush
};

let languageMatches = [
    onRussianMatch,
    onEnglishMatch, {
        match: function (bot, message) {
            i18n.lang(bot.getUserLang(message.from.id));
            return new RegExp('^' + i18n('I change my mind') + '$').test(message.text);
        },
        answer: function (bot, lang) {
            i18n(lang);
            return i18n('As you wish');
        },
        action: flush
    }
];

module.exports = {
    daily: {
        matches: [
            /^[Ее]жедневник/,
            /^[еЕЁё]ж/,
        ],
        isBotCommand: true,
        sentAll: true,
    },
    language: {
        matches: /Сменить язык/,
        isBotCommand: true,
        sentAll: false,
        event: 'language:request'
    },
    setLanguage: {
        matches: languageMatches,
        sentAll: false,
        event: 'language:change',
        onState: 'language:await',
        mismatchMessage: i18n('Wat')
    }

};

/**
    daily - Запросить ежедневник
    language - Сменить язык (Change language)
*/