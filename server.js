const express = require("express");
const bodyParser = require("body-parser");
const marked = require("marked");
const morgan = require("morgan");
const fs = require("fs");
const randomString = require('randomstring');
var tokens = {
  "Keep me a secret": "toby",
  "TwJ3X2nhGG2MWqxkXv8doq1rzjJo4qDI": "larry"
};
// auth token - you would normally generate a random one
// const token = 'Keep me a secret';

const app = express();
// Use body-parser
app.use(bodyParser.json());

// Simple app that will log all requests in the Apache combined format to the file access.log.
// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'});

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));

// view engine to use (will render the webpages)
app.set("view engine", "hbs");

// Express middleware that will console.log the request method and request path of all requests before delegating back to the regular route handler
app.use(function middlewareConsole(request, response, next) {
  // prints the request method and path
  console.log(request.method, request.path);
  next();
});

function auth(request, response, next) {
  // show tokens that are in the tokens dictionary
  console.log("Here are some tokens: ", tokens);
  // verify the authentication token
  if (request.query.token in tokens) {
    next();
  } else {
    response.status(401);
    response.json({
      error: "You are not logged in... lol"
    });
  }
}

app.post('/login', function(request, response) {
  var username = request.body.username;
  var password = request.body.password;
  // verify the login
  if (username === "larry" && password === "open" ||
      username === "toby" && password === "opensesame") {
    // return the auth token that is generated randomly
    var token = randomString.generate();
  // we are also using a hardcoded token, see above
    tokens[token] = username;
    response.json({
      username: username,
      token: token
    });
  } else {
    response.status(401);
    response.json({
      error: 'Login failed'
    });
  }
});

// All routes underneath this line will be "forced" to use the auth function
// Login doesn't need to use the auth function and that's why it's above this line
app.use(auth);

// Sending a PUT request to the /documents/:filename URL will cause it to be saved in the data subdirectory within your application.
app.put("/documents/:filename", function(request, response) {
  let filepath = "./data/" + request.params.filename;
  let contents = request.body.contents;
  console.log(contents);
  fs.writeFile(filepath, contents, function(error) {
    if (error) {
      request.status(500);
      response.json({
        message: "Couldn't save the file because: " + err.message
      });
    } else {
      response.json({
        message: "File " + filepath + " saved."
      });
    }
  });
});

// Sending a GET request to the /documents/:filename URL will return a JSON object containing the title and contents properties
app.get("/documents/:filename", function(request, response) {
  let filename = request.params.filename;
  fs.readFile("./data/" + filename, function(error, contents) {
    if (error) {
      response.status(500);
      response.json({
        message: "Couldn't read file because: " + error.message
      });
    } else {
      response.json({
        filename: filename,
        contents: contents.toString()
      });
    }
  });
});

// Sending a GET request to the /documents/:filename/display URL will render an HTML web page containing the result of the markdown page converted into HTML
app.get("/documents/:filename/display", function(request, response) {
  let filename = request.params.filename;
  fs.readFile("./data/" + filename, function(error, contents) {
    if (error) {
      response.status(500);
      response.json({
        message: "Couldn't read the file because: " + error.message
      });
    } else {
      fileContent = contents.toString();
      fileContent = marked(fileContent);
      console.log(fileContent);
      response.render("display.hbs", {
        title: filename,
        contents: fileContent
      });
    }
  });
});

// ending a GET request to the /documents URL will return an array containing the file paths of the documents that exist (any file in the data subdirectory)
app.get("/documents", function(request, response) {
  let filepath = "./data/";
  fs.readdir(filepath, function(error, files) {
    response.json({
      files: files
    });
  });
});

// Sending a DELETE request to the /documents/:filename API will remove the corresponding file from the filesystem.
app.delete('/documents/:filename', function(request, response) {
  var filename = request.params.filename;
  fs.unlink('./data/' + filename, function(err) {
    if (err) {
      response.status(500);
      response.json({ error: err.message });
    } else {
      response.json({ status: 'ok' });
    }
  });
});




app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
