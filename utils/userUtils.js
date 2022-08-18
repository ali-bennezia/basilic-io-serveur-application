/*
  Utilitaire pour les utilisateurs.
*/

//Utilitaires.

const objectUtils = require("./objectUtils");
const postUtils = require("./postUtils");
const followUtils = require("./followUtils");
const mediaUtils = require("./mediaUtils");

//Modèles.

const userModel = require("./../models/utilisateurModel");
const userParamsModel = require("./../models/paramsUtilisateurModel");
const { default: mongoose } = require("mongoose");

exports.addUser = async (user) => {
  if (
    user == undefined ||
    !objectUtils.sanitizeObject(userModel.userInsertionDataForm, user)
  )
    throw "L'objet envoyé ne représente pas un utilisateur.";

  //TODO: Sanitation/Validation des informations envoyées.

  let newUser = await userModel.model.create({
    valide: false,
    administrateur: false,
    ...user,
  });

  let newUserParams = userParamsModel.create({
    utilisateur: newUser._id,
    profilPublic: true,
  });

  return { user: newUser, params: newUserParams };
};

exports.doesUserWithEmailExists = async (email) => {
  if (email == null || !objectUtils.isObjectString(email)) return false;
  return (await userModel.model.exists({ email: email })) != null;
};

exports.doesUserWithUsernameExists = async (username) => {
  if (username == null || !objectUtils.isObjectString(username)) return false;
  return (await userModel.model.exists({ nomUtilisateur: username })) != null;
};

exports.doesUserWithPhoneNumberExists = async (phoneNumber) => {
  if (phoneNumber == null || !objectUtils.isObjectString(phoneNumber))
    return false;
  return (
    (await userModel.model.exists({ numeroTelephone: phoneNumber })) != null
  );
};

exports.getUserFromId = async (id) => {
  if (!objectUtils.isObjectValidStringId(id))
    throw "L'identifiant envoyé est incorrect.";
  if (!(await userModel.model.exists({ _id: id })))
    throw "L'utilisateur n'existe pas.";
  let user = await userModel.model.findOne({ _id: id });

  return user;
};

exports.getUserParamsFromUserId = async (id) => {
  if (!objectUtils.isObjectValidStringId(id))
    throw "L'identifiant envoyé est incorrect.";
  if (!(await userParamsModel.exists({ utilisateur: id })))
    throw "Les paramètres n'existent pas.";
  let params = await userParamsModel.findOne({ utilisateur: id }).lean();
  return params;
};

exports.getUserAndUserParamsFromUserId = async (id) => {
  return {
    user: await this.getUserFromId(id),
    params: await this.getUserParamsFromUserId(id),
  };
};

exports.isUserIdAdmin = async (id) => {
  if (!(await userModel.model.exists({ _id: id })))
    throw "L'utilisateur n'existe pas.";
  let user = await userModel.model.findById(id);
  return "administrateur" in user ? user.administrateur : false;
};

//TODO: Supprimer toutes les informations annexes en cascade.

exports.doesUserIdExist = async (id) => {
  if (!objectUtils.isObjectValidStringId(id))
    throw "L'identifiant envoyé est incorrect.";

  return await userModel.model.exists({ _id: id });
};

exports.deleteUserFromId = async (id) => {
  if (
    !id ||
    !(typeof id == "string" || id instanceof String) ||
    !(await userModel.model.exists({ _id: id }))
  )
    throw "L'identifiant envoyé est incorrect.";

  //Suppression de tous les posts en asynchrone.
  postUtils.removePostsFromUserId(id);

  //Supression des médias liés aux paramètres.
  let params = await this.getUserParamsFromUserId(id);
  let paramMedias = [];
  if ("photoProfil" in params) paramMedias.push(params.photoProfil);
  if ("banniereProfil" in params) paramMedias.push(params.banniereProfil);
  await mediaUtils.removeMediasByIds(...paramMedias);

  //Suppresion des paramètres.
  await userParamsModel.findByIdAndDelete(params._id);

  //Suppresion de l'utilisateur.
  await userModel.model.deleteOne({ _id: id });
};

exports.deleteUser = async (user) => {
  if (!objectUtils.containsUniqueUserData(user))
    throw "L'objet envoyé ne représente pas un utilisateur.";
  if (!"_id" in user) throw "L'objet envoyé ne contient pas d'identifiant.";

  await this.deleteUserFromId(user._id.toString());
};

exports.doesUserIdHaveAccessToUserIdDomain = async (userId, domainUserId) => {
  if (
    !objectUtils.isObjectValidStringId(userId) ||
    !objectUtils.isObjectValidStringId(domainUserId)
  )
    throw "Arguments invalides.";

  let userIsAdmin = await this.isUserIdAdmin(userId);
  let domainUser = await this.getUserParamsFromUserId(domainUserId);

  let publicDomain =
    "profilPublic" in domainUser ? domainUser.profilPublic : true;

  if (!publicDomain) {
    if (
      !userIsAdmin &&
      !(await followUtils.userIdFollows(userId, domainUserId)) &&
      userId != domainUserId
    )
      return false;
  }

  return true;
};
