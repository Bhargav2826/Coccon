import { useState } from "react";
import { Link } from "react-router";
import useSignUp from "../hooks/useSignUp";
import Logo from "../components/Logo";
import { useThemeStore } from "../store/useThemeStore";

const SignUpPage = () => {
  const { theme } = useThemeStore();
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student", // Default role
  });

  const { isPending, error, signupMutation } = useSignUp();

  const handleSignup = (e) => {
    e.preventDefault();
    signupMutation(signupData);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8"
      data-theme={theme}
    >
      <div className="w-full max-w-5xl mx-auto">
        <div className="border border-primary/25 flex flex-col lg:flex-row bg-base-100 rounded-xl shadow-lg overflow-hidden">
          {/* SIGNUP FORM - LEFT SIDE */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
            {/* LOGO */}
            <div className="mb-6 flex items-center justify-center lg:justify-start gap-2">
              <Logo />
            </div>

            {/* ERROR MESSAGE IF ANY */}
            {error && (
              <div className="alert alert-error mb-6">
                <div>
                  <h4 className="font-bold">Signup Failed</h4>
                  <div className="text-sm">
                    {error.response?.data?.message && (
                      <p className="mb-2">{error.response.data.message}</p>
                    )}
                    {error.response?.data?.errors && (
                      <ul className="list-disc list-inside space-y-1">
                        {error.response.data.errors.map((err, index) => (
                          <li key={index}>
                            <strong>{err.field}:</strong> {err.message}
                            {err.value && <span className="text-xs opacity-70"> (Value: {err.value})</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="w-full max-w-md mx-auto lg:mx-0">
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">Create an Account</h2>
                  <p className="text-sm sm:text-base opacity-70">
                    Join COCOON - Emotional Safety & Digital Protection for Every Child
                  </p>
                </div>

                <div className="space-y-4">
                  {/* FULLNAME */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Full Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="input input-bordered w-full"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  
                  {/* EMAIL */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Email</span>
                    </label>
                    <input
                      type="email"
                      placeholder="hello@example.com"
                      className="input input-bordered w-full"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>

                  {/* PASSWORD */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input input-bordered w-full"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                    />
                  </div>

                  {/* ROLE SELECTION */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">I am a...</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { value: "student", label: "Student", icon: "👨‍🎓" },
                        { value: "parent", label: "Parent", icon: "👨‍👩‍👧‍👦" },
                        { value: "faculty", label: "Faculty", icon: "👨‍🏫" },
                      ].map((role) => (
                        <label
                          key={role.value}
                          className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
                            signupData.role === role.value
                              ? "border-primary bg-primary/10"
                              : "border-base-300 hover:border-primary/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role.value}
                            checked={signupData.role === role.value}
                            onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                            className="hidden"
                          />
                          <div className="text-2xl mb-1">{role.icon}</div>
                          <div className="text-sm font-medium">{role.label}</div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-full h-12 text-base font-medium" 
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>

                  <div className="text-center pt-4">
                    <p className="text-sm sm:text-base">
                      Already have an account?{" "}
                      <Link to="/login" className="text-primary hover:underline font-medium">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* IMAGE SECTION - RIGHT SIDE */}
          <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
            <div className="max-w-md p-8">
              {/* Illustration */}
              <div className="relative aspect-square max-w-sm mx-auto">
                <img src="/i.png" alt="Language connection illustration" className="w-full h-full object-contain" />
              </div>

              <div className="text-center space-y-4 mt-8">
                <h2 className="text-2xl font-bold">Join COCOON Today</h2>
                <p className="opacity-70 text-lg">
                  Experience the future of safe, monitored communication for children and families
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SignUpPage;
