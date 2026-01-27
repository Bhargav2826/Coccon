import express from "express";
import { login, logout, onboard, signup } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  validateSignup, 
  validateLogin, 
  validateOnboarding 
} from "../middleware/validation.middleware.js";
import { 
  validateSignupDev 
} from "../middleware/validation-dev.middleware.js";

const router = express.Router();

// Use development-friendly validation in development mode
const signupValidation = process.env.NODE_ENV === "development" ? validateSignupDev : validateSignup;
router.post("/signup", signupValidation, signup);
router.post("/login", validateLogin, login);
router.post("/logout", logout);

router.post("/onboarding", protectRoute, validateOnboarding, onboard);

// check if user is logged in
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;
