//Utilitaires.
const objectUtils = require("./objectUtils");

//Modèles.
const followModel = require("./../models/followModel");
const userModel = require("./../models/utilisateurModel");

//Implémentations.

//TODO

//Est-ce que userA suit userB ?
exports.userIdFollows = async (userIdA, userIdB) =>
  (await followModel.exists({ auteur: userIdA, cible: userIdB })) != null;

//Ajouter un suivi de userA à userB
exports.setUserIdAFollowUserIdB = async function (userIdA, userIdB) {
  //Sanitation des valeurs reçues.
  if (
    !objectUtils.isObjectValidStringId(userIdA) ||
    !objectUtils.isObjectValidStringId(userIdB)
  )
    throw "Argument(s) invalide(s).";

  //Validation des valeurs reçues.
  if (
    !(await userModel.model.exists({ _id: userIdA })) ||
    !(await userModel.model.exists({ _id: userIdB }))
  )
    throw "Au moins l'un des identifiants ne correspond pas à un utilisateur.";

  //Execution.
  if (await this.userIdFollows(userIdA, userIdB)) return;

  await followModel.create({ auteur: userIdA, cible: userIdB });
};

//Supprimer un suivi de userA à userB
exports.setUserIdAUnfollowUserIdB = async function (userIdA, userIdB) {
  //Sanitation des valeurs reçues.
  if (
    !objectUtils.isObjectValidStringId(userIdA) ||
    !objectUtils.isObjectValidStringId(userIdB)
  )
    throw "Argument(s) invalide(s).";

  //Validation des valeurs reçues.
  if (
    !(await userModel.model.exists({ _id: userIdA })) ||
    !(await userModel.model.exists({ _id: userIdB }))
  )
    throw "Au moins l'un des identifiants ne correspond pas à un utilisateur.";

  //Execution.
  if (await this.userIdFollows(userIdA, userIdB))
    await followModel.findOneAndDelete({ auteur: userIdA, cible: userIdB });
};
