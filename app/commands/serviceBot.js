'use strict';

module.exports = {
    daily: {
        matches: [
            /^[Ее]жедневник/,
            /^[еЕЁё]ж/,
        ],
        isBotCommand: true,
        sentAll: true,
    }
};
