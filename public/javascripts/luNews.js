var app = angular.module('lamar', ['ui.router']);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider){
		$stateProvider.state(
			'home',{
				url: '/home',
				templateUrl: '/home.html',
				controller: 'MainCtrl',
////We add a resolve property to each route we want to resolve data before Controller instantiation:				
				resolve: {									

				    promise: ['posts', function(posts){
				      return posts.getAll();
				    }]
				  }
			})
			.state('posts', {
		      url: '/posts/{id}',
		      templateUrl: '/posts.html',
		      controller: 'PostsCtrl',
		      resolve: {
		        post: ['$stateParams', 'posts', function($stateParams, posts) {
		          return posts.get($stateParams.id);
        }]
			      }	
		})
// onEnter gives us the ability to detect if the user is authenticated before entering the state, 
// which allows us to redirect them back to the home state if they're already logged in.
			.state('login',{
				url: '/login',
				templateUrl: '/login.html',
				controller: 'authCtrl',
				onEnter: ['$state', 'auth', function($state, auth){
					if(auth.isLoggedIn()){
						$state.go('home');
					}
				}]
			})

			.state('register',{
				url:'/register',
				templateUrl: '/register.html',
				controller: 'authCtrl',
				onEnter: [ '$state','auth',function($state,auth){
					if(auth.isLoggedIn()){
						$state.go('home');
					}
				}]
			});

	/*		.state('profile',{
				url:'/{{post.author}}',
				templateUrl: '/profile.html',
				controller: 'profileCtrl',
				resolve: {
		        post: ['$stateParams', 'posts', function($stateParams, posts) {
		          return posts.getprofile($stateParams.post.author);
        }]
			}	
			})*/

		$urlRouterProvider.otherwise('home');
	}
	]);
////FACTORY/SERVICE/PROVIDER USED TO REUSE THE CODE. SERVICE USE .THIS AND PROVIDER USE .GET METHOD.
app.factory('posts',['$http','auth',function($http,auth){				
	var o = { 
		posts : []
};
//use of "then" instead of "success" because then assures response.

	o.get = function(id){
		return $http.get('/posts/'+id).then(function(res){
			return res.data;                                
		});
	};

    o.getAll = function() {
	    return $http.get('/posts').success(function(data){
	    angular.copy(data,o.posts);
	});
  };
  o.incrscore = function(post){
  	return $http.put('/posts/'+post._id+'/score', null, { 
  		headers: { Authorization : 'Bearer '+ auth.getToken()}
  	}).success(function(data){
  		post.score ++; 	
  	});
  };

  o.decrementScore = function(post){
  	return $http.put('/posts/'+post._id+'/score', null, { 
  		headers: { Authorization : 'Bearer '+ auth.getToken()}
  	}).success(function(data){
  		if(post.score >= 1){
  		post.score --; 	}
  	});
  };

	o.createe = function(post) {
	  return $http.post('/posts', post, {
	  	headers: {Authorization: 'Bearer '+ auth.getToken()}
	  }).success(function(data){
	    o.posts.push(data);
	  });
	};
	o.commentAdd = function(id, comment) {
	  return $http.post('/posts/' + id + '/comments', comment,{
	  	headers: {Authorization: 'Bearer ' + auth.getToken()}
	  });
	};
	o.scoreComment = function(post, comment) {
  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/score',null, {
  	    headers: {Authorization: 'Bearer '+auth.getToken()}
  })
    .success(function(data){
      comment.score ++;
    });
};
	return o;
}]);
//The Web Storage API extends the Window object with two new properties — Window.sessionStorage and 
//Window.localStorage which provide access to the current domain's session and local Storage objects 
app.factory('auth', ['$http', '$window', function($http,$window){
	var auth ={};

//localStorage maintains a separate storage area for each given origin that's available for the duration of 
//the page session and it persists even when the browser is closed and reopened. sessionStorage 
	auth.saveToken = function(token){
		$window.localStorage['lamar-news-token'] = token;
	},

	auth.getToken = function(){
		return $window.localStorage['lamar-news-token'];
	},

	auth.isLoggedIn = function(){
		var token = auth.getToken();
		if(token){
		//The atob() method decodes a base-64 encoded string. 
		//The atob() method decodes a string of data which has been encoded by the btoa() method
		var payload = JSON.parse($window.atob(token.split('.')[1]));
		return payload.exp > Date.now()/1000;
		}
		else{
			return false;
		}
	},

	auth.currentUser = function(){
		if(auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return 	payload.username;
			}
	},

	auth.register = function(user){
		return $http.post('/register',user).success(function(data){
			auth.saveToken(data.token);
		});

	},
	auth.login = function(user){
	return $http.post('/login',user).success(function(data){
		auth.saveToken(data.token);
	});

	},
	auth.logOut = function(){
  $window.localStorage.removeItem('lamar-news-token');
}

	return auth;
	}]);


app.controller('MainCtrl', [
'$scope', 'posts', 'auth',
function($scope,posts, auth){
  $scope.posts = posts.posts;
  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.addPost = function(){
  posts.createe({
      title: $scope.title,
      link: $scope.link,
    });
    $scope.title = '';
    $scope.link = '';
  };

  $scope.incrementScore = function(post){
  	posts.incrscore(post);
  };

  $scope.decrementScore = function(post){
  	posts.decrementScore(post);
  };
}]);

app.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
function($scope, posts, post, auth){
  $scope.post = post;
  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.addComment = function(){
    if($scope.body === '') { return; }
    posts.commentAdd(post._id, {
      body: $scope.body,
      author: 'user',
    }).success(function(comment) {
      $scope.post.comments.push(comment);
    });
    $scope.body = '';
  };
  $scope.counter = o.counter;
  $scope.incrementScore = function(comment){
    posts.scoreComment(post, comment);
  };
}]);
app.controller('authCtrl',[
	'$scope', 
	'$state', 
	'auth', 
	function($scope, $state, auth){
	$scope.user = {};
	
	$scope.register = function(){
		auth.register($scope.user).error(function(error){
			$scope.error = error;
		}).then(function(){
			$state.go('home');
		});
	};

	$scope.login = function(){
		auth.login($scope.user).error(function(error){
			$scope.error = error;
		}).then(function(){
			$state.go('home');
		});
	};

}]);

app.controller('NavCtrl',[
	'$scope', 'auth',
	function($scope,auth){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;
	}]);