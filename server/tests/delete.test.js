const mongoose = require('mongoose');
const moment = require('moment')
const credentialModel = require('../model/Credentials');
const teamModel = require('../model/Teams');
const controller = require('../controller');

describe("mongoose delete tests", () => {
    const dbUrl = "mongodb+srv://user:userPassword@teamup.lp8bc.mongodb.net/TestDb?retryWrites=true&w=majority";

    beforeAll(async () => {
        mongoose.connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true });
    });
    afterAll(async () => {
        await mongoose.connection.close()
    });
    
    afterEach(async () => {
        await credentialModel.deleteMany();
        await teamModel.deleteMany();
    });

    test("Delete user", async () => {
        let team = new teamModel({ 
            _id: "5a8d1cf5208ce33820f193bf", 
            name: "Test", 
            users: [{
                email: "test@test.com", 
                type: "Admin", 
                accepted: true,
                notifications: [{
                    _id: "5a8d1cf5208ce33820f193bc",
                    type: "Request",
                    message: "request",
                    date: "2021-01-09T22:15:46Z",
                    userEmail: "test1@test.com"
                }]
            }, {
                email: "test1@test.com",
                type: "Standard",
                accepted: false
            }]
        });
        await team.save();

        await controller.deleteUser("5a8d1cf5208ce33820f193bf", "test@test.com", "5a8d1cf5208ce33820f193bc");

        let newTeam = await teamModel.findOne({ name: "Test" });
        let count = newTeam.users.filter(user => user.accepted == true);
        expect(count.length).toEqual(1);
    });
    test("Delete user credentials", async () => {
        let credentials = credentialModel({ email: "test@test.com", password: "Password1", teamId: "5a8d1cf5208ce33820f193bf"});
        await credentials.save();

        await controller.deleteUserCredentials("test@test.com");
        let temp = await credentialModel.estimatedDocumentCount();
        expect(temp).toEqual(0);
    });
    test("Delete notification", async () => {
        let team = new teamModel({ 
            _id: "5a8d1cf5208ce33820f193bf", 
            name: "Test", 
            users: [{
                email: "test@test.com", 
                type: "Admin", 
                accepted: true,
                notifications: [{
                    _id: "5a8d1cf5208ce33820f193bc",
                    type: "Request",
                    message: "request",
                    date: "2021-01-09T22:15:46Z",
                    userEmail: "test1@test.com"
                }]
            }]
        });
        await team.save();
        await controller.deleteNotification("5a8d1cf5208ce33820f193bf", "test@test.com", "5a8d1cf5208ce33820f193bc");
        let newTeam = await teamModel.findOne({ name: "Test" });
        expect(newTeam.users[0].notifications.length).toEqual(0);

    });
    test("Delete task", async () => {
        let team = new teamModel({ 
            _id: "5a8d1cf5208ce33820f193bf", 
            name: "Test", 
            users: [{
                email: "test@test.com", 
                type: "Admin", 
                accepted: true
            }],
            tasks: [{ _id: "5a8d1cf5208ce33820f193bc", task: "Test" }]
        });
        await team.save();
        controller.deleteTask("5a8d1cf5208ce33820f193bf", "5a8d1cf5208ce33820f193bc");
        let newTeam = await teamModel.findOne({ name: "Test" });
        expect(newTeam.tasks.length).toEqual(0);
    });
    test("Delete event", async () => {
        let start = moment().add(2, "d").format();
        let end = moment().add(3, "d").format();
        let team = new teamModel({ 
            _id: "5a8d1cf5208ce33820f193bf", 
            name: "Test", 
            users: [{email: "test@test.com", type: "Admin", accepted: true}],
            meetings: [{ _id: "5a8d1cf5208ce33820f193bc", title: "Test", start: start, end: end, allDay: false}]
        });
        await team.save();
        await controller.deleteEvent("5a8d1cf5208ce33820f193bf", "5a8d1cf5208ce33820f193bc", "Meeting")
    });
});