const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const path = require("path");
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
        let admin = team.users.find(user => user.type == "Admin");
        admin.notifications.push(notification);
        let tempNotification = admin.notifications.find(notification => notification == notification);
        if(socketMap.has(admin.email)){
            io.sockets.to(socketMap.get(admin.email)).emit("Notification", tempNotification);
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

        if(teamUser.accepted){
            return res.json({
                status: 200, 
                teamId: team._id,
                tasks: team.tasks,
                meetings: team.meetings,
                holidays: team.holidays,
                milestones: team.milestones,
                times: team.times,
                notifications: teamUser.notifications
            });
        }
        else{
            return res.json({ status: 400, message: "notAccepted"});
        }
    }
});
//Mongoose object id
app.post("/id", function(req, res){
    return res.send(mongoose.Types.ObjectId());
});
app.get("/", function(req, res){
    res.send("Hello");
});

class SocketData {
    constructor(id, email){
        this.teamId = id;
        this.email = email;
    }
}

io.on('connection', function(socket){
    let socketData;
    socket.on('join', async function(data){
        socket.join(data.teamId);
        socketMap.set(data.email, socket.id);
        socketData = new SocketData(data.teamId, data.email);
    }); 
    socket.on('disconnect', function(reason){
        socketMap.delete(socketData.email);
    });
    socket.on('New Task', async function(task){
        let newTask = { _id: mongoose.Types.ObjectId(), task: task};
        await teamModel.updateOne(
            { _id: socketData.teamId },
            { $push: { tasks: newTask}}
        );
        io.in(socketData.teamId).emit('Send Task', newTask);
    });
    socket.on('New Notification', async function(notification) {
        notification.userEmail = socketData.email;
        notification._id = mongoose.Types.ObjectId();

        let team = await teamModel.findOne({ _id: socketData.teamId });
        team.users.forEach(function(user){
            if(user.email != notification.userEmail){
                user.notifications.push(notification);
                team.save();

                if(socketMap.has(user.email)){
                    io.to(socketMap.get(user.email)).emit("Notification", notification);
                }
            }
        })
    })
    socket.on('Accept User', async function(id){
        //Accept user
        let team = await teamModel.findOne({ _id: socketData.teamId });
        let user = team.users.find(user => user.email == socketData.email);
        let notification = user.notifications.find(notification => notification._id == id);
        let tempUser = team.users.find(user => user.email == notification.userEmail);
        tempUser.accepted = true;
        user.notifications = user.notifications.filter(notification => notification._id != id);
        team.save();
    });
    socket.on('Reject User', async function(id){
        //Reject user, delete user from array
        let team = await teamModel.findOne({ _id: socketData.teamId });
        let user = team.users.find(user => user.email == socketData.email);
        let notification = user.notifications.find(notification => notification._id == id);
        team.users = team.users.filter(user => user.email != notification.userEmail);
        user.notifications = user.notifications.filter(notification => notification._id != id);
        team.save();

        await credentialModel.deleteOne({ email: notification.userEmail });
    });
    socket.on('Remove', async function(data){
        if(data.type == "Notification"){
            let team = await teamModel.findOne({ _id: socketData.teamId });
            let user = team.users.find(user => user.email == socketData.email);
            user.notifications = user.notifications.filter(notification => notification._id != data.id);
            team.save();
        }
        else if(data.type == "Task"){
            //Remove task by id
            let team = await teamModel.findOne({ _id: socketData.teamId });
            team.tasks = team.tasks.filter(task => task._id != data.id);
            team.save();

            socket.to(socketData.teamId).emit('Remove Task', data.id);
        }
    });
    socket.on('Send Event', async function(event){
        //Add new event to mongodb 
        let team = await teamModel.findOne({ _id: socketData.teamId });
        switch(event.type){
            case "Holiday":
                team.holidays.push(event);
            break;
            case "Meeting":
                team.meetings.push(event);
            break;
            case "Milestone":
                team.milestones.push(event);
            break;
            case "Time":
                team.times.push(event);
            break;
            default: 
                console.log("Event not found.");
        }
        team.save();

        socket.to(socketData.teamId).emit('New Event', event);
    });
    socket.on('Update Event', async function(event){
        let team = await teamModel.findOne({ _id: socketData.teamId });
        let type = event.type;
        let array;
        switch(type){
            case "Holiday":
                team.holidays.forEach(function(e){
                    if(e._id == event.id){
                        e.title = event.title;
                        e.start = event.start;
                        e.end = event.end;
                    }
                });

                array = team.holidays;
            break;
            case "Meeting":
                team.meetings.forEach(function(e){
                    if(e._id == event.id){
                        e.title = event.title;
                        e.start = event.start;
                        e.end = event.end;
                    }
                });

                array = team.meetings;
                break;
            case "Milestone":
                team.milestones.forEach(function(e){
                    if(e._id == event.id){
                        e.title = event.title;
                        e.start = event.start;
                        e.end = event.end;
                    }
                });

                array = team.milestones;
                break;
            default: 
                console.log("Event not found.");
        }
        team.save();

        io.in(socketData.teamId).emit('Updated Event', { type: type, array: array });
    });
    socket.on('Delete Event', async function(event){
        let team = await teamModel.findOne({ _id: socketData.teamId });
        let type = event.type;
        let array;
        switch(type){
            case "Holiday":
                team.holidays = team.holidays.filter(e => e._id != event.id);

                array = team.holidays;
            break;
            case "Meeting":
                team.meetings = team.meetings.filter(e => e._id != event.id);

                array = team.meetings;
                break;
            case "Milestone":
                team.milestones = team.milestones.filter(e => e._id != event.id);

                array = team.milestones;
                break;
            case "Time":
                team.times = team.times.filter(e => e._id != event.id);

                array = team.times;
                break;
            default: 
                console.log("Event not found.");
        }
        team.save();

        io.in(socketData.teamId).emit('Deleted Event', { type: type, array: array });
    });
});

server.listen(process.env.PORT || port);