const http = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { ObjectId } = require("bson");
const saltRounds = 10;
const app = express();
const port = 9000;
const dbUrl = "mongodb+srv://user:userPassword@teamup.lp8bc.mongodb.net/TeamUp?retryWrites=true&w=majority";

//Connect to db
mongoose.connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true });
//Schema definitions
const credentialSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    password: {type: String, required: true },
    teamId: {type: ObjectId, required: true}
});
const credentials = mongoose.model("Credentials", credentialSchema);

const teamsSchema = new mongoose.Schema({
    name: { type: String, required: true, lowercase: true, unique: true },
    users: [{
        email: { type: String, required: true, lowercase: true, trim: true, unique: true },
        type: { type: String, enum: ["Admin", "Standard"], required: true },
        accepted: { type: Boolean, required: true },
        notifications: [{
            type: { type: String, enum: ["Request", "Event"], required: true},
            message: { type: String, required: true, trim: true },
            date: { type: Date, required: true },
            userEmail: { type: String, required: false, trim: true }
        }]
    }],
    tasks: [{
        _id: { type: ObjectId, auto: true },
        task: { type: String, required: true, trim: true }
    }],
    events: [{
        meetings: [{
            title: { type: String, required: true, trim: true },
            start: { type: Date, required: true, min: Date.now },
            end: { type: Date, requried: true, min: Date.now },
            allDay: { type: Boolean, default: false }
        }],
        holidays: [{
            title: { type: String, required: true, trim: true },
            start: { type: Date, required: true, min: Date.now },
            end: { type: Date, requried: true, min: Date.now },
            allDay: { type: Boolean, default: true }
        }],
        milestones: [{
            title: { type: String, required: true, trim: true },
            start: { type: Date, required: true, min: Date.now },
            end: { type: Date, requried: true, min: Date.now },
            allDay: { type: Boolean, default: true }
        }],
        times: [{
            title: { type: String, required: true, trim: true },
            start: { type: Date, required: true, min: Date.now },
            end: { type: Date, requried: true, min: Date.now },
            allDay: { type: Boolean, default: false }
        }]
    }]
});
const teams = mongoose.model("Teams", teamsSchema);
//connect to credential collection
//connect to teams collection

app.listen(port);