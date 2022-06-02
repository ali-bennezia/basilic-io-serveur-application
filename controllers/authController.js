//Utilitaires

const authUtils = require("./../utils/authUtils");

//API

// POST /api/token/authentify
exports.authentifyToken = async function (req, res) {
  try {
    if (!"token" in req.body || !req.body.token) {
      return res.status(400).json("Bad Request");
    }

    let payload = null;

    try {
      payload = await authUtils.authentifyToken(req.body.token);
    } catch (tokenErr) {}

    let authData = { authentic: payload ? true : false };
    if (!payload) return res.status(200).json(authData);
  } catch (err) {
    res.status(500).json("Internal Server Error");
    console.log(err);
  }
};
