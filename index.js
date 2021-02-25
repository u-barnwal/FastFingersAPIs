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

const CODE = {
  INTERNAL_SERVER_ERROR: 500,
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_ALLOWED: 405,
};

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response) => response.send("404: Nothing here!"));

// - players
app.post("/apis/players/login", (request, response) => {
  const { email, password } = request.body;

  if (!validateMandatoryParams([email, password]))
    response.sendStatus(CODE.BAD_REQUEST);

  db.query(
    "SELECT * FROM players WHERE email=? AND password=?",
    [email, password],
    (error, result) => {
      if (!result || result.length <= 0) response.sendStatus(CODE.UNAUTHORIZED);

      const user = result[0];

      response.status(CODE.SUCCESS).send(result);
    }
  );
});

app.post("/apis/players/register", (request, response) => {
  const { name, email, password } = request.body;

  if (!validateMandatoryParams([name, email, password]))
    response.sendStatus(CODE.BAD_REQUEST);

  // ? is email already used
  db.query("SELECT * FROM players WHERE email=?", [email], (error, result) => {
    if (result && result.length > 0)
      response.status(CODE.NOT_ALLOWED).send("Email address already used!");
    else
      db.query(
        "INSERT INTO players (name, email, password) VALUES (?, ?, ?)",
        [name, email, password],
        (error, result) => {
          if (error) response.status(CODE.INTERNAL_SERVER_ERROR).send();
          else response.status(CODE.SUCCESS).send(result);
        }
      );
  });
});

app.listen(3000);

// - Utils functions

function validateMandatoryParams(params = []) {
  for (const param of params) {
    if (!param || param === "") return false;
  }

  return true;
}

function validateOptionalParams(params = []) {
  return true;
}
