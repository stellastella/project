'use strict';

var path = process.cwd();
var userController = require(path + '/app/controllers/userController.server.js');
var User = require(path + '/app/models/users.js');
var Admin = require(path + '/app/models/admin.js');


module.exports = function (app, passport) {
	var userCtrl = new userController();

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} 

		// otherwise redirect to login
		res.redirect('/login');
	}

	function isLoggedInAsAdmin (req, res, next) {
		if (req.isAuthenticated()) {
			if (req.user.local.isAdmin || req.user.google.isAdmin) {
	        	return next();
	    	}
	    }

    	// otherwise redirect to index
	    req.flash('error_msg', 'Unauthorised access');
	    res.redirect('/');
	}
	


	app.route('/')
		.get(function (req, res) {
			res.render('index', { title:'Clementine.js'});
		});

	app.route('/login')
		.get(function (req, res) {
			res.render('login', { title:'Account Login'});
		})
		.post(passport.authenticate('local',  {successRedirect: '/profile',
                                   failureRedirect: '/login',
                                   failureFlash: true }),
			function(req, res) {
			    // If this function gets called, authentication was successful.
			    // `req.user` contains the authenticated user.
			    req.flash('success_msg', 'You have been successfully logged in');
			    res.redirect('/profile');
			}
		);

	app.route('/register')
		.get(function (req, res) {
			res.render('register', { title:'Register'});
		})
		.post(function (req, res) {
		    var name = req.body.name;
		    var username = req.body.username;
		    var email = req.body.email;
		    var password = req.body.password;

		    // Validation
		    req.checkBody('name', 'Name is required').notEmpty();
		    req.checkBody('email', 'Email is required').notEmpty();
		    req.checkBody('email', 'Email is not valid').isEmail();
		    req.checkBody('username', 'Username is required').notEmpty();
		    req.checkBody('password', 'Password is required').notEmpty();
		    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

		    var errors = req.validationErrors();

		    if (errors) {
		        res.render('register', {
		            errors: errors
		        });
		    } else {
		        var newUser = new User();

		        newUser.local.name = name;
		        newUser.local.username = username;
		        newUser.local.email = email;
		        newUser.local.password = password;
		        newUser.local.isAdmin = false;

		        userCtrl.createUser(newUser, function (err) {
		            if (err) throw err;

		            req.flash('success_msg', 'You are registered and can now login');

		            res.redirect('/login');
		        });
		    }
		});

app.route('/admin-register')
		.get(function (req, res) {
			res.render('register', { title:'Register'});
		})
		.post(function (req, res) {
		    var name = req.body.name;
		    var username = req.body.username;
		    var email = req.body.email;
		    var password = req.body.password;

		    // Validation
		    req.checkBody('name', 'Name is required').notEmpty();
		    req.checkBody('email', 'Email is required').notEmpty();
		    req.checkBody('email', 'Email is not valid').isEmail();
		    req.checkBody('username', 'Username is required').notEmpty();
		    req.checkBody('password', 'Password is required').notEmpty();
		    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

		    var errors = req.validationErrors();

		    if (errors) {
		        res.render('register', {
		            errors: errors
		        });
		    } else {
		        var newUser = new User();

		        newUser.local.name = name;
		        newUser.local.username = username;
		        newUser.local.email = email;
		        newUser.local.password = password;
		        newUser.local.isAdmin = true;

		        userCtrl.createUser(newUser, function (err) {
		            if (err) throw err;

		            req.flash('success_msg', 'You are registered and can now login as Admin');

		            res.redirect('/admin-login');
		        });
		    }
		});

app.route('/admin-logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/admin-login');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/login');
		});

	app.route('/profile')
		.get(isLoggedIn, function (req, res) {
			res.render('profile', {title: 'User Profile', user: req.user });
		});

	app.route('/auth/google')
		.get(passport.authenticate('google', { scope : ['profile', 'email'] }));

	app.route('/auth/google/callback')
		.get(passport.authenticate('google', {
			successRedirect: '/profile',
			failureRedirect: '/login'
		}));

	app.route('/admin')
		.get(isLoggedInAsAdmin, function(req, res) {
			res.render('dashboard', { title: 'Dashboard' });
	});
};
