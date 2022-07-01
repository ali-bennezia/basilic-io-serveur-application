//Utilitaires.

const followUtils = require("./../utils/followUtils");
const objectUtils = require("./../utils/objectUtils");
const userUtils = require("./../utils/userUtils");

//API.

//GET /follows/post/:mode&:userIdB
/*
    Permet de follow ou unfollow un utilisateur selon le mode choisi.
    Mode doit avoir deux valeurs possible:
    - 0 : Suivre une personne
    - 1 : Cesser de suivre une personne.
    La valeur userIdB est l'identifiant de l'utilisateur ciblé.
    Le profil de l'utilisateur ciblé doit être dans un domaine accessible au client voulant le suivre.
    Le client doit justifier d'un token authentique.
*/
exports.follow = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    let md = parseInt(req.params.mode);
    if (
      isNaN(md) ||
      (md != 0 && md != 1) ||
      !objectUtils.isObjectValidStringId(req.params.userIdB)
    )
      return res.status(400).json("Bad Request");

    //Validation des valeurs reçues.
    if (!(await userUtils.doesUserIdExist(req.params.userIdB)))
      return res.status(404).json("Not Found");

    //Validation des droits d'accès.
    let clientUserId = req.tokenPayload.userId;
    if (
      !(await userUtils.doesUserIdHaveAccessToUserIdDomain(
        clientUserId,
        req.params.userIdB
      ))
    )
      return res.status(403).json("Forbidden");

    //Execution.
    if (md == 0) {
      await followUtils.setUserIdAFollowUserIdB(
        clientUserId,
        req.params.userIdB
      );
    } else {
      await followUtils.setUserIdAUnfollowUserIdB(
        clientUserId,
        req.params.userIdB
      );
    }

    return res.status(200).json("OK");
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal Server Error");
  }
};
