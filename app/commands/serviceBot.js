'use strict';

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
        matches: [/^ru$/, /^en$/, /^Передумал$/],
        sentAll: false,
        event: 'language:change',
        onState: 'language:await',
        mismatchMessage: 'Что?'
    }

};

/**
    daily - Запросить ежедневник
    language - Сменить язык (Change language)
*/
