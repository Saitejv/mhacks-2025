const mongoose = require('../mongoose.js');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    collection: 'users'
});

const User = mongoose.model('User', userSchema);

module.exports = User;