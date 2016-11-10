"use strict";

// - Requires - //
const express = require("express");
const app = express();

const randomize = require("randomatic");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

// - global vars - //
const PORT = process.env.PORT || 8080;
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// - Engine inits - //
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use("/public", express.static("public"));

// - Init EJS view engine - //
app.set("view engine", "ejs");

// - FUNCTIONS - //
function generateRandomString() {
  return randomize("Aa0", 6);
}

// - GET REDIRECTS - //
app.get("/", (req, res) => {
  res.redirect("/urls");
});
// app.get("/hello", (req, res) => {
//   res.end("<html><body>Hello <b>World</b></body></html>\n");
// });
app.get("/new", (req, res) => {
  res.redirect("/urls/new");
});

// - GET RENDERS - //
app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id] !== undefined) {
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id],
      username: req.cookies["username"]
    };
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/");
  }

});
// FIXME: str.indexOf('http' || 'https') wrapped in if()
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  if (longURL !== undefined) {
    res.redirect(longURL);
  } else {
    res.redirect("/urls");
  }
});

// - POSTS - //
app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let randomStr = generateRandomString();
  urlDatabase[randomStr] = longURL;
  res.redirect(`/urls/${randomStr}`);
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body["username"]);
  res.redirect("/urls");
});
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});
app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`)
});

// - SERVER LISTENER - //
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

