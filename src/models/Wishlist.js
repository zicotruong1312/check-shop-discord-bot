const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        index: true
    },
    skinId: {
        type: String,
        required: true
    },
    skinName: {
        type: String,
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// A user shouldn't add the same skin twice
WishlistSchema.index({ discordId: 1, skinId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', WishlistSchema);
