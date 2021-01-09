const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });
const port = 9000;
const dbUrl = "mongodb+srv://user:userPassword@teamup.lp8bc.mongodb.net/TeamUp?retryWrites=true&w=majority";
const credentialModel = require("./model/Credentials");
const teamModel = require("./model/Teams");

var socketMap = new Map();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

//Connect to db
mongoose.connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true });

//Database insert functions
async function createTeam(teamName, email){
    let team = new teamModel({ name: teamName, users: [{email: email, type: "Admin", accepted: true}]});
    await team.save();
    return team._id;
}
async function createNewUser(teamName, email, notification){
    let team = await teamModel.findOne({ name: teamName });
    let newUser = { email: email, type: "Standard", accepted: false };
    let admin = team.users.find(user => user.type == "Admin");

    await teamModel.updateOne(
        { name: teamName },
        { $push: { users: newUser }}
    )
    admin.notifications.push(notification);
    let tempNotification = admin.notifications.find(notification => notification == notification);
    await team.save();

    return { notification: tempNotification, teamId: team._id };


}
async function createCredentials(email, pass, team){
    let credential = new credentialModel({ email: email, password: pass, teamId: team });
    await credential.save();
}
async function createNewEvent(teamId, event){
    let team = await teamModel.findOne({ _id: teamId });
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
        await team.save();
}
async function createNewTask(task, teamId){
    let newTask = { _id: mongoose.Types.ObjectId(), task: task};
    await teamModel.updateOne(
        { _id: teamId },
        { $push: { tasks: newTask}}
    );
    return newTask;
}
async function createNewNotification(notification, teamId, email){
    notification.userEmail = email;
    notification._id = mongoose.Types.ObjectId();

    let team = await teamModel.findOne({ _id: teamId });
    team.users.forEach(async function(user){
        if(user.email != notification.userEmail){
            user.notifications.push(notification);
            await team.save();
            sendNotification(user.email, notification);
        }
    });
}
//Database read functions
async function findUserInCredentials(email){
    return await credentialModel.findOne({ email: email });
}
async function findTeam(teamId){
    return await teamModel.findOne({ _id: teamId });
}
//Database update functions
async function acceptUser(teamId, email, id){
    let team = findTeam(teamId);
    let user = team.users.find(user => user.email == email);
    let notification = user.notifications.find(notification => notification._id == id);
    let tempUser = team.users.find(user => user.email == notification.userEmail);
    tempUser.accepted = true;
    user.notifications = user.notifications.filter(notification => notification._id != id);
    await team.save();
}
async function updateEvent(teamId, event){
    let team = findTeam(teamId);
    switch(event.type){
        case "Holiday":
            team.holidays.forEach(function(e){
                if(e._id == event.id){
                    e.title = event.title;
                    e.start = event.start;
                    e.end = event.end;
                }
            });
            await team.save();
            return team.holidays;
        case "Meeting":
            team.meetings.forEach(function(e){
                if(e._id == event.id){
                    e.title = event.title;
                    e.start = event.start;
                    e.end = event.end;
                }
            });
            await team.save();
            return team.meetings;
        case "Milestone":
            team.milestones.forEach(function(e){
                if(e._id == event.id){
                    e.title = event.title;
                    e.start = event.start;
                    e.end = event.end;
                }
            });
            await team.save();
            return team.milestones;
        default: 
            console.log("Event not found.");
            return [];
    }
}
//Database delete functions
async function deleteUser(teamId, email, id){
    let team = findTeam(teamId);
    let user = team.users.find(user => user.email == email);
    let notification = user.notifications.find(notification => notification._id == id);
    team.users = team.users.filter(user => user.email != notification.userEmail);
    user.notifications = user.notifications.filter(notification => notification._id != id);
    await team.save();

    deleteUserCredentials(notification.userEmail);
}
async function deleteUserCredentials(userEmail){
    await credentialModel.deleteOne({ email: userEmail });
}
async function deleteNotification(teamId, email, id){
    let team = findTeam(teamId);
    let user = team.users.find(user => user.email == email);
    user.notifications = user.notifications.filter(notification => notification._id != id);
    await team.save();
}
async function deleteTask(teamId, id){
    let team = findTeam(teamId);
    team.tasks = team.tasks.filter(task => task._id != id);
    await team.save();
}
async function deleteEvent(teamId, event){
    let team = findTeam(teamId);
    switch(event.type){
        case "Holiday":
            team.holidays = team.holidays.filter(e => e._id != event.id);
            await team.save();
            return team.holidays;
        case "Meeting":
            team.meetings = team.meetings.filter(e => e._id != event.id);
            await team.save()
            return team.meetings;
        case "Milestone":
            team.milestones = team.milestones.filter(e => e._id != event.id);
            await team.save()
            return team.milestones;
        case "Time":
            team.times = team.times.filter(e => e._id != event.id);
            await team.save()
            return team.times;
        default: 
            console.log("Event not found.");
            return [];
    }
}
module.exports.createTeam = createTeam;
module.exports.createNewUser = createNewUser;
module.exports.createCredentials = createCredentials;
module.exports.createNewEvent = createNewEvent;
module.exports.createNewTask = createNewTask;
module.exports.createNewNotification = createNewNotification;
module.exports.findUserInCredentials = findUserInCredentials;
module.exports.findTeam = findTeam;
module.exports.acceptUser = acceptUser;
module.exports.updateEvent = updateEvent;
module.exports.deleteUser = deleteUser;
module.exports.deleteUserCredentials = deleteUserCredentials;
module.exports.deleteTask = deleteTask;
module.exports.deleteEvent = deleteEvent;

