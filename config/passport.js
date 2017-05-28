var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var user = mongoose.model('User');	

passport.use( new localStrategy(
	function(username, password, done) {
			user.findOne({ username: username}, function(err,user){
				if(err){return done(err); }
				if(!user){
					return done(null, false, { message: 'Incorrect Username.'});
				}
				if(!user.validPassword(password)){
					return done(null, false, { message: 'Incorrect Password.'});
			}
			return done(null, user);
			});
	}
));