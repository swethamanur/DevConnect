const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
  let token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied!" });
  }

  //verify the token
  try {
    const decoded = jwt.verify(token, "supersecret");
    //the decoded obj has the user as a key
    req.user = decoded.jwtUser;

    //res.send("Auth route!");
  } catch (error) {
    console.log(error.message);
    res.status(400).send("Invalid token");
  }

  next();
};
