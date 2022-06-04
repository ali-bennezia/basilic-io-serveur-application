//Utilitaires.

const userUtils = require("./../utils/userUtils");

//Modèles.

const mediaModel = require("./../models/mediaModel");

exports.getMediaByLink = async function (mediaLink) {
  if (typeof mediaLink != "string" && !mediaLink instanceof String)
    throw "Argument incorrect.";

  let media = await mediaModel.findOne({ lien: mediaLink });
  return media;
};

exports.checkUserMediaAccessByUserId = async function (mediaLink, userId) {
  let media = getMediaByLink(mediaLink);
  return (
    media &&
    (!"mediaPublic" in media ||
      media.mediaPublic == true ||
      ("droitsVisible" in media && media.droitsVisible.includes(userId)))
  );
};
