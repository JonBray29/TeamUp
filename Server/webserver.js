const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const moment = require("moment");
const { ObjectId } = require("bson");
const saltRounds = 10;
const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });
const port = 9000;
const dbUrl = "mongodb+srv://user:userPassword@teamup.lp8bc.mongodb.net/TeamUp?retryWrites=true&w=majority";

var socketMap = new Map();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

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
app.post("/createTeam", async function(req, res){
    let teamName = req.body.teamName;
    let email = req.body.email;
    let pass = req.body.pass;
  
    if(await credentialModel.countDocuments({ email: email }) != 0){
        return res.json({ status: 400, message: "email" });
    }
    else if(await teamModel.countDocuments({ name: teamName }) != 0){
        return res.json({ status: 400, message: "teamNameExists" });
    }
    else{
        let team = new teamModel({ name: teamName, users: [{email: email, type: "Admin", accepted: true}]});

        team.save();
        createCredentials(email, pass, team._id);
        return res.json( { status: 200 } );
    }
});
//Join team
app.post("/joinTeam", async function(req, res){
    let teamName = req.body.teamName;
    let email = req.body.email;
    let pass = req.body.pass;
    let notification = req.body.notification;

    if(await credentialModel.countDocuments({ email: email }) != 0){
        return res.json({ status: 400, message: "email" });
    }
    else if(await teamModel.countDocuments({ name: teamName }) == 0){
        console.log("team");
        return res.json({ status: 400, message: "teamNameNonExistent" });
    }
    else{
        let newUser = { email: email, type: "Standard", accepted: false };
        await teamModel.updateOne(
            { name: teamName },
            { $push: { users: newUser }}
        )
        let team = await teamModel.findOne({ name: teamName });
        createCredentials(email, pass, team._id);
        //Add notification to admins notifications, web socket send the notification. ----------------------------------------------------------------
        let admin = team.users.find(user => user.type == "Admin");
        admin.notifications.push(notification);
        if(socketMap.has(admin.email)){
            console.log("hello");
            io.sockets.to(socketMap.get(admin.email)).emit("Notification", notification);
        }
        
        team.save();
        return res.json({ status: 200 });
    }
});
//Create credentials for users
function createCredentials(email, pass, team){
    let credential = new credentialModel({ email: email, password: pass, teamId: team });
    credential.save();
}

//Login
app.post("/login", async function(req, res){
    let email = req.body.email;
    let password = req.body.password;

    let user = await credentialModel.findOne({ email: email });
    if(!user){
        return res.json({ status: 400, message: "incorrectEmail"});
    }
    if(!bcrypt.compareSync(password, user.password)){
        return res.json({ status: 400, message: "incorrectPassword" });
    }
    else{
        let team = await teamModel.findOne({ _id: user.teamId });
        let teamUser = team.users.find(user => user.email == email);
        return res.json({
            status: 200, 
            teamName: team.name,
            tasks: team.tasks,
            meetings: team.meetings,
            holidays: team.holidays,
            milestones: team.milestones,
            times: team.times,
            notifications: teamUser.notifications
        });
    }
});

app.get('/', (req, res) => { res.send('Hello from Express!')});

io.on('connection', function(socket){
    let socketEmail;
    socket.on('join', function(data){
        socket.join(data.room);
        socketMap.set(data.email, socket.id);
        socketEmail = data.email;

    }); 
    socket.on('disconnect', function(reason){
        socketMap.delete(socketEmail);
    });
    //ON DISCONNECT REMOVE THE SOCKET FROM THE SOCKET DICT
});

server.listen(process.env.PORT || port);