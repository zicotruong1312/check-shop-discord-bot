const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true
    },
    puuid: {
        type: String,
        required: true
    },
    riotUsername: {
        type: String,
        required: true
    },
    encryptedCookies: {
        type: String,
        required: true
    },
    iv: {
        type: String,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastShopCheck: {
        type: Date,
        default: null
    }
});

UserSessionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('UserSession', UserSessionSchema);
