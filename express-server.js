"use strict";

// - Requires - //
const express = require("express");
const app = express();

const randomize = require("randomatic");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const _ = require("lodash");
// const bcrypt = require("bcrypt");

// - global vars - //
const PORT = process.env.PORT || 8080;
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const users = {
  555555: {
        id: 555555,
        email: "test@test.com",
        password: "password"
      }
};

// - Engine inits - //
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use("/public", express.static("public"));

// - Init EJS view engine - //
app.set("view engine", "ejs");

// - FUNCTIONS - //
const generateRandomString = () => {
  return randomize("Aa0", 6);
};
const passwordMatch = (id, password, object) => {
  return (object[id].password === password);
};
const doesEmailExist = (email, object) => {
  let found = [];
  _.forEach(object, function(userId) {
    if (userId.email === email) {
      found.push(userId.email);
    }
  });
  return (found.length > 0);
};
const findUserIdByEmail = (email, object) => {
  let id = "";
  _.forEach(object, function(user) {
    if (user.email === email) {
      id = user.id;
    }
  });
  return id;
};
const findUserEmailById = (id, object) => {
  return object[id].email;
};

// - GET REDIRECTS - //
app.get("/", (req, res) => {
  if (req.cookies.username) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});
app.get("/new", (req, res) => {
  res.redirect("/urls/new");
});

// - GET RENDERS - //
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/urls", (req, res) => {
  let userId = req.cookies.username;
  if (userId) {
    let templateVars = {
        username: userId,
        email: findUserEmailById(userId, users),
        urls: urlDatabase
      };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/new", (req, res) => {
  let userId = req.cookies.username;
  if (userId) {
    let templateVars = {
        username: userId,
        email: findUserEmailById(userId, users),
        urls: urlDatabase
      };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/register/error", (req, res) => {
  res.render("register-uname-used");
});
app.get("/uname-error", (req, res) => {
  res.render("uname-error");
});
app.get("/register/invalid", (req, res) => {
  res.render("register-invalid");
});
app.get("/password-error", (req, res) => {
  res.render("password-error");
});
app.get("/urls/:id", (req, res) => {
  let userId = req.cookies.username;
  if (userId) {
    let templateVars = {
      username: userId,
      email: findUserEmailById(userId, users),
      urls: urlDatabase,
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id]
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
  let username = req.body.username;
  let id = findUserIdByEmail(username, users);
  let password = req.body.password;
  if (doesEmailExist(username, users) === false) {
    res.redirect("/uname-error");
  } else if (passwordMatch(id, password, users) === true) {
    res.cookie("username", id);
    res.redirect("/urls");
  } else res.redirect("/password-error");
});
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/");
});
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  switch(true) {
    case (req.cookies.username):
      res.redirect("/urls");
      break;
    case (email.length < 6 || password.length < 8):
      res.redirect("/register/invalid");
      break;
    case (doesEmailExist(email, users) === true):
      res.redirect("register/error");
      break;
    default:
      let id = generateRandomString();
      users[id] = {
        id: id,
        email: email,
        password: req.body.password
      };
      res.cookie("username", id);
      res.redirect("/");
      break;
  }
});
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});
app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

// - SERVER LISTENER - //
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

