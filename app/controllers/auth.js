const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator/check");

const auth = require("../middlewares/auth");
const User = require("../model/User");

//GET Auth request
router.get("/", auth, async (req, res) => {
  try {
    //After getting the req from auth middleware, get the user
    let user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ msg: "Server error" });
  }
});

//Login user

router.post(
  "/",
  [
    //password and email should not be empty
    check("email", "Include a valid email").exists(),
    check("password", "Enter password").exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //Obj destructuring: User inputs
    const { email, password } = req.body;
    console.log(req.body);

    try {
      //Check if the user exists
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      //check input password
      bcrypt.genSalt(10).then(salt => {
        bcrypt.hash(password, salt).then(hashed => {
          password = hashed;
        });
      });
      console.log("password", password);
      const isMatch = bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      user
        .save()
        .then(user => {
          return user.generateToken();
        })
        .then(token => {
          console.log(token, "entered ");
          return res.header("x-auth-token", token).send("User registered");
        })
        .catch(err => {
          res.send(err);
        });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error here");
    }
  }
);

module.exports = {
  authController: router
};
