/*
  Utilitaire pour les utilisateurs.
*/

//Utilitaires.

const objectUtils = require("./objectUtils");
const postUtils = require("./postUtils");

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

exports.getUserFromId = async (id) => {
  let user = await userModel.model.findOne({ _id: id });
  if (!user) throw "L'utilisateur n'existe pas.";
  return user;
};

exports.getUserParamsFromUserId = async (id) => {
  let params = await userParamsModel.findOne({ utilisateur: id });
  if (!params)
    throw "Les paramètres liés à l'identifiant d'utilisateur donné en argument n'existent pas.";
  return params;
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

  //Suppression de tous les posts.
  postUtils.removePostsFromUserId(id);

  //Suppresion des paramètres.
  await userParamsModel.findOneAndRemove({
    utilisateur: id,
  });

  //Suppresion de l'utilisateur.
  await userModel.model.deleteOne({ _id: id });
};

exports.deleteUser = async (user) => {
  if (!objectUtils.containsUniqueUserData(user))
    throw "L'objet envoyé ne représente pas un utilisateur.";
  if (!"_id" in user) throw "L'objet envoyé ne contient pas d'identifiant.";

  await this.deleteUserFromId(user._id.toString());
};
