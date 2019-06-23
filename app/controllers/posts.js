const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");

const User = require("../model/User");
const Profile = require("../model/Profile");
const Post = require("../model/Post");
const auth = require("../middlewares/auth");

//@route: POST /posts
//@desc : Create a new post
//@access: Private
router.post(
  "/",
  [
    auth,
    check("text", "text is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      //find the user without the password details - security feature
      let user = await User.findById(req.user.id).select("-password");

      let newPost = new Post({
        text: req.body.text,
        user: req.user.id,
        name: user.name,
        avatar: user.avatar
      });

      await newPost.save();

      res.json(newPost);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server error");
    }
  }
);

//@route: GET /posts
//@desc : Get all posts
//@access: Private
router.get("/", auth, async (req, res) => {
  try {
    let posts = await Post.find();
    if (posts.length == 0) {
      return res.status(400).json({ errors: [{ msg: "No posts so far!" }] });
    }
    res.json(posts);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//@route: GET /posts/:id
//@desc : Get a posts
//@access: Private
router.get("/:post_id", auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.post_id);
    if (!post) {
      return res
        .status(400)
        .json({ errors: [{ msg: "No such post exists!" }] });
    }
    res.json(post);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ errors: [{ msg: "No such post exists!" }] });
    }
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//@route: DELETE /posts/:id
//@desc : Delete a posts
//@access: Private
router.delete("/:post_id", auth, async (req, res) => {
  try {
    let post = await Post.findOneAndDelete({ _id: req.params.post_id });
    if (!post) {
      return res
        .status(400)
        .json({ errors: [{ msg: "No such post exists!" }] });
    }
    await res.json(post);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ errors: [{ msg: "No such post exists!" }] });
    }
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//@route: PUT /posts/likes/:post_id
//@desc : Create a like for the post
//@access: Private
router.put("/likes/:post_id", auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.post_id);
    if (!post) {
      return res
        .status(400)
        .json({ errors: [{ msg: "No such post exists!" }] });
    }
    const likes = post.likes.filter(
      like => like.user.toString() === req.user.id
    );
    console.log(likes.length);
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ errors: [{ msg: "Post already liked" }] });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ errors: [{ msg: "No such post exists!" }] });
    }
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//@route: PUT /posts/unlikes/:post_id
//@desc : Unlike a post
//@access: Private
router.put("/unlikes/:post_id", auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.post_id);
    if (!post) {
      return res
        .status(400)
        .json({ errors: [{ msg: "No such post exists!" }] });
    }

    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ==
      0
    ) {
      return res.status(400).json({ errors: [{ msg: "Post not yet liked!" }] });
    }

    //Find the like id to be removed
    const remove = post.likes.find(like => like.user === req.user.id);

    post.likes.splice(post.likes.indexOf(remove), 1);

    await post.save();
    res.json(post);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ errors: [{ msg: "No such post exists!" }] });
    }
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//@route: PUT /posts/comment/:post_id/
//@desc : Comment for a post
//@access: Private

router.put(
  "/comment/:post_id/",
  [
    auth,
    check("text", "text is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    try {
      let user = await User.findById(req.user.id).select("-password");
      let post = await Post.findById(req.params.post_id);

      //Check if post exists
      if (!post) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Post does not exist!" }] });
      }

      //Create comment
      let newComment = {
        text: req.body.text,
        user: user.id,
        avatar: user.avatar,
        name: user.name
      };

      post.comments.unshift(newComment);

      await post.save();
      res.json(post);
    } catch (error) {
      console.log(error.message);
      req.status(500).send("Server error");
    }
  }
);

//@route: DELETE /posts/comment/:post_id/:comment_id
//@desc : Delete a comment for a post
//@access: Private

router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select("-password");

    let post = await Post.findById(req.params.post_id);

    //Check if post exists
    if (!post) {
      return res
        .status(404)
        .json({ errors: [{ msg: "Post does not exist!" }] });
    }

    //Find the comment
    let delComment = "";
    post.comments.forEach(comment => {
      if (comment.id === req.params.comment_id) delComment = comment;
    });
    console.log(delComment.name);
    if (!delComment) {
      return res
        .status(404)
        .json({ errors: [{ msg: "Comment does not exist" }] });
    }

    //Check if user is authorized

    if (String(delComment.user) === req.user.id) {
      post.comments.splice(post.comments.indexOf(delComment), 1);
    } else {
      return res
        .status(401)
        .json({ errors: [{ msg: "User not authorized!" }] });
    }

    await post.save();
    res.json(post);
  } catch (error) {
    console.log(error.message);
    req.status(500).send("Server error");
  }
});

module.exports = {
  postsController: router
};
