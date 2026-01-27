import { body, param, validationResult } from "express-validator";

// Helper function to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Debug logging
    console.log("🔍 Validation Errors:", {
      body: req.body,
      errors: errors.array()
    });
    
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Development-friendly validation chains (relaxed rules)
export const validateSignupDev = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),
  body("role")
    .optional()
    .isIn(["student", "parent", "faculty", "admin"])
    .withMessage("Invalid role specified"),
  handleValidationErrors
];

// Production validation chains (strict rules)
export const validateSignup = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number"),
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Full name can only contain letters and spaces"),
  body("role")
    .optional()
    .isIn(["student", "parent", "faculty", "admin"])
    .withMessage("Invalid role specified"),
  handleValidationErrors
];

export const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors
];

export const validateOnboarding = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Full name can only contain letters and spaces"),
  body("bio")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Bio must be between 10 and 500 characters"),
  body("nativeLanguage")
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("Native language must be between 2 and 20 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Native language can only contain letters and spaces"),
  body("learningLanguage")
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("Learning language must be between 2 and 20 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Learning language can only contain letters and spaces"),
  body("location")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Location must be between 2 and 100 characters"),
  handleValidationErrors
];

// Room management validation chains
export const validateCreateRoom = [
  body("roomName")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Room name must be between 3 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-_()]+$/)
    .withMessage("Room name can only contain letters, numbers, spaces, hyphens, underscores, and parentheses"),
  handleValidationErrors
];

export const validateJoinRoom = [
  body("inviteCode")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Invite code must be exactly 6 characters")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("Invite code can only contain uppercase letters and numbers"),
  handleValidationErrors
];

// User management validation chains
export const validateFriendRequest = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user ID format"),
  handleValidationErrors
];

export const validateAcceptFriendRequest = [
  param("id")
    .isMongoId()
    .withMessage("Invalid request ID format"),
  handleValidationErrors
];

export const validateLinkChild = [
  body("childEmail")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  handleValidationErrors
];

export const validateGenerateLinkCode = [
  // No body validation needed for this endpoint
  handleValidationErrors
];

export const validateUseLinkCode = [
  body("code")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Link code must be exactly 6 characters")
    .matches(/^[0-9]+$/)
    .withMessage("Link code can only contain numbers"),
  handleValidationErrors
];

export const validateChildConversations = [
  param("childId")
    .isMongoId()
    .withMessage("Invalid child ID format"),
  handleValidationErrors
];

// AI analysis validation chains
export const validateAnalyzeChat = [
  body("childUid")
    .isMongoId()
    .withMessage("Invalid child user ID format"),
  body("targetUid")
    .isMongoId()
    .withMessage("Invalid target user ID format"),
  handleValidationErrors
];

// General validation for MongoDB ObjectIds
export const validateObjectId = [
  param("id")
    .isMongoId()
    .withMessage("Invalid ID format"),
  handleValidationErrors
];

// Sanitization middleware for general use
export const sanitizeInput = [
  body("*")
    .trim()
    .escape(),
  handleValidationErrors
];
