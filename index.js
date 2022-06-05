//Initialization.

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

//Utilitaires.

const configUtils = require("./utils/configUtils");

//Configuration initiale.

const app = express();
dotenv.config();
configUtils.checkEnvVariables();

const LISTEN_PORT = process.env.LISTEN_PORT ?? 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routage.

app.use("/api/auth", require("./routers/authRouter"));
app.use("/api/users/params", require("./routers/utilisateurParamsRouter"));
app.use("/api/users", require("./routers/utilisateurRouter"));

//Execution.

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connection à la base de donnée établie avec succès.");

    app.listen(LISTEN_PORT, () => {
      console.log(
        `Application lancée et à l'écoute sur le port ${LISTEN_PORT}.`
      );
    });
  })
  .catch((err) => {
    console.log(
      `Erreur lors de la tentative de connection à la base de donnée: ${err}`
    );
  });

//Debug

//Création d'un média de test:
const mediaUtils = require("./utils/mediaUtils");

/*const fileUtils = require("./utils/fileUtils");
let buffer = fileUtils.readFile("mycat.jpg");
mediaUtils.createMedia(
  "public/mycat.jpg",
  buffer,
  true,
  [],
  "6298e6f62f41d6b04381c47a"
);*/

//Suppression:
mediaUtils.removeMediaByLink("private/monmedia.jpg");
mediaUtils.removeMediaByLink("private/test1.jpg");
mediaUtils.removeMediaByLink("public/maphoto.jpg");
