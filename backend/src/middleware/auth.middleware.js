import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const protectRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      console.log("🔍 protectRole middleware - allowedRoles:", allowedRoles);
      
      // First, ensure user is authenticated
      const token = req.cookies.jwt;
      console.log("🔍 protectRole middleware - token exists:", !!token);

      if (!token) {
        return res.status(401).json({ message: "Unauthorized - No token provided" });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log("🔍 protectRole middleware - decoded token:", decoded);
      } catch (jwtError) {
        console.log("🔍 protectRole middleware - JWT verification failed:", jwtError.message);
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
      }

      if (!decoded) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
      }

      const user = await User.findById(decoded.userId).select("-password");
      console.log("🔍 protectRole middleware - user found:", !!user);
      console.log("🔍 protectRole middleware - user role:", user?.role);

      if (!user) {
        return res.status(401).json({ message: "Unauthorized - User not found" });
      }

      // Check if user's role is in the allowed roles array
      if (!allowedRoles.includes(user.role)) {
        console.log("🔍 protectRole middleware - role mismatch:", {
          userRole: user.role,
          allowedRoles: allowedRoles
        });
        return res.status(403).json({ 
          message: "Forbidden - Insufficient permissions",
          requiredRoles: allowedRoles,
          userRole: user.role
        });
      }

      console.log("🔍 protectRole middleware - access granted for role:", user.role);
      req.user = user;
      next();
    } catch (error) {
      console.log("Error in protectRole middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
};
