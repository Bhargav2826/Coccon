import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import {
  LoaderIcon,
  ShuffleIcon,
  ShieldIcon,
  GraduationCapIcon,
  UsersIcon,
  CameraIcon,
  UserIcon,
  SchoolIcon
} from "lucide-react";
import Logo from "../components/Logo";

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Determine user role
  const userRole = authUser?.role || 'student';

  const [formState, setFormState] = useState({
    // Basic Information (all roles)
    fullName: authUser?.fullName || "",
    profilePic: authUser?.profilePic || "",

    // Student-specific fields
    age: "",
    grade: "",
    school: "",
    safetyLevel: "moderate",
    allowDirectMessages: true,
    allowGroupChats: true,

    // Parent-specific fields
    monitoringEnabled: true,
    realTimeAlerts: true,
    weeklyReports: true,

    // Faculty-specific fields
    bio: "",
    department: "",

    // Emergency Contact (mainly for students)
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    emergencyContactEmail: "",
  });

  const [validationErrors, setValidationErrors] = useState({});

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      const roleMessages = {
        student: "Student profile setup completed!",
        parent: "Parent profile setup completed!",
        faculty: "Faculty profile setup completed!"
      };
      toast.success(roleMessages[userRole] || "Profile setup completed!");

      // Immediately update the auth query data to mark user as onboarded
      queryClient.setQueryData(["authUser"], (oldData) => ({
        user: {
          ...oldData.user,
          isOnboarded: true
        }
      }));
      console.log("🔄 Auth query data updated - user marked as onboarded");

      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      setValidationErrors({});

      // Redirect to appropriate dashboard based on role
      const dashboardPaths = {
        student: "/student-dashboard",
        parent: "/parent-dashboard",
        faculty: "/faculty-dashboard"
      };

      const dashboardPath = dashboardPaths[userRole] || "/";
      console.log(`🎯 Redirecting ${userRole} to ${dashboardPath} after onboarding`);
      navigate(dashboardPath, { replace: true });
    },
    onError: (error) => {
      if (error.response?.data?.fieldErrors) {
        setValidationErrors(error.response.data.fieldErrors);
        if (error.response.data.userMessage) {
          toast.error("Please fix the validation errors below");
        }
      } else {
        toast.error(error.response?.data?.message || "Setup failed");
        setValidationErrors({});
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    setValidationErrors({});

    // Role-specific validation
    const clientErrors = {};

    // Basic validation for all roles
    if (!formState.fullName.trim()) {
      clientErrors.fullName = ["Full name is required"];
    }

    // Student-specific validation
    if (userRole === 'student') {
      if (!formState.emergencyContactName.trim()) {
        clientErrors.emergencyContactName = ["Emergency contact name is required"];
      }
      if (!formState.emergencyContactPhone.trim()) {
        clientErrors.emergencyContactPhone = ["Emergency contact phone is required"];
      }
    }

    // Email validation if provided
    if (formState.emergencyContactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.emergencyContactEmail)) {
      clientErrors.emergencyContactEmail = ["Please provide a valid email address"];
    }

    if (Object.keys(clientErrors).length > 0) {
      setValidationErrors(clientErrors);
      toast.error("Please fill in all required fields");
      return;
    }

    // Transform data for backend based on role
    const onboardingData = {
      fullName: formState.fullName,
      profilePic: formState.profilePic,
    };

    // Add role-specific data
    if (userRole === 'student') {
      Object.assign(onboardingData, {
        age: formState.age ? parseInt(formState.age) : null,
        grade: formState.grade,
        school: formState.school,
        safetyLevel: formState.safetyLevel,
        communicationPreferences: {
          allowDirectMessages: formState.allowDirectMessages,
          allowGroupChats: formState.allowGroupChats,
          allowFileSharing: false,
          allowVideoCalls: false,
        },
        monitoringSettings: {
          aiAnalysisEnabled: true,
          realTimeAlerts: true,
          weeklyReports: true,
          contentFiltering: true,
        },
        emergencyContact: {
          name: formState.emergencyContactName,
          relationship: formState.emergencyContactRelationship,
          phone: formState.emergencyContactPhone,
          email: formState.emergencyContactEmail,
        },
        academicSubjects: [],
        interests: [],
        dailyScreenTimeLimit: 120,
        preferredStudyTimes: ["afternoon", "evening"],
      });
    } else if (userRole === 'parent') {
      Object.assign(onboardingData, {
        monitoringSettings: {
          aiAnalysisEnabled: formState.monitoringEnabled,
          realTimeAlerts: formState.realTimeAlerts,
          weeklyReports: formState.weeklyReports,
          contentFiltering: true,
        },
        bio: "",
        nativeLanguage: "",
        learningLanguage: "",
        location: "",
      });
    } else if (userRole === 'faculty') {
      Object.assign(onboardingData, {
        bio: formState.bio,
        school: formState.department,
        nativeLanguage: "",
        learningLanguage: "",
        location: "",
        monitoringSettings: {
          aiAnalysisEnabled: false,
          realTimeAlerts: false,
          weeklyReports: false,
          contentFiltering: false,
        },
      });
    }

    onboardingMutation(onboardingData);
  };

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Random avatar generated!");
  };

  const getFieldError = (fieldName) => {
    return validationErrors[fieldName] || [];
  };

  const hasFieldError = (fieldName) => {
    return validationErrors[fieldName] && validationErrors[fieldName].length > 0;
  };

  // Role-specific content
  const getRoleContent = () => {
    const roleConfig = {
      student: {
        title: "Student Setup",
        subtitle: "Quick setup for safe online learning and communication",
        icon: GraduationCapIcon,
        color: "text-secondary"
      },
      parent: {
        title: "Parent Setup",
        subtitle: "Configure monitoring and safety settings for your child",
        icon: UsersIcon,
        color: "text-info"
      },
      faculty: {
        title: "Faculty Setup",
        subtitle: "Complete your teaching profile setup",
        icon: SchoolIcon,
        color: "text-primary"
      }
    };

    return roleConfig[userRole] || roleConfig.student;
  };

  const roleContent = getRoleContent();
  const RoleIcon = roleContent.icon;

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-2xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
              <RoleIcon className={`size-7 sm:size-8 ${roleContent.color}`} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{roleContent.title}</h1>
            <p className="text-sm sm:text-base text-base-content opacity-70 mt-2 max-w-md mx-auto">
              {roleContent.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Validation Error Summary */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-bold">Please fix the following errors:</h3>
                  <div className="text-sm">
                    {Object.entries(validationErrors).map(([field, errors]) => (
                      <div key={field} className="mt-1">
                        <strong>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Picture */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="size-24 rounded-full bg-base-300 overflow-hidden">
                {formState.profilePic ? (
                  <img src={formState.profilePic} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <CameraIcon className="size-8 text-base-content opacity-40" />
                  </div>
                )}
              </div>
              <button type="button" onClick={handleRandomAvatar} className="btn btn-sm btn-accent">
                <ShuffleIcon className="size-4 mr-2" />
                Generate Avatar
              </button>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <UserIcon className="size-5 text-secondary" />
                Basic Information
              </h3>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Full Name *</span>
                </label>
                <input
                  type="text"
                  value={formState.fullName}
                  onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                  className={`input input-bordered w-full ${hasFieldError('fullName') ? 'input-error' : ''}`}
                  placeholder="Your full name"
                  required
                />
                {hasFieldError('fullName') && (
                  <label className="label">
                    <span className="label-text-alt text-error">{getFieldError('fullName').join(', ')}</span>
                  </label>
                )}
              </div>

              {/* Student-specific fields */}
              {userRole === 'student' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Age</span>
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="18"
                        value={formState.age}
                        onChange={(e) => setFormState({ ...formState, age: e.target.value })}
                        className={`input input-bordered w-full ${hasFieldError('age') ? 'input-error' : ''}`}
                        placeholder="Your age"
                      />
                      {hasFieldError('age') && (
                        <label className="label">
                          <span className="label-text-alt text-error">{getFieldError('age').join(', ')}</span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Grade</span>
                      </label>
                      <select
                        value={formState.grade}
                        onChange={(e) => setFormState({ ...formState, grade: e.target.value })}
                        className={`select select-bordered w-full ${hasFieldError('grade') ? 'select-error' : ''}`}
                      >
                        <option value="">Select grade</option>
                        <option value="kindergarten">Kindergarten</option>
                        <option value="1st">1st Grade</option>
                        <option value="2nd">2nd Grade</option>
                        <option value="3rd">3rd Grade</option>
                        <option value="4th">4th Grade</option>
                        <option value="5th">5th Grade</option>
                        <option value="6th">6th Grade</option>
                        <option value="7th">7th Grade</option>
                        <option value="8th">8th Grade</option>
                        <option value="9th">9th Grade</option>
                        <option value="10th">10th Grade</option>
                        <option value="11th">11th Grade</option>
                        <option value="12th">12th Grade</option>
                        <option value="college">College</option>
                      </select>
                      {hasFieldError('grade') && (
                        <label className="label">
                          <span className="label-text-alt text-error">{getFieldError('grade').join(', ')}</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">School</span>
                    </label>
                    <input
                      type="text"
                      value={formState.school}
                      onChange={(e) => setFormState({ ...formState, school: e.target.value })}
                      className={`input input-bordered w-full ${hasFieldError('school') ? 'input-error' : ''}`}
                      placeholder="Your school name"
                    />
                    {hasFieldError('school') && (
                      <label className="label">
                        <span className="label-text-alt text-error">{getFieldError('school').join(', ')}</span>
                      </label>
                    )}
                  </div>
                </>
              )}

              {/* Faculty-specific fields */}
              {userRole === 'faculty' && (
                <>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Bio</span>
                    </label>
                    <textarea
                      value={formState.bio}
                      onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                      className={`textarea textarea-bordered w-full ${hasFieldError('bio') ? 'textarea-error' : ''}`}
                      placeholder="Tell us about your teaching experience and expertise..."
                      rows={3}
                    />
                    {hasFieldError('bio') && (
                      <label className="label">
                        <span className="label-text-alt text-error">{getFieldError('bio').join(', ')}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Department/Subject</span>
                    </label>
                    <input
                      type="text"
                      value={formState.department}
                      onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                      className={`input input-bordered w-full ${hasFieldError('department') ? 'input-error' : ''}`}
                      placeholder="e.g., Mathematics, Science, English..."
                    />
                    {hasFieldError('department') && (
                      <label className="label">
                        <span className="label-text-alt text-error">{getFieldError('department').join(', ')}</span>
                      </label>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Safety Settings - Only for students */}
            {userRole === 'student' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ShieldIcon className="size-5 text-accent" />
                  Safety Settings
                </h3>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Safety Level</span>
                  </label>
                  <select
                    value={formState.safetyLevel}
                    onChange={(e) => setFormState({ ...formState, safetyLevel: e.target.value })}
                    className={`select select-bordered w-full ${hasFieldError('safetyLevel') ? 'select-error' : ''}`}
                  >
                    <option value="strict">Strict - Maximum protection</option>
                    <option value="moderate">Moderate - Balanced approach</option>
                    <option value="relaxed">Relaxed - Minimal restrictions</option>
                  </select>
                  {hasFieldError('safetyLevel') && (
                    <label className="label">
                      <span className="label-text-alt text-error">{getFieldError('safetyLevel').join(', ')}</span>
                    </label>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={formState.allowDirectMessages}
                      onChange={(e) => setFormState({ ...formState, allowDirectMessages: e.target.checked })}
                    />
                    <span className="label-text">Allow Direct Messages</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={formState.allowGroupChats}
                      onChange={(e) => setFormState({ ...formState, allowGroupChats: e.target.checked })}
                    />
                    <span className="label-text">Allow Group Chats</span>
                  </label>
                </div>
              </div>
            )}

            {/* Monitoring Settings - Only for parents */}
            {userRole === 'parent' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ShieldIcon className="size-5 text-accent" />
                  Monitoring Settings
                </h3>

                <div className="space-y-3">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={formState.monitoringEnabled}
                      onChange={(e) => setFormState({ ...formState, monitoringEnabled: e.target.checked })}
                    />
                    <span className="label-text">Enable AI Monitoring</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={formState.realTimeAlerts}
                      onChange={(e) => setFormState({ ...formState, realTimeAlerts: e.target.checked })}
                    />
                    <span className="label-text">Real-time Safety Alerts</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={formState.weeklyReports}
                      onChange={(e) => setFormState({ ...formState, weeklyReports: e.target.checked })}
                    />
                    <span className="label-text">Weekly Activity Reports</span>
                  </label>
                </div>
              </div>
            )}

            {/* Emergency Contact - Only for students */}
            {userRole === 'student' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <UsersIcon className="size-5 text-info" />
                  Emergency Contact
                </h3>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Contact Name *</span>
                  </label>
                  <input
                    type="text"
                    value={formState.emergencyContactName}
                    onChange={(e) => setFormState({ ...formState, emergencyContactName: e.target.value })}
                    className={`input input-bordered w-full ${hasFieldError('emergencyContactName') ? 'input-error' : ''}`}
                    placeholder="Parent or guardian name"
                    required
                  />
                  {hasFieldError('emergencyContactName') && (
                    <label className="label">
                      <span className="label-text-alt text-error">{getFieldError('emergencyContactName').join(', ')}</span>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Relationship</span>
                    </label>
                    <input
                      type="text"
                      value={formState.emergencyContactRelationship}
                      onChange={(e) => setFormState({ ...formState, emergencyContactRelationship: e.target.value })}
                      className={`input input-bordered w-full ${hasFieldError('emergencyContactRelationship') ? 'input-error' : ''}`}
                      placeholder="Parent, Guardian, etc."
                    />
                    {hasFieldError('emergencyContactRelationship') && (
                      <label className="label">
                        <span className="label-text-alt text-error">{getFieldError('emergencyContactRelationship').join(', ')}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Phone Number *</span>
                    </label>
                    <input
                      type="tel"
                      value={formState.emergencyContactPhone}
                      onChange={(e) => setFormState({ ...formState, emergencyContactPhone: e.target.value })}
                      className={`input input-bordered w-full ${hasFieldError('emergencyContactPhone') ? 'input-error' : ''}`}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                    {hasFieldError('emergencyContactPhone') && (
                      <label className="label">
                        <span className="label-text-alt text-error">{getFieldError('emergencyContactPhone').join(', ')}</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email Address (Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={formState.emergencyContactEmail}
                    onChange={(e) => setFormState({ ...formState, emergencyContactEmail: e.target.value })}
                    className={`input input-bordered w-full ${hasFieldError('emergencyContactEmail') ? 'input-error' : ''}`}
                    placeholder="contact@example.com"
                  />
                  {hasFieldError('emergencyContactEmail') && (
                    <label className="label">
                      <span className="label-text-alt text-error">{getFieldError('emergencyContactEmail').join(', ')}</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Role-specific Info Alert */}
            <div className="alert alert-info">
              <ShieldIcon className="size-6" />
              <div>
                <h3 className="font-bold">
                  {userRole === 'student' && "COCOON Safety Features"}
                  {userRole === 'parent' && "Parent Monitoring Features"}
                  {userRole === 'faculty' && "Faculty Features"}
                </h3>
                <div className="text-sm">
                  {userRole === 'student' && "Your profile will be protected with AI monitoring, real-time alerts, and parent oversight."}
                  {userRole === 'parent' && "Monitor your child's online activities with AI-powered safety features and detailed reports."}
                  {userRole === 'faculty' && "Access classroom management tools and student safety monitoring features."}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button className="btn btn-primary w-full" disabled={isPending} type="submit">
              {!isPending ? (
                <>
                  <div className="w-5 h-5 mr-2">
                    <Logo size="small" showText={false} />
                  </div>
                  Complete {userRole === 'student' ? 'Student' : userRole === 'parent' ? 'Parent' : 'Faculty'} Setup
                </>
              ) : (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                  Setting up...
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
