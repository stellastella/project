'use strict';

var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var User = require('../models/users');
var configAuth = require('./auth');

var userController = require('../controllers/userController.server.js');
var userCtrl = new userController();


module.exports = function (passport) {
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		userCtrl.getUserById(id, function (err, user) {
			done(err, user);
		});
	});


	// Local Strategy
	passport.use(new LocalStrategy(
	  function(username, password, done) {
	    userCtrl.getUserByUsername(username, function (err, user){
	        if(err) throw err;

	        if(!user) {
	            return done(null, false, {message: 'User not found'});
	        }

	        userCtrl.comparePassword(password, user.local.password, 
	        	function (err, isMatch) {
		            if(err) throw err;
		            if(isMatch) {
		                return done(null, user);
		            } else {
		                return done(null, false, { message: 'Invalid password'});
		            }
	        	}
	        );
    	}); 
  }));


	passport.use(new GoogleStrategy({
		clientID: configAuth.googleAuth.clientID,
		clientSecret: configAuth.googleAuth.clientSecret,
		callbackURL: configAuth.googleAuth.callbackURL
	},
	function (token, refreshToken, profile, done) {
		process.nextTick(function () {
			User.findOne({ 'google.id': profile.id }, function (err, user) {
				if (err) {
					return done(err);
				}

				if (user) {
					return done(null, user);
				} else {
					var newUser = new User();

					newUser.google.id = profile.id;
					newUser.google.token = token;
					newUser.google.username = profile.emails[0].value;
					newUser.google.name = profile.displayName;
					newUser.google.email = profile.emails[0].value; // pull the first email
					newUser.isAdmin = false;
					
					var check = User.findOne({});
					if (!check) {
						newUser.isAdmin = true;
					}
					

					newUser.save(function (err) {
						if (err) {
							throw err;
						}

						return done(null, newUser);
					});
				}
			});
		});
	}));
};
