/*
  Utilitaire pour le traitement sur des objets JS.
*/

//Librairies

const mongoose = require("mongoose");

//Utilitaires

const mediaUtils = require("./../utils/mediaUtils");
const followUtils = require("./../utils/followUtils");

//Implémentations

exports.arrayEqualsArray = (array1, array2) =>
  Array.isArray(array1) &&
  Array.isArray(array2) &&
  array1.length == array2.length &&
  array1.every((val, index) => val === array2[index]);

//Renvoie true si le premier objet contient exactement les mêmes propriétés que le second objet (mais pas forcément les mêmes valeurs pour ces propriétés.).
exports.sanitizeObject = (modelObject, object) =>
  this.arrayEqualsArray(
    Object.getOwnPropertyNames(modelObject).sort(),
    Object.getOwnPropertyNames(object).sort()
  );

const uniqueUserDataProperties = [
  "_id",
  "email",
  "nomUtilisateur",
  "numeroTelephone",
];

//Renvoie true si l'objet contient au moins une propriété qui correspond à une information unique et donc pouvant identifiant un utilisateur.
exports.containsUniqueUserData = (object) => {
  if (!object) return false;
  let foundUniqueUserData = false;
  for (const property in object) {
    if (uniqueUserDataProperties.includes(property)) {
      foundUniqueUserData = true;
      break;
    }
  }
  return foundUniqueUserData;
};

//Extrait d'un objet au moins une information unique pouvant identifier un utilisateur.
exports.getUniqueUserData = (user) => {
  return user
    ? user._id
      ? { _id: user._id }
      : user.nomUtilisateur
      ? { nomUtilisateur: user.nomUtilisateur }
      : user.email
      ? { email: user.email }
      : undefined
    : undefined;
};

//Renvoie true si l'objet contient au moins une propriété qui correspond à une information unique et donc pouvant identifiant un utilisateur ainsi que le mot de passe.
exports.containsAllNecessarySigninData = (object) =>
  !(!object || !this.containsUniqueUserData(object) || !object.motDePasse);

/*
  Renvoie false si l'objet contient au moins une propriété dont le nom ne correspond pas à une chaine de charactère dans la liste propertyNames, true sinon.
*/
exports.containsOnlyGivenArrayElementsAsProperties = (
  object,
  propertyNames
) => {
  for (const prop in object)
    if (!propertyNames.includes(prop)) {
      return false;
    }

  return true;
};

/*
  Renvoie false si la liste contient au moins une propriété dont le nom ne correspond pas à une chaine de charactère dans la liste propertyNames, true sinon.
*/
exports.arrayContainsOnlyGivenArrayElementsAsProperties = (
  object,
  propertyNames
) => {
  for (const prop of object)
    if (!propertyNames.includes(prop)) {
      return false;
    }

  return true;
};

/*
  Renvoie false si l'objet contient au moins une propriété dont le nom ne correspond pas à une propriété d'utilisateur pouvant être mise à jour, true sinon.
*/
const updatableUserData = ["motDePasse", "email", "numeroTelephone"];

exports.containsOnlyUpdatableUserData = (user) =>
  this.containsOnlyGivenArrayElementsAsProperties(user, updatableUserData);

/*
  Remplace les valeurs des propriétés d'un objet par les valeurs des propriétés correspondantes d'un second objet.
  Si la dite propriété n'existe pas dans le premier objet, mais seulement le second, elle sera crée et vaudra la valeur de celle du second.
*/
exports.overwriteAndAddObjectProperties = function (
  objectToOverwrite,
  propertiesObject
) {
  let overwrittenObject = { ...objectToOverwrite };
  for (prop in propertiesObject)
    overwrittenObject[prop] = propertiesObject[prop];

  return overwrittenObject;
};

/*
  Vérifie si l'objet envoyé:
   - existe bien,
   - est bien un array,
   - ne contient bien que des chaines de charactères,
   - à une longueur inférieure à la limite fixée à la configuration pour la liste des demandes d'authorization d'accès aux médias.
*/
exports.sanitizeMediaAuthorizationObject = function (object) {
  if (
    object &&
    Array.isArray(object) &&
    object.length <=
      parseInt(
        process.env.MAX_TOKEN_MEDIA_AUTHORIZATION_AUTHENTIFICATION_REQUESTS ??
          24
      )
  ) {
    let nonStringFound = false;
    for (let el of object) {
      if (!(el instanceof String || typeof el == "string")) return false;
    }
    return true;
  }
  return false;
};

exports.trimArray = function (arr, maxLength) {
  if (!Array.isArray(arr))
    throw "L'object envoyé en argument n'est pas une liste.";
  if (arr.length > maxLength) arr = arr.splice(0, [...maxLength]);
  return arr;
};

exports.trimMediaAuthorizationObject = function (object) {
  if (!this.sanitizeMediaAuthorizationObject(object))
    throw "L'objet envoyé en argument ne représente pas une liste d'authentifications d'authorizations d'accès aux médias.";
  let maxLength = parseInt(
    process.env
      .MAX_TOKEN_MEDIA_AUTHORIZATION_AUTHENTIFICATION_REQUESTS_PER_REQUEST ?? 24
  );
  return this.trimArray(object, maxLength);
};

//Vérifier si l'objet object est bien une chaine de charactères.
exports.isObjectString = (object) =>
  object != null &&
  object != undefined &&
  object != false &&
  (typeof object == "string" || object instanceof String);

//Vérifier si l'objet object est bien une chaine de charactère contenant un identifiant.
exports.isObjectValidStringId = (object) =>
  this.isObjectString(object) && mongoose.Types.ObjectId.isValid(object);

//Vérifier si l'objet object est bien une chaine de charactères indiquant un moment précis, un timestamp.
exports.isStringTimestamp = (object) =>
  this.isObjectString(object) && new Date(object).getTime() > 0;

//Extraire les informations sommaire de profil d'un utilisateur à partir de son document et celui de ses paramètres.
exports.getUserSummaryProfileData = async (user, userParams) => {
  let profileData = {
    id: user._id,
    nomUtilisateur: user.nomUtilisateur,
    valide: "valide" in user ? user.valide : true,
    suiviPar: await followUtils.userFollowingCount(user._id.toString()),
    suis: await followUtils.userFollowsCount(user._id.toString()),
  };
  if ("nomPublic" in userParams && userParams.nomPublic)
    profileData.nomPublic = userParams.nomPublic;
  if ("profilPublic" in userParams && userParams.profilPublic)
    profileData.profilPublic = userParams.profilPublic;
  if ("photoProfil" in userParams && userParams.photoProfil)
    profileData.photoProfil = await mediaUtils.getMediaLinkFromId(
      userParams.photoProfil.toString()
    );
  if ("banniereProfil" in userParams && userParams.banniereProfil)
    profileData.banniereProfil = await mediaUtils.getMediaLinkFromId(
      userParams.banniereProfil.toString()
    );
  if ("descriptionProfil" in userParams && userParams.descriptionProfil)
    profileData.descriptionProfil = userParams.descriptionProfil;
  return profileData;
};

//Vérifie si la longueur de la chaine de charactères est bien comprise entre deux valeurs (inclusives).
exports.isStringLengthInRange = (str, min, max) =>
  str.length >= min && str.length <= max;
