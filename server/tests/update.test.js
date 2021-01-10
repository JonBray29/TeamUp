const mongoose = require('mongoose');
const moment = require('moment');
const credentialModel = require('../model/Credentials');
const teamModel = require('../model/Teams');
const controller = require('../controller');

describe("mongoose update tests", () => {
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

    test("Accept user and update accepted status", async () => {
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
        await controller.acceptUser("5a8d1cf5208ce33820f193bf", "test@test.com", "5a8d1cf5208ce33820f193bc")

        let newTeam = await teamModel.findOne({ name: "Test" });
        let count = newTeam.users.filter(user => user.accepted == true);
        expect(count.length).toEqual(2);
    });
    test("Update event", async () => {
        let start = moment().add(2, "d").format();
        let end = moment().add(3, "d").format();
        let team = new teamModel({ 
            _id: "5a8d1cf5208ce33820f193bf", 
            name: "Test", 
            users: [{email: "test@test.com", type: "Admin", accepted: true}],
            meetings: [{ _id: "5a8d1cf5208ce33820f193bc", title: "Test", start: start, end: end, allDay: false}]
        });
        await team.save();
        let event = { type: "Meeting", id: "5a8d1cf5208ce33820f193bc", title: "Test success", start: start, end: end, allDay: false};
        await controller.updateEvent("5a8d1cf5208ce33820f193bf", event);

        let newTeam = await teamModel.findOne({ name: "Test" });
        expect(newTeam.meetings[0].title).toEqual("Test success");
    });
});