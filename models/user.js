const mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

UserSchema.plugin(passportLocalMongoose); // add in methods of Auth
module.exports = mongoose.model("User", UserSchema); // name of the collection, mongodb will re-name it to users