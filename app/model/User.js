const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  tokens: [
    {
      token: {
        type: String
      }
    }
  ]
});

//instance methods
userSchema.methods.generateToken = function() {
  let user = this;
  //Create JWT token
  const payload = {
    jwtUser: { id: user.id }
  };

  let token = jwt.sign(payload, "supersecret", { expiresIn: 360000 });

  user.tokens.push({ token });

  return user.save().then(token => {
    return token;
  });
};

const User = mongoose.model("User", userSchema);

module.exports = User;
