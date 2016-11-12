"use strict";

// - Requires - //
const express = require("express");
const app = express();

const randomize = require("randomatic");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const _ = require("lodash");
const bcrypt = require("bcrypt");

// - global vars - //
const PORT = process.env.PORT || 8080;
const users = {
// user 555555 for testing, to be rem'd
  555555: {
    id: 555555,
    email: "test@test.com",
    password: "$2a$10$0OIWqQZZeYmYAdzkIJBZzelckJcGT69aQqWdPmAAEQ8FIE0ShZG7G",
    urls: {
      "b2xVn2": "http://www.lighthouselabs.ca"
    }
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
  return bcrypt.compareSync(password, object[id].password);
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
const checkForUrlByUser = (id, shortURL, object) => {
  return Object.keys(object[id].urls).indexOf(shortURL) > -1;
};
const findLongUrlGlobal = (shortURL, object) => {
  let longURL = "";
  _.forEach(object, function(key) {
    if (key.urls.hasOwnProperty(shortURL)) {
      longURL = key.urls[shortURL]
    }
  });
  return longURL;
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
        urls: users[userId].urls
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
        urls: users[userId].urls
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
app.get("/password_error", (req, res) => {
  res.render("password_error");
});
app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let userId = req.cookies.username;
  if (userId && checkForUrlByUser(userId, shortURL, users)) {
    let templateVars = {
      username: userId,
      email: findUserEmailById(userId, users),
      urls: users[userId].urls,
      shortURL: req.params.id,
      longURL: users[userId].urls[req.params.id]
    };
    res.render("urls_show", templateVars);
  } else {
    res.render("not_users_url");
  }
});
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = findLongUrlGlobal(shortURL, users);
  switch(true) {
    case (longURL === undefined):
      res.redirect("/");
      break;
    case (longURL.indexOf("http") === -1):
      longURL = "http://" + longURL;
    default:
      res.redirect(longURL);
      break;
  }
});

// - POSTS - //
app.post("/urls", (req, res) => {
  let userId = req.cookies.username;
  let longURL = req.body.longURL;
  let randomStr = generateRandomString();
  users[userId].urls[randomStr] = longURL;
  res.redirect(`/urls/${randomStr}`);
});

app.post("/login", (req, res) => {
  let userId = req.body.username;
  let id = findUserIdByEmail(userId, users);
  let password = req.body.password;
  if (doesEmailExist(userId, users) === false) {
    res.redirect("/uname-error");
  } else if (passwordMatch(id, password, users) === true) {
    res.cookie("username", id);
    res.redirect("/urls");
  } else res.redirect("/password_error");
});
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/");
});
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let hashed_password = bcrypt.hashSync(password, 10);
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
        password: hashed_password,
        urls: {}
      };
      res.cookie("username", id);
      res.redirect("/");
      break;
  }
});
app.post("/urls/:shortURL/delete", (req, res) => {
  let userId = req.cookies.username;
  let shortURL = req.params.shortURL;
  // if (userId && checkForUrlByUser(userId, shortURL, users))
  delete users[userId].urls[shortURL];
  res.redirect("/urls");
});
app.post("/urls/:id", (req, res) => {
  let userId = req.cookies.username;
  let url = req.params.id;
  users[userId].urls[url] = req.body.longURL;
  res.redirect(`/urls/${url}`);
});

// - SERVER LISTENER - //
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

