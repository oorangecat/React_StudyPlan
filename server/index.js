const express = require('express');
const morgan =require("morgan")
const cors = require("cors");
const passport = require('passport');
const LocalStrategy = require('passport-local'); 

const coursesRouter = require('./API/coursesRouter');
const {usersRouter} = require('./API/usersRouter');
const {UsersDAO} = require('./modules/usersDAO');
const usersDAO = new UsersDAO();

const session = require('express-session');


// init express
const app = new express();
const port = 3001;

//needed to allow cookies coming from a different port, as the server is hosted on port 3001
const corsOptions = {
  origin: 'http://localhost:3000', 
  credentials: true,
};

app.use(express.json());    
app.use(morgan("dev"));
app.use(cors(corsOptions));

passport.use(new LocalStrategy(async function verify(username, password, cb) {

  const user = await usersDAO.getUser(username, password).catch((err) => {
    return cb(null, {message: err});
  });
  if(user){
    return cb(null, user);
  }
  else{
    return cb(null, false, 'Incorrect username or password');
  }
}));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) { // received when it authenticates using the cookie. Contains id + name + email
  const exist=usersDAO.checkUser(user.id)
  if(exist)
    return cb(null, user);
  else 
    return cb(null,false)
});

app.use(session({
  secret: "23 38 44.11 N 57 59 13.14 E",  //used to sign the session ID cookie
  resave: false,                          //true=deprecated, saves back the session even if it is not modified
  saveUninitialized: false,               //save the cookie even if the login did not happen. Illegal if you need permissions for saving a cookie
}));
app.use(passport.authenticate('session'));


app.use('/api/', usersRouter);
app.use('/api/courses', coursesRouter);


// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)});


module.exports = app;
