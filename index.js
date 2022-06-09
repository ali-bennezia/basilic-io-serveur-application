//Initialization.

const express = require("express");
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
const MONGO_URI = process.env.MONGO_URI;

//Pour la gestion des requêtes application/json
app.use(express.json());
//Pour la gestion des requêtes application/xwww-form-urlencoded
app.use(express.urlencoded({ extended: true }));

//Routage.

app.use("/api/auth", require("./routers/authRouter"));
app.use("/api/posts", require("./routers/postRouter"));
app.use("/api/profiles", require("./routers/profilRouter"));
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
const postUtils = require("./utils/postUtils");

//postUtils.createPost("629ed8fc7c48afad0c583543", "Hey");
let main = async () => {
  console.log(
    await postUtils.getPostsFromUser(
      "6298e6f62f41d6b04381c47a",
      10,
      "2021-06-06T04:35:47.048Z"
    )
  );
};
//main();
//postUtils.removePost("629d6a19b565ee740e265ab7");

//mediaUtils.removeMediasByIds()

/*const fileUtils = require("./utils/fileUtils");
let buffer = fileUtils.readFile("mycat.jpg");
mediaUtils.createMedia(
  "public/mycat.jpg",
  buffer,
  "629ed8fc7c48afad0c583543",
  true,
  []
);*/

//Suppression:
/*mediaUtils.removeMediaByLink("private/monmedia.jpg");
mediaUtils.removeMediaByLink("private/test1.jpg");
mediaUtils.removeMediaByLink("public/maphoto.jpg");*/

const avisUtils = require("./utils/avisUtils");

/*avisUtils.createAvis(
  "629ed8fc7c48afad0c583543",
  "629ee993601725664882b9bf",
  "like"
);*/

let test = async () => {
  console.log(
    //await avisUtils.getAvisFromUserId("629ed8fc7c48afad0c583543", 10)
    await postUtils.getPostProfileDomain("629ee9bc5c05723c824975cc")
  );
};

/*avisUtils.removeAvisWithUserIdAndPostId(
  "629ed8fc7c48afad0c583543",
  "629ee993601725664882b9bf"
);*/

test();
