var  mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
	body: String,
	author: String,
	score: {type: Number, default: 0},
	post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post'} // Array of post object
	});

CommentSchema.methods.scoreIncrement = function(cb){
	this.score += 1;
	this.save(cb);
}

mongoose.model('Comment',CommentSchema);