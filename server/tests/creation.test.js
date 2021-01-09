const {MongoClient} = require('mongodb');
const server = require('../webserver');
const credentialModel = require("../model/Credentials");
const teamModel = require("../model/Teams");

describe("Test the mongoDB creating functions",() => {
    let connection;
    let db;

    beforeAll(async () => {
        connection = await MongoClient.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        db = await connection.db();
    });
    afterAll(async () => {
        await connection.close();
    });

    afterEach(async () => {
        await credentialModel.deleteMany();
        await teamModel.deleteMany();
    });

    test("Create team", async () => {
        await server.createTeam("Test Team", "Test@email.com");

        let newTeam = await teamModel.findOne({ name: 'Test Team'});
        expect(newTeam).toBeDefined();
    });
    test("Create New User", async () => {
        let team = new teamModel({ name: "Test", users: [{email: "test@test.com", type: "Admin", accepted: true}]});
        await team.save();
        let notification = {type: "Request", message: "Request", date: "2021-01-09T22:15:46Z", userEmail: "Test1@test.com"};
        await server.createNewUser("Test", "Test1@test.com", notification);
        let newTeam = await teamModel.findOne({ name: "Test" });
        expect(newTeam.users.length).toEqual(2);
    });
    test("Create credentials", async () => {
        await server.createCredentials("test@test.com", "Password1", "5a8d1cf5208ce33820f193bf");

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
        await server.createNewEvent("5a8d1cf5208ce33820f193bf", event);
        let newTeam = await teamModel.findOne({ name: "Test" });
        expect(newTeam.times.length).toEqual(1);
    });
    test("Create new task", async () => {
        let team = new teamModel({ _id: "5a8d1cf5208ce33820f193bf", name: "Test", users: [{email: "test@test.com", type: "Admin", accepted: true}]});
        await team.save();
        await server.createNewTask("Test", "5a8d1cf5208ce33820f193bf");
        let newTeam = await teamModel.findOne({ name: "Test" });
        expect(newTeam.tasks.length).toEqual(1);
    });
    test("Create new notification", async () => {
        let team = new teamModel({ _id: "5a8d1cf5208ce33820f193bf", name: "Test", users: [{email: "test@test.com", type: "Admin", accepted: true}]});
        await team.save();
        let notification = {type: "Request", message: "Request", date: "2021-01-09T22:15:46Z"};
        await server.createNewNotification(notification, "5a8d1cf5208ce33820f193bf", "test1@test.com");
        let newTeam = await teamModel.findOne({ name: "Test" });
        setTimeout(() => {
            expect(newTeam.users[0].notifications.length).toEqual(1);
        }, 1000);
    });
})