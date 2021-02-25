const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "fast_fingers",
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response) => response.send("404: Nothing here!"));

// - players
app.post("/apis/players/insert", (request, response) => {
  const { name, email, password } = request.body;

  db.query(
    "INSERT INTO players (name, email, password) VALUES (?, ?, ?)",
    [name, email, password],
    (error, result) => {
      console.log(result);
    }
  );
});

app.listen(3000, () => console.log("Server started on Port 3000"));
