"use strict";
//Initialization.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
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
const LISTEN_PORT = (_a = process.env.LISTEN_PORT) !== null && _a !== void 0 ? _a : 5000;
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
app.use("/api/follows", require("./routers/followRouter"));
//Execution.
mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
    console.log("Connection à la base de donnée établie avec succès.");
    app.listen(LISTEN_PORT, () => {
        console.log(`Application lancée et à l'écoute sur le port ${LISTEN_PORT}.`);
    });
})
    .catch((err) => {
    console.log(`Erreur lors de la tentative de connection à la base de donnée: ${err}`);
});
//Debug
//Création d'un média de test:
const mediaUtils = require("./utils/mediaUtils");
const postUtils = require("./utils/postUtils");
const msgUtils = require("./utils/messageUtils");
//msgUtils.removeMessage("62a95fb0d574dad703b00242");
let test2 = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(
    /*await msgUtils.getConversationMessages(
      "629ed8fc7c48afad0c583543",
      "62a697719301a87aa0628e80",
      10
    )*/
    yield msgUtils.getUserConversations("629ed8fc7c48afad0c583543", 1));
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
});
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
let test = () => __awaiter(void 0, void 0, void 0, function* () {
    console
        .log();
});
/*avisUtils.removeAvisWithUserIdAndPostId(
  "629ed8fc7c48afad0c583543",
  "629ee993601725664882b9bf"
);*/
test();
