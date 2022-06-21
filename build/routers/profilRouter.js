"use strict";
const express = require("express");
const router = express.Router();
//Contrôleurs.
const profilController = require("./../controllers/profilController");
// GET /api/profiles/get/:id
router.get("/get/:id", profilController.getProfile);
// GET /api/profiles/posts/:userId&:nature&:timestamp&:amount
router.get("/posts/:userId&:nature&:timestamp&:amount", profilController.getProfilePostsWithTimestamp);
// GET /api/profiles/posts/:userId&:nature&:amount
router.get("/posts/:userId&:nature&:amount", profilController.getProfilePosts);
// GET /api/profiles/posts/activities/:userId&:amount&:timestamp
router.get("/posts/activities/:userId&:amount&:timestamp", profilController.getProfileActivitiesWithTimestamp);
// GET /api/profiles/posts/activities/:userId&:amount
router.get("/posts/activities/:userId&:amount", profilController.getProfileActivities);
module.exports = router;
