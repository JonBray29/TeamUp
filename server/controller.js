const mongoose = require('mongoose');
const teamModel = require('./model/Teams');
const credentialModel = require('./model/Credentials');

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
    let data = [];
    team.users.forEach(async function(user){
        if(user.email != notification.userEmail){
            user.notifications.push(notification);
            await team.save();
            data.push({email: user.email, notification: notification});
        }
    });
    return data;
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
module.exports.deleteNotification = deleteNotification;
module.exports.deleteTask = deleteTask;
module.exports.deleteEvent = deleteEvent;