// Simple entry point to our site
//
//
// @Author: Ido
// @date: April 2019
//

// init project
var express = require('express');
var app = express();
var assets = require('./assets');

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// https://glitch.com/#!/project/assets-lib
app.use("/assets", assets);

// handle 404s
app.use(function(req, res) {
  res.status(400);
  res.sendFile(__dirname + '/public/404.html');
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('🏈 app is listening on port ' + listener.address().port);
});
