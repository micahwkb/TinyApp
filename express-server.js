"use strict";

const express = require("express");

const app = express();
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const PORT = process.env.PORT || 8080;


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let randomString = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( let i=0; i < 6; i++ ) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomString;
}

app.get("/", (req, res) => {
  res.redirect("/urls");
});
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});
app.get("/urls", (req, res) => {
  let urlVars = { urls: urlDatabase };
  res.render("urls_index", urlVars);
});
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
// below would catch /new if not placed below

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let dbEntry = urlDatabase[shortURL];
  if (urlDatabase[shortURL] !== undefined) {
    res.redirect(dbEntry);
  } else {
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  // if longURL doesn't preface with http:// or https://
  // longURL = `http://${longURL}`
  let randomStr = generateRandomString();
  urlDatabase[randomStr] = longURL;
  res.redirect(`/urls/${randomStr}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

