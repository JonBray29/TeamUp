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

    await teamModel.updateOne(
        { name: teamName },
        { $push: { users: newUser }}
    )
    let admin = team.users.find(user => user.type == "Admin");

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
    let team = await findTeam(teamId);
    let user = team.users.find(user => user.email == email);
    user.notifications.push(notification);
    await team.save();
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
    let team = await findTeam(teamId);
    let user = team.users.find(user => user.email == email);
    let notification = user.notifications.find(notification => notification._id == id);
    let tempUser = team.users.find(user => user.email == notification.userEmail);
    tempUser.accepted = true;
    user.notifications = user.notifications.filter(notification => notification._id != id);
    await team.save();
}
async function updateEvent(teamId, event){
    let team = await findTeam(teamId);
    let tempEvent;
    
    switch(event.type){
        case "Holiday":
            tempEvent = team.holidays.find(e => e._id == event.id);
            tempEvent.title = event.title;
            tempEvent.start = event.start;
            tempEvent.end = event.end;
            await team.save();
        break;
        case "Meeting":
            tempEvent = team.meetings.find(e => e._id == event.id);
            tempEvent.title = event.title;
            tempEvent.start = event.start;
            tempEvent.end = event.end;
            await team.save();
        break;
        case "Milestone":
            tempEvent = team.milestones.find(e => e._id == event.id);
            tempEvent.title = event.title;
            tempEvent.start = event.start;
            tempEvent.end = event.end;
            await team.save();
        break;
        default: 
            console.log("Event not found.");
    }
}
//Database delete functions
async function deleteUser(teamId, email, id){
    let team = await findTeam(teamId);
    let user = team.users.find(user => user.email == email);
    let notification = user.notifications.find(notification => notification._id == id);
    team.users = team.users.filter(user => user.email != notification.userEmail);
    user.notifications = user.notifications.filter(notification => notification._id != id);
    await team.save();

    return notification.userEmail;
}
async function deleteUserCredentials(userEmail){
    await credentialModel.deleteOne({ email: userEmail });
}
async function deleteNotification(teamId, email, id){
    let team = await findTeam(teamId);
    let user = team.users.find(user => user.email == email);
    user.notifications = user.notifications.filter(notification => notification._id != id);
    await team.save();
}
async function deleteTask(teamId, id){
    await teamModel.updateOne(
        { _id: teamId },
        { $pull: { tasks: { _id: id } }}
    )
}
async function deleteEvent(teamId, id, type){
    switch(type){
        case "Holiday":
            await teamModel.updateOne(
                { _id: teamId },
                { $pull: { holidays: { _id: id } }}
            )
            break;
        case "Meeting":
            await teamModel.updateOne(
                { _id: teamId },
                { $pull: { meetings: { _id: id } }}
            )
            break;
        case "Milestone":
            await teamModel.updateOne(
                { _id: teamId },
                { $pull: { milestones: { _id: id } }}
            )
            break;
        case "Time":
            await teamModel.updateOne(
                { _id: teamId },
                { $pull: { times: { _id: id } }}
            )
            break;
        default: 
            console.log("Event not found.");
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