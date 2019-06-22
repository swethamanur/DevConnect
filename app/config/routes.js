const express = require("express");
const router = express.Router();

const { usersController } = require("../controllers/users.js");
const { profilesController } = require("../controllers/profiles");
const { postsController } = require("../controllers/posts");
const { authController } = require("../controllers/auth");

router.use("/profiles", profilesController);
router.use("/posts", postsController);
router.use("/users", usersController);
router.use("/auth", authController);

module.exports = {
  routes: router
};
