const env = require("dotenv");

if (process.env.NODE_ENV === "development")
  env.config({ path: ".env.development" });
else env.config({ path: ".env.production" });

const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

console.log(process.env);

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const jwt = require("jsonwebtoken");

const CODE = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  UNAUTHENTICATED: 403,
  NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
};

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response) => response.send("404: Nothing here!"));

// - players: Start - //

app.post("/apis/players/profile", authenticateToken, (request, response) => {
  response.status(CODE.SUCCESS).send(request.user);
});

app.post("/apis/players/login", (request, response) => {
  const { email, password } = request.body;

  if (!validateMandatoryParams([email, password])) {
    response.sendStatus(CODE.BAD_REQUEST);
    return;
  }

  db.query(
    "SELECT * FROM players WHERE email=? AND password=?",
    [email, password],
    (error, result) => {
      // ! handing error
      if (error) {
        response.status(CODE.INTERNAL_SERVER_ERROR).send();
        return;
      }

      // ~ no players found, terminate
      if (!result || result.length <= 0) {
        response
          .status(CODE.UNAUTHORIZED)
          .send("Invalid email address or password!");
        return;
      }

      const user = result[0];

      delete user.password;

      const accessToken = jwt.sign(
        // user,
        { ...user },
        process.env.ACCESS_TOKEN_SECRET
      );

      response.status(CODE.SUCCESS).json({ accessToken });
    }
  );
});

app.post("/apis/players/register", (request, response) => {
  const { name, email, password } = request.body;

  if (!validateMandatoryParams([name, email, password])) {
    response.sendStatus(CODE.BAD_REQUEST);
    return;
  }

  // ? is email already used
  db.query("SELECT * FROM players WHERE email=?", [email], (error, result) => {
    // ! handing error
    if (error) {
      response.status(CODE.INTERNAL_SERVER_ERROR).send();
      return;
    }

    // ~ email already used, terminate
    if (result && result.length > 0) {
      response.status(CODE.NOT_ALLOWED).send("Email address already used!");
      return;
    }

    // ^ unique email, continue
    db.query(
      "INSERT INTO players (name, email, password) VALUES (?, ?, ?)",
      [name, email, password],
      (error, result) => {
        // ! handing error
        if (error) {
          response.status(CODE.INTERNAL_SERVER_ERROR).send();
          return;
        }

        response.status(CODE.SUCCESS).send(result);
      }
    );
  });
});

// - players: End - //

// - game_history: End - //

app.post(
  "/apis/game-history/insert",
  authenticateToken,
  (request, response) => {
    const { score, start_level, end_level } = request.body;

    if (!validateMandatoryParams([score, start_level, end_level])) {
      response.sendStatus(CODE.BAD_REQUEST);
      return;
    }

    db.query(
      "INSERT INTO game_history (player_id, score, start_level, end_level) VALUES (?, ?, ?, ?)",
      [request.user.id, score, start_level, end_level],
      (error, result) => {
        // ! handing error
        if (error) {
          response.status(CODE.INTERNAL_SERVER_ERROR).send();
          return;
        }

        response.status(CODE.SUCCESS).send(result);
      }
    );
  }
);

app.post("/apis/game-history/fetch", authenticateToken, (request, response) => {
  db.query(
    "SELECT * FROM game_history WHERE player_id=?",
    [request.user.id],
    (error, result) => {
      // ! handing error
      if (error) {
        response.status(CODE.INTERNAL_SERVER_ERROR).send();
        return;
      }

      response.status(CODE.SUCCESS).send(result);
    }
  );
});

// - game_history: End - //

app.listen(3000 || process.env.port);

// - Utils functions

function authenticateToken(request, response, next) {
  const authHeader = request.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // ~ doesn't have a authToken
  if (token === null)
    return response
      .status(CODE.UNAUTHORIZED)
      .send("Request doesn't have any access token!");

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
    if (error)
      return response
        .status(CODE.UNAUTHENTICATED)
        .send("Request doesn't have valid access token'");

    request.user = user;
    next();
  });
}

function validateMandatoryParams(params = []) {
  for (const param of params) {
    if (!param || param === "") return false;
  }

  return true;
}

function validateOptionalParams(params = []) {
  return true;
}
