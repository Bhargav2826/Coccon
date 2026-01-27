import { body, param, validationResult } from "express-validator";

// Helper function to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Debug logging
    console.log("🔍 Validation Errors:", {
      body: req.body,
      params: req.params,
      query: req.query,
      errors: errors.array()
    });
    
    // Group errors by field for better user experience
    const fieldErrors = {};
    const generalErrors = [];
    
    errors.array().forEach(error => {
      if (error.path) {
        // Field-specific error
        if (!fieldErrors[error.path]) {
          fieldErrors[error.path] = [];
        }
        fieldErrors[error.path].push(error.msg);
      } else {
        // General error
        generalErrors.push(error.msg);
      }
    });
    
    // Create user-friendly error message
    let userMessage = "Please fix the following issues:";
    if (Object.keys(fieldErrors).length > 0) {
      userMessage += "\n\n";
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        userMessage += `• ${fieldName}: ${messages.join(', ')}\n`;
      });
    }
    
    if (generalErrors.length > 0) {
      userMessage += "\n" + generalErrors.join('\n');
    }
    
    return res.status(400).json({
      message: "Validation failed",
      userMessage: userMessage.trim(),
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      })),
      fieldErrors: fieldErrors
    });
  }
  next();
};

// Authentication validation chains
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
  body("age")
    .optional()
    .isInt({ min: 5, max: 18 })
    .withMessage("Age must be between 5 and 18"),
  body("grade")
    .optional()
    .isIn(["kindergarten", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "college"])
    .withMessage("Invalid grade level"),
  body("school")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("School name must be between 2 and 100 characters"),
  body("profilePic")
    .optional()
    .isURL()
    .withMessage("Profile picture must be a valid URL"),
  body("safetyLevel")
    .optional()
    .isIn(["strict", "moderate", "relaxed"])
    .withMessage("Safety level must be strict, moderate, or relaxed"),
  body("communicationPreferences")
    .optional()
    .isObject()
    .withMessage("Communication preferences must be an object"),
  body("communicationPreferences.allowDirectMessages")
    .optional()
    .isBoolean()
    .withMessage("Allow direct messages must be a boolean"),
  body("communicationPreferences.allowGroupChats")
    .optional()
    .isBoolean()
    .withMessage("Allow group chats must be a boolean"),
  body("monitoringSettings")
    .optional()
    .isObject()
    .withMessage("Monitoring settings must be an object"),
  body("emergencyContact")
    .optional()
    .isObject()
    .withMessage("Emergency contact must be an object"),
  body("emergencyContact.name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Emergency contact name must be between 2 and 50 characters"),
  body("emergencyContact.relationship")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Emergency contact relationship must be between 2 and 30 characters"),
  body("emergencyContact.phone")
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage("Emergency contact phone must be between 10 and 20 characters"),
  body("emergencyContact.email")
    .optional()
    .isEmail()
    .withMessage("Emergency contact email must be a valid email"),
  body("academicSubjects")
    .optional()
    .isArray()
    .withMessage("Academic subjects must be an array"),
  body("interests")
    .optional()
    .isArray()
    .withMessage("Interests must be an array"),
  body("dailyScreenTimeLimit")
    .optional()
    .isInt({ min: 30, max: 480 })
    .withMessage("Daily screen time limit must be between 30 and 480 minutes"),
  body("preferredStudyTimes")
    .optional()
    .isArray()
    .withMessage("Preferred study times must be an array"),
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

// Room validation chains
export const validateRoomId = [
  param("roomId")
    .isMongoId()
    .withMessage("Invalid room ID format"),
  handleValidationErrors
];

export const validateBulkDeleteRooms = [
  body("roomIds")
    .isArray({ min: 1 })
    .withMessage("roomIds must be a non-empty array"),
  body("roomIds.*")
    .isMongoId()
    .withMessage("Each room ID must be a valid MongoDB ObjectId"),
  handleValidationErrors
];

// Faculty messaging validation chains
export const validateFacultyMessage = [
  body("roomId")
    .isMongoId()
    .withMessage("Invalid room ID format"),
  body("message")
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Message must be between 1 and 2000 characters"),
  body("messageType")
    .optional()
    .isIn(["text", "image", "file", "system"])
    .withMessage("Invalid message type"),
  body("targetUserId")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === "") {
        return true; // Allow null/empty values
      }
      // If value exists, validate as MongoDB ObjectId
      const mongoose = require("mongoose");
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage("Invalid target user ID format"),
  handleValidationErrors
];

export const validateFacultyVideoCall = [
  body("roomId")
    .isMongoId()
    .withMessage("Invalid room ID format"),
  body("callUrl")
    .trim()
    .isURL()
    .withMessage("Please provide a valid video call URL"),
  body("callTitle")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Call title must be between 1 and 100 characters"),
  body("targetUserId")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === "") {
        return true; // Allow null/empty values
      }
      // If value exists, validate as MongoDB ObjectId
      const mongoose = require("mongoose");
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage("Invalid target user ID format"),
  handleValidationErrors
];

export const validateStartFacultyVideoCall = [
  body("roomId")
    .isMongoId()
    .withMessage("Invalid room ID format"),
  body("callTitle")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Call title must be between 1 and 100 characters"),
  body("targetUserId")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === "") {
        return true; // Allow null/empty values
      }
      // If value exists, validate as MongoDB ObjectId
      const mongoose = require("mongoose");
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage("Invalid target user ID format"),
  handleValidationErrors
];

// File upload validation - no message required
export const validateFacultyFile = [
  body("roomId")
    .isMongoId()
    .withMessage("Invalid room ID format"),
  body("targetUserId")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === "") {
        return true; // Allow null/empty values
      }
      // If value exists, validate as MongoDB ObjectId
      const mongoose = require("mongoose");
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage("Invalid target user ID format"),
  handleValidationErrors
];

// Sanitization middleware for general use
export const sanitizeInput = [
  body("*")
    .trim()
    .escape(),
  handleValidationErrors
];
