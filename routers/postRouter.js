//Initialization.

const express = require("express");
const router = express.Router();

//Librairies.

const multer = require("multer");

//Contrôleurs.

const postController = require("./../controllers/postController");

//Middlewares.

const authMiddlewares = require("./../middlewares/authentificationMiddlewares");

//API

// GET /api/posts/get/:postId
router.get("/get/:postId", postController.getPost);

// POST /api/posts/create
router.post(
  "/create",
  authMiddlewares.checkTokenAccountValidity,
  multer().array("medias", parseInt(process.env.MAX_MEDIAS_PER_POST)),
  postController.createPost
);

// PATCH /api/posts/update/:postId
router.patch(
  "/update/:postId",
  authMiddlewares.checkTokenAccountValidity,
  postController.editPost
);

// DELETE /api/posts/delete/:postId
router.delete(
  "/delete/:postId",
  authMiddlewares.checkTokenAccountValidity,
  postController.deletePost
);

// GET /api/posts/responses/:postId&:amount&:timestamp
router.get(
  "/responses/:postId&:amount&:timestamp",
  authMiddlewares.checkTokenAuthenticity,
  postController.getPostResponsesWithTimestamp
);

// GET /api/posts/responses/:postId&:amount
router.get(
  "/responses/:postId&:amount",
  authMiddlewares.checkTokenAuthenticity,
  postController.getPostResponses
);

// POST /api/posts/activities/create/:postId&:nature
router.post(
  "/activities/create/:postId&:nature",
  authMiddlewares.checkTokenAccountValidity,
  postController.postActivity
);

// DELETE /api/posts/activities/delete/:postId
router.delete(
  "/activities/delete/:postId",
  authMiddlewares.checkTokenAccountValidity,
  postController.deleteActivity
);

// GET /api/posts/flux/public/get/:amount
router.get("/flux/public/get/:amount", postController.getPostFlux);

// GET /api/posts/flux/public/get/:amount&:timestamp
router.get(
  "/flux/public/get/:amount&:timestamp",
  postController.getPostFluxWithTimestamp
);

module.exports = router;
