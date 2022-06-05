/*
  Utilitaire pour les utilisateurs.
*/

//Utilitaires.

const objectUtils = require("./objectUtils");

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

//TODO: Supprimer toutes les informations annexes en cascade.

exports.deleteUserFromId = async (id) => {
  if (!id) throw "L'identifiant envoyé est incorrect.";

  await userParamsModel.findOneAndRemove({
    utilisateur: id,
  });
  await userModel.model.deleteOne({ _id: id });
};

exports.deleteUser = async (user) => {
  if (!objectUtils.containsUniqueUserData(user))
    throw "L'objet envoyé ne représente pas un utilisateur.";

  await this.deleteUserFromId(user._id);
};
