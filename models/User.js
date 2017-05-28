var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');	

var userSchema = new mongoose.Schema({
	username : {type: String, unique: true, lowercase: true},
	// A mathematical operation that’s easy to perform, but very difficult to reverse.
	hash: String,
	// In cryptography,a salt is random data that is used as an additional input to a one-way function that "hashes" a password or passphrase.
	salt: String 
	});
//PBKDF2 (Password-Based Key Derivation Function 2) is part of RSA Laboratories' Public-Key Cryptography Standards (PKCS) series.
//PBKDF2 applies a pseudorandom function, such as hash-based message authentication code (HMAC), to the input password or passphrase along with 
//a salt value and repeats the process many times to produce a derived key, which can then be used as a cryptographic key in subsequent operations

userSchema.methods.setPassword = function(password){
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};
/*DK = PBKDF2(Password, Salt, c, dkLen)
where:

Password is the master password from which a derived key is generated
Salt is a sequence of bits, known as a cryptographic salt
c is the number of iterations desired
dkLen is the desired length of the derived key
DK is the generated derived key*/


//Create a validPassword() method that accepts a password and 
//compares it to the hash stored, returning a boolea
userSchema.methods.validPassword = function(password){
	var hash = crypto.pbkdf2Sync(password,this.salt,1000,64).toString('hex');
	return this.hash === hash;	
};

userSchema.methods.generateJWT	= function(){
var today = new Date();
var exp = new Date(today);
exp.setDate(today.getDate() + 60);

// The The first argument of the jwt.sign() method is the payload that gets signed. Both the server and 
//client will have access to the payload.The exp value in the payload is a Unix timestamp in seconds that 
//will specify when the token expires.The second argument of jwt.sign() is the secret used to sign our tokens.
//it is strongly recommended that you use an environment variable.for referencing the secret and keep it 
//out of your codebase.
return jwt.sign({ 				
	_id: this._id,						
	username: this.username,			
	exp: parseInt(exp.getTime() / 1000), 
}, 'SECRET');
};

mongoose.model('User',userSchema);
