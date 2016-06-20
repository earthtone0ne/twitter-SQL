'use strict';
var express = require('express');
var router = express.Router();
//var tweetBank = require('../tweetBank');
var client = require('../db');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT users.name, tweets.content, tweets.id FROM users INNER JOIN tweets ON users.id=tweets.userid', function(err,data){
      if (err) {console.error(err)}
      // do some error thing
      res.render('index', {
        title: 'Twitter.js',
        tweets: data.rows,
        showForm: true
      });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    var username = req.params.username;

    var tweetsForName = client.query('SELECT users.name, tweets.content, tweets.id FROM users INNER JOIN tweets ON users.id=tweets.userid WHERE users.name = $1', [username], function(err,data){
      if (err) {console.error(err)}// do some error thing
      res.render('index', {
        title: 'Twitter.js',
        tweets: data.rows,
        showForm: true,
        username: username
      });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var tweetId = req.params.id;

    var tweetsWithThatId = client.query('SELECT users.name, tweets.content,tweets.id FROM users INNER JOIN tweets ON users.id=tweets.userid WHERE tweets.id = $1', [tweetId], function(err,data){
      res.render('index', {
        title: 'Twitter.js',
        tweets: data.rows
      });
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    var user = req.body.name;
    var tweet = req.body.content;
    var userId;
    getId();

    function getId(){
      client.query('SELECT id FROM users WHERE name = $1', [user], function (err, data){
        if(err) {console.error(err);}
        if(data.rows.length==0){
          //console.log('adding');
          client.query('INSERT INTO users (name) VALUES ($1)', [user], function(err, data){
            if(err) {console.error(err);}
            getId();
          });
        }
        else {
          userId = data.rows[0].id;
          addNewTweet();
        }
      });
    }

    function addNewTweet(){
      client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [userId, tweet], function(err, data){
        io.sockets.emit('new_tweet', data);
        res.redirect('/');
      });
    }
  });

    /*var newTweet = client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [userId, tweet], function(err, data){
        io.sockets.emit('new_tweet', data);
        res.redirect('/');
      });
    });*/


  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
