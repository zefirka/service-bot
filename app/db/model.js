'use strict';

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    id: String,
    username: String,
    lang: String,
    timezone: String
});

const User = mongoose.model('User', UserSchema);

module.exports = {
    User
};
