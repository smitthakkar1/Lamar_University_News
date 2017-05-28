var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var counter = 0;

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.post('/register', function(req,res,next){
  if(!req.body.username || !req.body.password){
      return res.status(400).json({message: 'Please fill out all the fields.'});
  }
  var user = new User();
  user.username = req.body.username;
  user.setPassword(req.body.password)
  
  user.save(function(err){
    if(err){return next(err); }
    return  res.json({token: user.generateJWT()}) 
  });
});

router.post('/login', function(req,res,next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all the fiels.'});
  }
  //The passport.authenticate('local') middleware uses the LocalStrategy we created earlier.
  passport.authenticate('local', function(err,user,info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    }
    else{
      return res.json(401).json(info);
    }
  })(req,res,next);    
});

router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err); }
    res.json(posts);
  });
});

/*router.get('/:user', function(req, res, next) {
  user.find(function(err, posts){
    if(err){ return next(err); }
    res.json(user);
  });
});*/

router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  post.author = req.payload.username
  post.save(function(err, post){
    if(err){ return next(err); }
    res.json(post);
  });
});

router.param('user',function(req,res,next,username){
  var query = user.findById(username);

  query.exec(function(err,user){
    if(err) {return next(err);}
    if(!post) {return next(new Error("can't find user")); }
    req.user = user;
    return next();
  });
});

// Preload post objects on routes with ':post'
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});
// Preload comment objects on routes with ':comment'
router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error("can't find comment")); }

    req.comment = comment;
    return next();
  });
});


// return a post
router.get('/posts/:post', function(req, res, next) {
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});


router.put('/posts/:post/score', auth, function(req, res, next) {
  req.post.scoreIncrement(function(err, post){
    if (err) { return next(err); }
    res.json(post);
  });
});


// create a new comment
router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.payload.username
  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.post.comments.push(comment);
    counter++;
    req.post.save(function(err, post) {
      if(err){ return next(err); }
      res.json(comment);
    });
  });
});


router.put('/posts/:post/comments/:comment/score', auth, function(req, res, next) {
  req.comment.scoreIncrement(function(err, comment){
    if (err) { return next(err); }

    res.json(comment);
  });
});



module.exports = router;