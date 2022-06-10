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

// GET /api/posts/responses/:postId&:amount
router.get(
  "/responses/:postId&:amount",
  authMiddlewares.checkTokenAuthenticity,
  postController.getPostResponses
);

module.exports = router;
