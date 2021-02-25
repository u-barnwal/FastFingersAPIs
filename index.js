const express = require("express");
const mysql = require("mysql");

const app = express();

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "fast_fingers",
});

app.get("/", (req, res) => {});

app.listen(3000, () => console.log("Server started on Port 3000"));
