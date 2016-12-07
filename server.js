const express = require("express");
const bodyParser = require("body-parser");
const marked = require("marked")
const fs = require("fs");

const app = express();
app.use(bodyParser.json());
// Express middleware that will console.log the request method and request path of all requests that call it before delegating back to the regular route handler
function middlewareConsole(request, response, next) {
  // prints the request method and path
  console.log("Request method: ", request.method);
  console.log("Request path: ", request.path);
  next();
}

app.set("view engine", "hbs");

app.put("/documents/:filename", middlewareConsole, function(request, response) {
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

app.get("/documents/:filename", middlewareConsole, function(request, response) {
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

app.get("/documents/:filename/display", middlewareConsole, function(request, response) {
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

app.get("/documents", middlewareConsole, function(request, response) {
  let filepath = "./data/";
  fs.readdir(filepath, function(error, files) {
    response.json({
      files: files
    });
  });
});

app.delete('/documents/:filename', middlewareConsole, function(request, response) {
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
