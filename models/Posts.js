var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
	title: String,
	link: String,
	author: String,
	score : {type: Number, default: 0},
	comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}] // Array of comment reference

});

PostSchema.methods.scoreIncrement = function(cb){
	this.score += 1;
	this.save(cb);
}
mongoose.model('Post',PostSchema);