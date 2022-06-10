//Librairies

const axios = require("axios");
const FormData = require("form-data");
const path = require("path");

//Utilitaires.

const userUtils = require("./../utils/userUtils");
const objectUtils = require("./../utils/objectUtils");

//Modèles.

const userModel = require("./../models/utilisateurModel");
const mediaModel = require("./../models/mediaModel");
const authUtils = require("./authUtils");

//Implémentations.

exports.getMediaByLink = async function (mediaLink) {
  if (typeof mediaLink != "string" && !mediaLink instanceof String)
    throw "Argument invalide.";

  let media = await mediaModel.findOne({ lien: mediaLink });
  return media;
};

exports.getMediaLinkFromId = async (mediaId) => {
  if (!objectUtils.isObjectValidStringId(mediaId)) throw "Argument invalide.";
  let media = await mediaModel.findById(mediaId);
  return media ? ("lien" in media ? media.lien : "") : "";
};

exports.getMedia = async function (id) {
  return await mediaModel.findById(id);
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
  userId,
  isPublic = true,
  accessRightsList = []
) {
  if (!mediaLink || !mediaBuffer || !userId) throw "Arguments manquants.";
  if (
    (!(mediaLink instanceof String || typeof mediaLink == "string") &&
      !(
        generateUserIdSession instanceof String || typeof userId == "string"
      )) ||
    !(await userModel.model.exists({ _id: userId }))
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
      return null;
    }
    return media;
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
  }
  return null;
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

exports.removeMediasByLinks = async function (...mediaLinks) {
  try {
    let mediaIds = (await mediaModel.find({ lien: { $in: mediaLinks } })).map(
      (el) => el._id
    );

    await mediaModel.deleteMany({ _id: { $in: mediaIds } });
    await axios({
      method: "post",
      url: `http://${process.env.MEDIA_SERVER_ADRESS}/api/medias/deletemany/`,
      data: { list: mediaLinks },
    });
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
};

exports.removeMediasByIds = async function (...mediaIds) {
  try {
    let mediaLinks = (await mediaModel.find({ _id: { $in: mediaIds } })).map(
      (el) => el.lien
    );

    await mediaModel.deleteMany({ _id: { $in: mediaIds } });
    await axios({
      method: "post",
      url: `http://${process.env.MEDIA_SERVER_ADRESS}/api/medias/deletemany/`,
      data: { list: mediaLinks },
    });
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
};

exports.getMediaLinkArrayFromMediaIdArray = async function (mediaIds) {
  if (!Array.isArray(mediaIds)) throw "Argument invalide.";
  console.log(mediaIds);
  let result = [];
  for (let el of mediaIds) {
    if (
      !objectUtils.isObjectValidStringId(el.toString()) ||
      !(await mediaModel.exists({ _id: el }))
    )
      continue;

    let media = await mediaModel.findById(el);
    if (media && "lien" in media && media.lien) result.push(media.lien);
  }
  console.log(result);
  return result;
};
