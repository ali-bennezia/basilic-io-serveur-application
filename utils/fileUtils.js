/*
    Utilitaire gérant tout ce qui touche au système de fichiers.
*/

const fs = require("fs");
const path = require("path");
const root = "medias" + "/";

const getCreationErrorString = (fileName, error) =>
  `Erreur, création du fichier ${fileName} impossible. ${error}`;

exports.createDirectories = function (...directories) {
  try {
    directories.forEach(function (directory) {
      if (!fs.existsSync(root + directory))
        fs.mkdir(root + directory, function (err, res) {
          if (err) console.log(getCreationErrorString(root + directory, err));
        });
    });
  } catch (err) {
    console.log(err.message);
  }
};

exports.writeFileFromBuffer = function (path, buffer) {
  try {
    fs.writeFile(root + path, buffer, function (err, res) {
      if (err) console.log(getCreationErrorString(root + path, err));
    });
  } catch (err) {
    console.log(err.message);
  }
};

const getRemovalErrorString = (fileName, error) =>
  `Erreur, suppression du fichier ${fileName} impossible. ${error}`;

exports.deleteFile = function (path) {
  try {
    fs.unlink(root + path, (err) => {
      if (err) console.log(getRemovalErrorString(root + path, err));
    });
  } catch (err) {
    console.log(err.message);
  }
};

const getReadErrorString = (fileName, error) =>
  `Erreur, lecture du fichier ${fileName} impossible. ${error}`;

exports.readFile = function (path, prePath = "") {
  path = path.replace("..", "").replace(":", "");
  const fullPath = root + prePath + path;
  try {
    const data = fs.readFileSync(fullPath);
    return data;
  } catch (err) {
    console.log(err.message);
  }
  return null;
};

exports.readPublicFile = (path) =>
  this.readFile(path.replace("..", "").replace("/", ""), "public/");
exports.readPrivateFile = (path) =>
  this.readFile(path.replace("..", "").replace("/", ""), "private/");

exports.validateFile = (sizeInBytes, mimeType) => {
  let validMIMEtypes = process.env.ACCEPTED_MEDIA_MIMETYPES.split(" ");
  let maxSizeInBytes = parseInt(process.env.MAX_MEDIA_SIZE_BYTES);

  return sizeInBytes <= maxSizeInBytes && validMIMEtypes.includes(mimeType);
};

exports.getFilesInDirectory = (dir) => fs.readdirSync(dir);
