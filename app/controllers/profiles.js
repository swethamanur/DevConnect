const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const request = require("request");

const auth = require("../middlewares/auth");
const Profile = require("../model/Profile");
const User = require("../model/User");

const githubClientId = "d1170a69fda3a5193b0e";
const githubClientSecret = "3bd64a14b396ffef720473465b7b58733b3fa4b5";
//Get the current user profile
router.get("/me", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );
    if (!profile) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Profile does not exist for this user!" }] });
    }
    res.json(profile);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//Create or update a profile of a user
router.post(
  "/",
  [
    auth,
    check("status", "Status is required")
      .not()
      .isEmpty(),
    check("skills", "skills are required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //Once the user sends input for profile

    const {
      status,
      skills,
      company,
      location,
      website,
      bio,
      githubusername,
      twitter,
      facebook,
      youtube,
      linkedIn,
      instagram
    } = req.body;

    //Build the profile object
    const profileFields = {};

    profileFields.user = req.user.id;
    if (status) profileFields.status = status;
    if (skills)
      profileFields.skills = skills.split(",").map(skill => skill.trim());
    if (company) profileFields.company = company;
    if (location) profileFields.location = location;
    if (website) profileFields.website = website;
    if (bio) profileFields.bio = bio;
    if (githubusername) profileFields.githubusername = githubusername;

    //Build social object
    profileFields.social = {};
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (youtube) profileFields.social.youtube = youtube;
    if (linkedIn) profileFields.social.linkedIn = linkedIn;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      //req.user is the one that comes after genearting the token
      let profile = await Profile.findOne({ user: req.user.id });

      //Update an existing profile
      if (profile) {
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      profile = new Profile(profileFields);
      //Create a new profile
      await profile.save();
      return res.json(profile);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server error");
    }
  }
);

//Get all profiles
router.get("/", async (req, res) => {
  try {
    let profiles = await Profile.find().populate("user", ["name", "avatar"]);

    if (profiles.length == 0) {
      res.status(400).json({
        errors: [{ msg: "No profiles exist currently! Create one now" }]
      });
    }
    res.json(profiles);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//Get profile by user id
router.get("/users/:user_id", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.params.user_id }).populate(
      "user",
      ["name", "avatar"]
    );
    if (!profile) {
      res.status(400).json({
        errors: [{ msg: "Profile does not exist" }]
      });
    }

    res.json(profile);
  } catch (error) {
    console.log(error.message);
    //To validate the user_id
    if (error.kind == "ObjectId") {
      res.status(400).json({
        errors: [{ msg: "Profile does not exist" }]
      });
    }
    res.status(500).send("Server error");
  }
});

//Delete an user's profile and the user
router.delete("/", auth, async (req, res) => {
  try {
    //Delete the profile
    await Profile.findOneAndDelete({ user: req.user.id });
    //Delete the user
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: "User and Profile deleted successfully!" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//Update user's profile by adding or updating experinces
router.put(
  "/experience",
  [
    auth,
    check("title", "Title is required")
      .not()
      .isEmpty(),
    check("company", "Company is required")
      .not()
      .isEmpty(),
    check("from", "From date is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(400).json({ msg: "This profile does not exist!" });
      }
      console.log(req.user.name);
      console.log(profile);

      //Obj destructuring
      let {
        title,
        location,
        from,
        to,
        company,
        description,
        current
      } = req.body;

      let newExp = { title, location, from, to, company, description, current };

      profile.experience.unshift(newExp);
      await profile.save();
      res.json({ msg: "Experince added succesfully!" }, profile);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server error");
    }
  }
);

//Update a user's exp

router.put("/experience/:exp_id", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    console.log(profile);
    //Get exp id from the profile
    let expId = profile.experience.find(item => {
      return item.id === req.params.exp_id;
    });
    console.log(expId);

    //Update that exp
    profile.experience[indexOf(expId)] = req.body;

    await profile.save();
    res.json({ msg: "User exp updated succesfully!" });
  } catch (error) {
    if (error.kind == "ObjectId") {
      res.status(400).json({
        errors: [{ msg: "Exp id does not exist" }]
      });
    }
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//Delete a user's experinec
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    //Get exp id from the profile
    let expId = profile.experience.find(item => {
      return item.id === req.params.exp_id;
    });
    console.log(expId);

    // let expId = profile.experience
    //   .map(item => item.id)
    //   .indexOf(req.params.exp_id);

    //Remove that exp
    profile.experience.splice(profile.experience.indexOf(expId), 1);
    await profile.save();
    res.json({ msg: "User exp deleted succesfully!" });
  } catch (error) {
    if (error.kind == "ObjectId") {
      res.status(400).json({ errors: [{ msg: "Exp id does not exists!" }] });
    }
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//Update user's profile by adding or updating education
router.put(
  "/education",
  [
    auth,
    check("school", "School is required")
      .not()
      .isEmpty(),
    check("degree", "Degree is required")
      .not()
      .isEmpty(),
    check("from", "From date is required")
      .not()
      .isEmpty(),
    check("fieldofstudy", "Field of study is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(400).json({ msg: "This profile does not exist!" });
      }

      //Obj destructuring
      let {
        school,
        degree,
        from,
        to,
        fieldofstudy,
        description,
        current
      } = req.body;

      let newEdu = {
        school,
        degree,
        from,
        to,
        fieldofstudy,
        description,
        current
      };

      profile.education.unshift(newEdu);
      await profile.save();
      res.json({ msg: "Education added succesfully!" });
      res.json(profile);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server error");
    }
  }
);

//Update a user's exp

// router.put("/experience/:exp_id", auth, async (req, res) => {
//   try {
//     let profile = await Profile.findOne({ user: req.user.id });

//     console.log(profile);
//     //Get exp id from the profile
//     let expId = profile.experience.find(item => {
//       return item.id === req.params.exp_id;
//     });
//     console.log(expId);

//     //Update that exp
//     profile.experience[indexOf(expId)] = req.body;

//     await profile.save();
//     res.json({ msg: "User exp updated succesfully!" });
//   } catch (error) {
//     if (error.kind == "ObjectId") {
//       res.status(400).json({
//         errors: [{ msg: "Exp id does not exist" }]
//       });
//     }
//     console.log(error.message);
//     res.status(500).send("Server error");
//   }
// });

//Delete a user's education
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    //Get exp id from the profile
    let eduId = profile.education.find(item => {
      return item.id === req.params.edu_id;
    });

    //Remove that exp
    profile.education.splice(profile.education.indexOf(eduId), 1);
    await profile.save();
    res.json({ msg: "User education deleted succesfully!" });
  } catch (error) {
    if (error.kind == "ObjectId") {
      res
        .status(400)
        .json({ errors: [{ msg: "Education id does not exists!" }] });
    }
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//get the github repos of a user
router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sorted=created:asc&client_id:${githubClientId}&client_secret=${githubClientSecret}`,
      method: "GET",
      headers: { "user-agent": "node.js" }
    };

    request(options, function(error, response, body) {
      if (error) console.log(error);

      if (response.statusCode !== 200)
        return res
          .status(400)
          .json({ msg: "No Github repositories found for the user" });

      //Sending the github response
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

module.exports = {
  profilesController: router
};