//Create team post request
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
        let teamId = await createTeam(teamName, email);
        createCredentials(email, pass, teamId);
        return res.json( { status: 200 } );
    }
});
//Join team post request
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
        let data = await createNewUser(teamName, email, notification);
        sendNotification(admin.email, data.notification);
        createCredentials(email, pass, data.teamId);
        return res.json({ status: 200 });
    }
});
//Login post request
app.post("/login", async function(req, res){
    let email = req.body.email;
    let password = req.body.password;

    let teamUser = findUserInCredentials(email);
    if(!user){
        return res.json({ status: 400, message: "incorrectEmail"});
    }
    if(!bcrypt.compareSync(password, user.password)){
        return res.json({ status: 400, message: "incorrectPassword" });
    }
    else{
        let team = findTeam(teamUser.teamId);
        let user = team.users.find(user => user.email == email);

        if(user.accepted){
            return res.json({
                status: 200, 
                teamId: team._id,
                tasks: team.tasks,
                meetings: team.meetings,
                holidays: team.holidays,
                milestones: team.milestones,
                times: team.times,
                notifications: user.notifications
            });
        }
        else{
            return res.json({ status: 400, message: "notAccepted"});
        }
    }
});
//Mongoose new object id post request
app.post("/id", function(req, res){
    return res.send(mongoose.Types.ObjectId());
});
//Class to hold the data for the socket
class SocketData {
    constructor(id, email){
        this.teamId = id;
        this.email = email;
    }
}
//Socket functions
io.on('connection', function(socket){
    let socketData;
    socket.on('join', function(data){
        socket.join(data.teamId);
        socketMap.set(data.email, socket.id);
        socketData = new SocketData(data.teamId, data.email);
    }); 
    socket.on('disconnect', function(reason){
        socketMap.delete(socketData.email);
    });
    socket.on('New Task', function(task){
        let newTask = createNewTask(task, socketData.teamId);

        io.in(socketData.teamId).emit('Send Task', newTask);
    });
    socket.on('New Notification', function(notification) {
        createNewNotification(notification, socketData.teamId, socketData.email);
    })
    socket.on('Accept User', function(id){
        acceptUser(socketData.teamId, socketData.email, id);
    });
    socket.on('Reject User', function(id){
        deleteUser(socketData.teamId, socketData.email, id);
    });
    socket.on('Remove', function(data){
        if(data.type == "Notification"){
            deleteNotification(socketData.teamId, socketData.email, data.id);
        }
        else if(data.type == "Task"){
            deleteTask(socketData.teamId, data.id);

            socket.to(socketData.teamId).emit('Remove Task', data.id);
        }
    });
    socket.on('Send Event', function(event){
        createNewEvent(socketData.teamId, event);

        socket.to(socketData.teamId).emit('New Event', event);
    });
    socket.on('Update Event', function(event){
        let array = updateEvent(socketData.teamId, event);

        io.in(socketData.teamId).emit('Updated Event', { type: event.type, array: array });
    });
    socket.on('Delete Event', function(event){
        let array = deleteEvent(socketData.teamId, event);

        io.in(socketData.teamId).emit('Deleted Event', { type: event.type, array: array });
    });
});

function sendNotification(email, notification){
    if(socketMap.has(email)){
        io.sockets.to(socketMap.get(email)).emit("Notification", notification);
    }
}

module.exports.app = app;

server.listen(process.env.PORT || port);