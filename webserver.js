const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const socketIo = require("socket.io");
const http = require("http");
const { ObjectId } = require("bson");
const { nextTick } = require("process");
const saltRounds = 10;
const app = express();
const server = http.createServer(app);
const port = 9000;
const dbUrl = "mongodb+srv://user:userPassword@teamup.lp8bc.mongodb.net/TeamUp?retryWrites=true&w=majority";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Connect to db
mongoose.connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true });

//Schema definitions
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
const teamModel = mongoose.model("Teams", teamsSchema);

const credentialSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    password: {type: String, required: true },
    teamId: {type: ObjectId, required: true}
});
//Password salting
credentialSchema.pre('save', function(next){
    let user = this;

    if(!user.isModified('password')){
        return next(); //check if save is a new user or modifying existing user
    }

    bcrypt.genSalt(saltRounds, function(err, salt){
        if(err){
            next(err);
        }
        else{
            bcrypt.hash(user.password, salt, function(err, hash){
                if(err){
                    next(err);
                }
                else{
                    user.password = hash; //save users password as hashed password
                    next();
                }
            });
        }
    });
});
const credentialModel = mongoose.model("Credentials", credentialSchema);

//Create team
app.post("/createTeam", function(req, res){
    let teamName = req.body.teamName;
    let email = req.body.email;
    let pass = req.body.pass;
  
    let team = new teamModel({ name: teamName, users: [{email: email, type: "Admin", accepted: true}]});

    team.save(function(err){
        if(err) console.log(err);

        else{
            createCredentials(email, pass, team._id);
        }
    });
});
//Create user in team

//Create credentials for users
function createCredentials(email, pass, team){
    let credential = new credentialModel({ email: email, password: pass, teamId: team });

    credential.save(function(err){
        if(err) console.log(err);
    })
}

//Login
//user = find them in database.
//bcrypt.compare(input password, user.password)

server.listen(port);