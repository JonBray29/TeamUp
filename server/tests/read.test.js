const mongoose = require('mongoose');
const credentialModel = require('../model/Credentials');
const teamModel = require('../model/Teams');
const controller = require('../controller');

describe("mongoose read tests", () => {
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

    test("Find a user in credentials", async () => {
        let credential = new credentialModel({ email: "Test@example.com", password: "Password1", teamId: mongoose.Types.ObjectId()});
        let credential2 = new credentialModel({ email: "Test2@example.com", password: "Password1", teamId: mongoose.Types.ObjectId()});
        await credential.save();
        await credential2.save();
        let user = await controller.findUserInCredentials("Test@example.com");
        expect(user).toBeDefined();
    });
    test("Find team in teams", async () => {
        let team = new teamModel({ _id: "5a8d1cf5208ce33820f193bf", name: "Test", users: [{email: "test@test.com", type: "Admin", accepted: true}]});
        let team2 = new teamModel({ name: "test2" });
        await team.save();
        await team2.save();
        let tempTeam = await controller.findTeam("5a8d1cf5208ce33820f193bf");
        expect(tempTeam).toBeDefined();
        await teamModel.deleteMany();

    });
});