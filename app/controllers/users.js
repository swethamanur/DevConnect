const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const User = require("../model/User");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("config");

//Post or Register a new user
router.post(
  "/",
  [
    //name should not be empty
    check("name", "Name is required")
      .not()
      .isEmpty(),
    //password and email should not be empty
    check("email", "Include a valid email").isEmail(),
    check("password", "Password needs to be atleast 6 chars long!").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //Obj destructuring: User inputs
    const { name, email, password } = req.body;
    console.log(req.body);

    try {
      //Check if the user exists
      let user = await User.findOne({ email });

      if (user) {
        console.log("inside if");
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }
      user = {};

      //Create user gravatar
      const avatar = gravatar.url(email, { s: "200", r: "pg", d: "mm" });

      //Encrypt password
      bcrypt.genSalt(10).then(salt => {
        bcrypt.hash(password, salt).then(hashedPassword => {
          user.password = hashedPassword;
        });
      });

      //Save the new user
      user = new User({
        name,
        email,
        password,
        avatar
      });

      user
        .save()
        .then(user => {
          return user.generateToken();
        })
        .then(token => {
          console.log(token, "entered ");
          res.header("x-auth-token", token).send("User registered");
        })
        .catch(err => {
          res.send(err);
        });
      res.json(user);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error here");
    }
  }
);

module.exports = {
  usersController: router
};
