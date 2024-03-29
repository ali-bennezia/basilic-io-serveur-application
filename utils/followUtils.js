//Utilitaires.
const objectUtils = require("./objectUtils");
const userUtils = require("./userUtils");

//Modèles.
const followModel = require("./../models/followModel");
const userModel = require("./../models/utilisateurModel");

//Implémentations.

//Combien de personnes est-ce que l'utilisateur suit ?
exports.userFollowsCount = async (userId) => {
  //Sanitation des valeurs reçues.
  if (!objectUtils.isObjectValidStringId(userId))
    throw "Argument(s) invalide(s).";

  //Validation des valeurs reçues.
  if (!(await userModel.model.exists({ _id: userId })))
    throw "L'identifiant ne correspond pas à un utilisateur.";

  return await followModel.count({ auteur: userId });
};

//Par combien de personnes l'utilisateur est-il suivi ?
exports.userFollowingCount = async (userId) => {
  //Sanitation des valeurs reçues.
  if (!objectUtils.isObjectValidStringId(userId))
    throw "Argument(s) invalide(s).";

  //Validation des valeurs reçues.
  if (!(await userModel.model.exists({ _id: userId })))
    throw "L'identifiant ne correspond pas à un utilisateur.";

  return await followModel.count({ cible: userId });
};

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

  let follower = await userUtils.getUserFromId(userIdA);
  let followed = await userUtils.getUserFromId(userIdB);

  follower.suivis.push(followed._id);
  followed.suivisPar.push(follower._id);

  await follower.save();
  await followed.save();
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

  let follower = await userUtils.getUserFromId(userIdA);
  let followed = await userUtils.getUserFromId(userIdB);

  follower.suivis.splice(follower.suivis.indexOf(followed._id), 1);
  followed.suivisPar.splice(followed.suivis.indexOf(follower._id), 1);

  await follower.save();
  await followed.save();
};

//Supprimer tous les suivis et suivisPar liés à un utilisateur.
exports.clearTiedFollows = async function (userId) {
  await Promise.all(
    (
      await followModel
        .find({
          $or: [{ auteur: userId }, { cible: userId }],
        })
        .exec()
    ).map(async (el) => {
      return this.setUserIdAUnfollowUserIdB(
        el.auteur.toString(),
        el.cible.toString()
      );
    })
  );
};
