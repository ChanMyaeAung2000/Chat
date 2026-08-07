import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { addFriend, getFriends } from "../controllers/friend.controller.js";

const router = express.Router();

router.post("/add", protectRoute, addFriend);
router.get("/", protectRoute, getFriends);

export default router;
