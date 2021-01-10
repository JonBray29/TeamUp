const mongoose = require('mongoose');
const credentialModel = require('../model/Credentials');
const teamModel = require('../model/Teams');
const controller = require('../controller');

describe("Mongoose create tests",() => {
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

    test("Create team", async () => {
        await controller.createTeam("Test Team", "Test@email.com");

        let newTeam = await teamModel.findOne({ name: 'Test Team'});
        expect(newTeam).toBeDefined();
    });
    test("Create New User", async () => {
        let team = new teamModel({ name: "Test", users: [{email: "test@test.com", type: "Admin", accepted: true}]});
        let notification = {type: "Request", message: "Request", date: "2021-01-09T22:15:46Z", userEmail: "Test1@test.com"};
        await team.save();
        await controller.createNewUser("Test", "Test1@test.com", notification);
        let newTeam = await teamModel.findOne({ name: "Test" });
        expect(newTeam.users.length).toEqual(2);
    });
    test("Create credentials", async () => {
        await controller.createCredentials("test@test.com", "Password1", "5a8d1cf5208ce33820f193bf");

        let newUser = await credentialModel.findOne({ email: "test@test.com"});
        expect(newUser).toBeDefined();
    });
    test("Create new event", async () => {
        let team = new teamModel({ _id: "5a8d1cf5208ce33820f193bf", name: "Test", users: [{email: "test@test.com", type: "Admin", accepted: true}]});
        await team.save();
        let event = { 
            _id: "5a8d1cf5208ce33820f193bb", 
            title: "Test", 
            start: "2021-01-09T22:15:46Z", 
            end: "2021-01-09T22:15:46Z",
            allDay: false,
            type: "Time"
        };
        await controller.createNewEvent("5a8d1cf5208ce33820f193bf", event);
        let newTeam = await teamModel.findOne({ name: "Test" });
        expect(newTeam.times.length).toEqual(1);
    });
    test("Create new task", async () => {
        let team = new teamModel({ _id: "5a8d1cf5208ce33820f193bf", name: "Test", users: [{email: "test@test.com", type: "Admin", accepted: true}]});
        await team.save();
        await controller.createNewTask("Test", "5a8d1cf5208ce33820f193bf");
        let newTeam = await teamModel.findOne({ name: "Test" });
        expect(newTeam.tasks.length).toEqual(1);
    });
    test("Create new notification", async () => {
        let team = new teamModel({ _id: "5a8d1cf5208ce33820f193bf", name: "Test", users: [{email: "test@test.com", type: "Admin", accepted: true}]});
        await team.save();
        let notification = {type: "Request", message: "Request", date: "2021-01-09T22:15:46Z"};
        await controller.createNewNotification(notification, "5a8d1cf5208ce33820f193bf", "test@test.com");
        let newTeam = await teamModel.findOne({ name: "Test" });
        expect(newTeam.users[0].notifications.length).toEqual(1);
    });
});