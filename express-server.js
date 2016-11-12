"use strict";

const express = require("express");
const app = express();
const randomize = require("randomatic");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const PORT = process.env.PORT || 8080;
const users = {
// user 555555 for testing
555555: {
  id: 555555,
  email: "test@test.com",
  // password is "password"
  password: "$2a$10$0OIWqQZZeYmYAdzkIJBZzelckJcGT69aQqWdPmAAEQ8FIE0ShZG7G",
  urls: {
    "b2xVn2": "http://www.lighthouselabs.ca"
  }
}
};
// - Engine inits - //
app.use(cookieSession({
  name: "session",
  keys: ["Hg8mCTKao7", "lhHJBeTM1X", "zLCrHUM3So"],
  maxAge: 24 * 60 * 60 * 1000,
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use("/public", express.static("public"));
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
const checkForUrlByUser = (id, shortURL, object) => {
  return Object.keys(object[id].urls).indexOf(shortURL) > -1;
};
const findLongUrlGlobal = (shortURL, object) => {
  let longURL = "";
  _.forEach(object, function(key) {
    if (key.urls.hasOwnProperty(shortURL)) {
      longURL = key.urls[shortURL];
    }
  });
  return longURL;
};

// - GETs - //
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});
app.get("/new", (req, res) => {
  res.redirect("/urls/new");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  if (userId) {
    let templateVars = {
      username: userId,
      email: users[userId].email,
      urls: users[userId].urls
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});
app.get("/urls/new", (req, res) => {
  let userId = req.session.user_id;
  if (userId) {
    let templateVars = {
      username: userId,
      email: users[userId].email,
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
  res.render("register_uname_used");
});
app.get("/uname_error", (req, res) => {
  res.render("uname_error");
});
app.get("/register/invalid", (req, res) => {
  res.render("register_invalid");
});
app.get("/password_error", (req, res) => {
  res.render("password_error");
});
app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let userId = req.session.user_id;
  if (userId && checkForUrlByUser(userId, shortURL, users)) {
    let templateVars = {
      username: userId,
      email: users[userId].email,
      urls: users[userId].urls,
      shortURL: req.params.id,
      longURL: users[userId].urls[req.params.id]
    };
    res.render("urls_show", templateVars);
  } else {
    res.render("urls_show_error");
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
  let userId = req.session.user_id;
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
    res.redirect("/uname_error");
  } else if (passwordMatch(id, password, users) === true) {
    req.session.user_id = id;
    res.redirect("/urls");
  } else res.redirect("/password_error");
});
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let hashed_password = bcrypt.hashSync(password, 10);
  switch(true) {
    case (req.session.user_id):
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
      req.session.user_id = id;
      res.redirect("/");
      break;
  }
});
app.post("/urls/:shortURL/delete", (req, res) => {
  let userId = req.session.user_id;
  let shortURL = req.params.shortURL;
  if (checkForUrlByUser(userId, shortURL, users) === false) {
    res.redirect("/");
  } else {
    delete users[userId].urls[shortURL];
    res.redirect("/urls");
  }
});
app.post("/urls/:id", (req, res) => {
  let userId = req.session.user_id;
  let url = req.params.id;
  users[userId].urls[url] = req.body.longURL;
  res.redirect(`/urls/${url}`);
});

// - SERVER LISTENER - //
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});