//Librairies

const axios = require("axios");
const FormData = require("form-data");
const path = require("path");

//Utilitaires.

const userUtils = require("./../utils/userUtils");

//Modèles.

const mediaModel = require("./../models/mediaModel");
const { generateUserIdSession } = require("./authUtils");

//Implémentations.

exports.getMediaByLink = async function (mediaLink) {
  if (typeof mediaLink != "string" && !mediaLink instanceof String)
    throw "Argument invalide.";

  let media = await mediaModel.findOne({ lien: mediaLink });
  return media;
};

exports.checkUserMediaAccessByUserId = async function (mediaLink, userId) {
  let media = await this.getMediaByLink(mediaLink);
  return (
    media &&
    (!"mediaPublic" in media ||
      media.mediaPublic == true ||
      ("droitsVisible" in media && media.droitsVisible.includes(userId)))
  );
};

exports.createMedia = async function (
  mediaLink,
  mediaBuffer,
  isPublic = true,
  accessRightsList = [],
  userId
) {
  if (!mediaLink || !mediaBuffer || !userId) throw "Arguments manquants.";
  if (
    !(mediaLink instanceof String || typeof mediaLink == "string") &&
    !(generateUserIdSession instanceof String || typeof userId == "string")
  )
    throw "Arguments invalides.";

  let dbCreated = false;
  let mediaCreated = false;
  let media = null;

  try {
    let dataObject = {
      auteur: userId,
      lien: mediaLink,
      mediaPublic: isPublic,
    };
    if (!isPublic) dataObject.droitsVisible = accessRightsList;

    media = await mediaModel.create(dataObject);
    dbCreated = true;

    let formData = new FormData();
    formData.append("media", mediaBuffer, path.basename(mediaLink));

    let res = await axios({
      method: "post",
      url: `http://${
        process.env.MEDIA_SERVER_ADRESS
      }/api/medias/post/${encodeURIComponent(mediaLink)}`,
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
    mediaCreated = true;

    if (res.status != 201) {
      if (dbCreated && media) {
        await mediaModel.findOneAndDelete({ _id: media._id });
        dbCreated = false;
      }
      return false;
    }
  } catch (err) {
    if (dbCreated && media) {
      await mediaModel.findOneAndDelete({ _id: media._id });
      dbCreated = false;
    }
    if (mediaCreated) {
      await axios({
        method: "delete",
        url: `http://${
          process.env.MEDIA_SERVER_ADRESS
        }/api/medias/delete/${encodeURIComponent(mediaLink)}`,
      });
      mediaCreated = false;
    }

    console.log(err);
    return false;
  }
  return true;
};

exports.removeMediaByLink = async (mediaLink) => {
  try {
    await mediaModel.findOneAndDelete({ lien: mediaLink });
    await axios({
      method: "delete",
      url: `http://${
        process.env.MEDIA_SERVER_ADRESS
      }/api/medias/delete/${encodeURIComponent(mediaLink)}`,
    });
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
};
