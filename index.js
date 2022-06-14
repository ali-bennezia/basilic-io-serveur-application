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
app.use("/api/messages", require("./routers/messageRouter"));

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
const msgUtils = require("./utils/messageUtils");

let test2 = async () => {
  console.log(
    /*await msgUtils.getConversationMessages(
      "629ed8fc7c48afad0c583543",
      "62a697719301a87aa0628e80",
      10
    )*/

    await msgUtils.getUserConversations("629ed8fc7c48afad0c583543", 1)
  );

  /*await msgUtils.createMessage(
    "629ed8fc7c48afad0c583543",
    "62a697719301a87aa0628e80",
    "salut"
  );

  msgUtils.createMessage(
    "62a697719301a87aa0628e80",
    "629ed8fc7c48afad0c583543",
    "yo ! "
  );*/

  //await msgUtils.removeMessage("62a7f6a8c6ab30045d9817f3");
  //await msgUtils.removeMessage("62a7f6a8c6ab30045d9817fd");
};
test2();

//msgUtils.removeMessage("62a7e91ed65d4b26c4508a83");

//

//postUtils.createPost("629ed8fc7c48afad0c583543", "Bjr");
/*let main = async () => {
  console.log(
    await postUtils.getPostsFromUser(
      "629ed8fc7c48afad0c583543",
      10,
      "2022-10-16T04:35:47.048Z"
    )
  );
};
main();*/
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
  console
    .log
    //await avisUtils.getAvisFromUserId("629ed8fc7c48afad0c583543", 10)
    //await postUtils.getPostProfileDomain("629ee9bc5c05723c824975cc")
    ();
};

/*avisUtils.removeAvisWithUserIdAndPostId(
  "629ed8fc7c48afad0c583543",
  "629ee993601725664882b9bf"
);*/

test();
