'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema({
    id: String,
    username: String,
    lang: String,
    timezone: String
});

const MeetingSchema = new Schema({
    address: String,
    themes: [String],
    note: String,
    time: String
});

const ServiceSchema = new Schema({
    id: String,
    name: String,
    servant: UserSchema,
    from: Date,
    to: Date,
    io: Boolean
});

const MeetingMetaSchema = new Schema({
    id: String,
    name: String,
    address: String,
    mark: Boolean,
    pandus: Boolean,
    map: String,
    schedule: [MeetingSchema],
    services: [ServiceSchema]
});

const User = mongoose.model('User', UserSchema);
const Meeting = mongoose.model('Meeting', MeetingSchema);
const MeetingMeta = mongoose.model('MeetingMeta', MeetingMetaSchema);
const Service = mongoose.model('Service', ServiceSchema);

module.exports = {
    User,
    Meeting,
    MeetingMeta,
    Service
};
