var User = require('../models/users');
var bcrypt = require('bcryptjs');

function userController () {
    this.createUser = function (newUser, callback) {
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(newUser.local.password, salt, function(err, hash) {
                newUser.local.password = hash;
                newUser.save(callback);
            });
        });
    };

    this.getUserByUsername = function (username, callback) {
        var query = {"local.username": username};
        User.findOne(query, callback);
    };

    this.getUserById = function (id, callback) {
        User.findById(id, callback);
    };

    this.comparePassword = function (candidatePassword, hash, callback) {
        bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
            if (err) throw err;
            callback(null, isMatch);
        })
    };
    
}

module.exports = userController;
