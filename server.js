const express = require("express");
const connectDB = require("./app/config/db");

const { routes } = require("./app/config/routes");

const app = express();
//Connect to MongoDb
connectDB();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/", routes);

app.listen(port, () => console.log(`Server running on port ${port}`));
