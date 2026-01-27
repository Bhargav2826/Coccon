import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export async function signup(req, res) {
  const { email, password, fullName, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists, please use a different one" });
    }

    // Validate role if provided
    const validRoles = ['student', 'parent', 'faculty', 'admin'];
    const userRole = role && validRoles.includes(role) ? role : 'student';

    const newUser = await User.create({
      email,
      fullName,
      password,
      role: userRole,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullName}`);
    } catch (error) {
      console.log("Error creating Stream user:", error);
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // prevent XSS attacks,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // prevent CSRF attacks
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // prevent XSS attacks,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // prevent CSRF attacks
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  // Clear cookie with the same options used to set it
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
  });
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const {
      // Basic Information
      fullName,
      bio,
      nativeLanguage,
      learningLanguage,
      location,
      profilePic,

      // COCOON-Specific Information
      age,
      grade,
      school,
      interests,
      learningGoals,

      // Safety & Monitoring
      safetyLevel,
      allowedTopics,
      restrictedTopics,
      communicationPreferences,

      // Parent Monitoring Settings
      monitoringSettings,

      // Educational Information
      academicSubjects,
      currentCourses,
      dailyScreenTimeLimit,
      preferredStudyTimes,

      // Emergency Contact
      emergencyContact,
    } = req.body;

    console.log('🦋 COCOON Onboarding:', {
      userId: userId.toString(),
      role: req.user.role,
      age,
      grade,
      safetyLevel,
      hasEmergencyContact: !!emergencyContact?.name
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        // Basic fields
        fullName,
        bio,
        nativeLanguage,
        learningLanguage,
        location,
        profilePic,

        // COCOON-specific fields
        age: age ? parseInt(age) : null,
        grade,
        school,
        interests: interests || [],
        learningGoals,

        // Safety settings
        safetyLevel: safetyLevel || 'moderate',
        allowedTopics: allowedTopics || ['education', 'sports', 'music', 'art', 'science', 'math', 'literature'],
        restrictedTopics: restrictedTopics || [],
        communicationPreferences: {
          allowDirectMessages: communicationPreferences?.allowDirectMessages ?? true,
          allowGroupChats: communicationPreferences?.allowGroupChats ?? true,
          allowFileSharing: communicationPreferences?.allowFileSharing ?? false,
          allowVideoCalls: communicationPreferences?.allowVideoCalls ?? false,
        },

        // Monitoring settings
        monitoringSettings: {
          aiAnalysisEnabled: monitoringSettings?.aiAnalysisEnabled ?? true,
          realTimeAlerts: monitoringSettings?.realTimeAlerts ?? true,
          weeklyReports: monitoringSettings?.weeklyReports ?? true,
          contentFiltering: monitoringSettings?.contentFiltering ?? true,
        },

        // Educational tracking
        academicSubjects: academicSubjects || [],
        currentCourses: currentCourses || [],
        dailyScreenTimeLimit: dailyScreenTimeLimit || 120,
        preferredStudyTimes: preferredStudyTimes || ['afternoon', 'evening'],

        // Emergency contact
        emergencyContact: {
          name: emergencyContact?.name || '',
          relationship: emergencyContact?.relationship || '',
          phone: emergencyContact?.phone || '',
          email: emergencyContact?.email || '',
        },

        // Mark as onboarded
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update Stream Chat user with new information
    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`✅ Stream user updated after COCOON onboarding for ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log("⚠️ Error updating Stream user during onboarding:", streamError.message);
    }

    // Log onboarding completion with role-specific information
    if (updatedUser.role === 'student') {
      console.log('🎓 Student onboarded:', {
        name: updatedUser.fullName,
        age: updatedUser.age,
        grade: updatedUser.grade,
        school: updatedUser.school,
        safetyLevel: updatedUser.safetyLevel,
        subjects: updatedUser.academicSubjects.length,
        interests: updatedUser.interests.length
      });
    } else if (updatedUser.role === 'parent') {
      console.log('👨‍👩‍👧‍👦 Parent onboarded:', {
        name: updatedUser.fullName,
        monitoringEnabled: updatedUser.monitoringSettings?.aiAnalysisEnabled,
        emergencyContact: updatedUser.emergencyContact?.name
      });
    } else if (updatedUser.role === 'faculty') {
      console.log('��‍🏫 Faculty onboarded:', {
        name: updatedUser.fullName,
        school: updatedUser.school
      });
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
      message: "COCOON profile setup completed successfully!"
    });
  } catch (error) {
    console.error('❌ COCOON onboarding error:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
