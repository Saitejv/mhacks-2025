const mongoose = require('../mongoose.js');

const { Schema } = mongoose;

// Task Schema
const TaskSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: Number, // Duration in minutes (or specify unit in docs)
        required: true,
        min: 1
    },
    deadline: {
        type: Date,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    collection: 'tasks',
    timestamps: true // Adds createdAt and updatedAt
});

// Task Model
const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;