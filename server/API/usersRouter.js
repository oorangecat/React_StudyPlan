'use strict';

const express = require('express');
const passport = require('passport');
const { UsersDAO } = require('../modules/usersDAO');
const userDao=new UsersDAO();

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  } else 
    return authFailure(res);
}

const authFailure=(res)=>{ return res.status(401).json({error: 'Not authorized'}); }

var usersRouter = express.Router();

usersRouter.post('/login', passport.authenticate('local'), (req, res) => {
  return res.status(201).json(req.user);
});

usersRouter.get('/sessions/current', async (req, res) => {
  if(req.isAuthenticated()) {
    req.user.planType=await userDao.getUserPlanType(req.user.id);   //updates planType in case of refresh on browser
    res.json(req.user);
  } else{
    res.status(401).json({error: 'Not authenticated'});
  }
});


usersRouter.post('/logout', (req, res) => {
  req.logout(() => {
    res.end();
  });
});



module.exports = {usersRouter, isLoggedIn, authFailure};