const mongoose = require('mongoose');
const { ObjectId } = require('bson');
const bcrypt = require('bcrypt');
const saltRounds = 10;


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

module.exports = mongoose.model("Credentials", credentialSchema);