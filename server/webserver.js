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
const controller = require("./controller");

var socketMap = new Map();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

//Connect to db
mongoose.connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true });


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
        let teamId = await controller.createTeam(teamName, email);
        controller.createCredentials(email, pass, teamId);
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
        let data = await controller.createNewUser(teamName, email, notification);
        sendNotification(admin.email, data.notification);
        controller.createCredentials(email, pass, data.teamId);
        return res.json({ status: 200 });
    }
});
//Login post request
app.post("/login", async function(req, res){
    let email = req.body.email;
    let password = req.body.password;

    let teamUser = controller.findUserInCredentials(email);
    if(!teamUser){
        return res.json({ status: 400, message: "incorrectEmail"});
    }
    if(!bcrypt.compareSync(password, teamUser.password)){
        return res.json({ status: 400, message: "incorrectPassword" });
    }
    else{
        let team = controller.findTeam(teamUser.teamId);
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
        let newTask = controller.createNewTask(task, socketData.teamId);

        io.in(socketData.teamId).emit('Send Task', newTask);
    });
    socket.on('New Notification', function(notification) {
        let data = controller.createNewNotification(notification, socketData.teamId, socketData.email);

        data.forEach(function(d){
            sendNotification(d.email, d.notification);
        });
    })
    socket.on('Accept User', function(id){
        controller.acceptUser(socketData.teamId, socketData.email, id);
    });
    socket.on('Reject User', function(id){
        controller.deleteUser(socketData.teamId, socketData.email, id);
    });
    socket.on('Remove', function(data){
        if(data.type == "Notification"){
            controller.deleteNotification(socketData.teamId, socketData.email, data.id);
        }
        else if(data.type == "Task"){
            controller.deleteTask(socketData.teamId, data.id);

            socket.to(socketData.teamId).emit('Remove Task', data.id);
        }
    });
    socket.on('Send Event', function(event){
        controller.createNewEvent(socketData.teamId, event);

        socket.to(socketData.teamId).emit('New Event', event);
    });
    socket.on('Update Event', function(event){
        let array = controller.updateEvent(socketData.teamId, event);

        io.in(socketData.teamId).emit('Updated Event', { type: event.type, array: array });
    });
    socket.on('Delete Event', function(event){
        let array = controller.deleteEvent(socketData.teamId, event);

        io.in(socketData.teamId).emit('Deleted Event', { type: event.type, array: array });
    });
});

function sendNotification(email, notification){
    if(socketMap.has(email)){
        io.sockets.to(socketMap.get(email)).emit("Notification", notification);
    }
}

module.exports.sendNotification = sendNotification;
module.exports.app = app;

server.listen(process.env.PORT || port);