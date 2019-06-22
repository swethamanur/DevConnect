const mongoose = require("mongoose");
const config = require("config");
//const db = config.get("mongoURI");
const db =
  "mongodb+srv://swetha:Swetha92@@cluster0-vqy4q.mongodb.net/test?retryWrites=true&w=majority";

//Using aynch await
const connectDB = async () => {
  try {
    await mongoose.connect(db, { useNewUrlParser: true, useCreateIndex: true });
    console.log("MongoDB connected...");
  } catch (err) {
    console.log(err.message);
    //Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
