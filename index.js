//Initialization.

const express = require("express");
const https = require("https");
const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const multer = require("multer");

//Utilitaires.

const configUtils = require("./utils/configUtils");

//Configuration initiale.
const app = express();
dotenv.config();
configUtils.checkEnvVariables();

const LISTEN_PORT = process.env.LISTEN_PORT ?? 5000;
const HTTPS_LISTEN_PORT = process.env.HTTPS_LISTEN_PORT ?? 5443;
const MONGO_URI = process.env.MONGO_URI;

//Pour la gestion des requêtes application/json
app.use(express.json());
//Pour la gestion des requêtes application/xwww-form-urlencoded
app.use(express.urlencoded({ extended: true }));

//Configuration CORS
app.all("*", function (req, res, next) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  next();
});

//Routage.

app.use("/api/auth", require("./routers/authRouter"));
app.use("/api/posts", require("./routers/postRouter"));
app.use("/api/profiles", require("./routers/profilRouter"));
app.use("/api/users/params", require("./routers/utilisateurParamsRouter"));
app.use("/api/users", require("./routers/utilisateurRouter"));
app.use("/api/messages", require("./routers/messageRouter"));
app.use("/api/follows", require("./routers/followRouter"));

//Execution.

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connexion à la base de donnée établie avec succès.");

    //Lancement connexion non sécurisée.
    app.listen(LISTEN_PORT, () => {
      console.log(
        `Application lancée et à l'écoute sur le port ${LISTEN_PORT}.`
      );
    });

    //Lancement connexion sécurisée.
    https
      .createServer(
        {
          key: fs.readFileSync(process.env.HTTPS_PRIVATE_KEY_FILE),
          cert: fs.readFileSync(process.env.HTTPS_CERTIFICATE_FILE),
        },
        app
      )
      .listen(LISTEN_PORT, () => {
        console.log(
          `(HTTPS) Application lancée et à l'écoute sur le port ${LISTEN_PORT}.`
        );
      });
  })
  .catch((err) => {
    console.log(
      `Erreur lors de la tentative de connection à la base de donnée: ${err}`
    );
  });

//Debug.
const val = require("./validation/validation");
