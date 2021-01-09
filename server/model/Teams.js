const mongoose = require('mongoose');

const teamsSchema = new mongoose.Schema({
    name: { type: String, required: true, lowercase: true, unique: true },
    users: [{
        email: { type: String, required: true, lowercase: true, trim: true, unique: true },
        type: { type: String, enum: ["Admin", "Standard"], required: true },
        accepted: { type: Boolean, required: true },
        notifications: [{
            type: { type: String, enum: ["Request", "Event", "Task"], required: true},
            message: { type: String, required: true, trim: true },
            date: { type: Date, required: true },
            userEmail: { type: String, required: false, trim: true }
        }]
    }],
    tasks: [{
        task: { type: String, required: true, trim: true }
    }],
    meetings: [{
        title: { type: String, required: true, trim: true },
        start: { type: Date, required: true, min: Date.now },
        end: { type: Date, requried: true, min: Date.now },
        allDay: { type: Boolean, default: false },
        type: {type: String, required: true, default: "Meeting" }
    }],
    holidays: [{
        title: { type: String, required: true, trim: true },
        start: { type: Date, required: true, min: Date.now },
        end: { type: Date, requried: true, min: Date.now },
        allDay: { type: Boolean, default: true },
        type: {type: String, required: true, default: "Holiday" }
    }],
    milestones: [{
        title: { type: String, required: true, trim: true },
        start: { type: Date, required: true, min: Date.now },
        end: { type: Date, requried: true, min: Date.now },
        allDay: { type: Boolean, default: true },
        type: {type: String, required: true, default: "Milestone" }
    }],
    times: [{
        title: { type: String, required: true, trim: true },
        start: { type: Date, required: true },
        end: { type: Date, requried: true},
        allDay: { type: Boolean, default: false },
        type: {type: String, required: true, default: "Time" }
    }]
});

module.exports = mongoose.model("Teams", teamsSchema);