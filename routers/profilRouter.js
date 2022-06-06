const express = require("express");
const router = express.Router();

//Contrôleurs.
const profilController = require("./../controllers/profilController");

// GET /api/profiles/get/:id
router.get("/get/:id", profilController.getProfile);

// GET /api/profiles/posts/:userId&:nature&:amount
router.get("/posts/:userId&:nature&:amount", profilController.getProfilePosts);

module.exports = router;
