import { useState } from "react";
import { Link } from "react-router";
import useLogin from "../hooks/useLogin";
import Logo from "../components/Logo";
import { useThemeStore } from "../store/useThemeStore";

const LoginPage = () => {
  const { theme } = useThemeStore();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const { isPending, error, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8"
      data-theme={theme}
    >
      <div className="w-full max-w-5xl mx-auto">
        <div className="border border-primary/25 flex flex-col lg:flex-row bg-base-100 rounded-xl shadow-lg overflow-hidden">
          {/* LOGIN FORM SECTION */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
            {/* LOGO */}
            <div className="mb-6 flex items-center justify-center lg:justify-start gap-2">
              <Logo />
            </div>

            {/* ERROR MESSAGE DISPLAY */}
            {error && (
              <div className="alert alert-error mb-6">
                <span className="text-sm">{error.response?.data?.message || "An error occurred"}</span>
              </div>
            )}

            <div className="w-full max-w-md mx-auto lg:mx-0">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back</h2>
                  <p className="text-sm sm:text-base opacity-70">
                    Sign in to your account to access emotional safety & digital protection
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Email</span>
                    </label>
                    <input
                      type="email"
                      placeholder="hello@example.com"
                      className="input input-bordered w-full"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input input-bordered w-full"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-full h-12 text-base font-medium" 
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                  <div className="text-center pt-4">
                    <p className="text-sm sm:text-base">
                      Don't have an account?{" "}
                      <Link to="/signup" className="text-primary hover:underline font-medium">
                        Create one
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* IMAGE SECTION */}
          <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
            <div className="max-w-md p-8">
              {/* Illustration */}
              <div className="relative aspect-square max-w-sm mx-auto">
                <img src="/i.png" alt="Language connection illustration" className="w-full h-full object-contain" />
              </div>

              <div className="text-center space-y-4 mt-8">
                <h2 className="text-2xl font-bold">Emotional Safety & Digital Protection</h2>
                <p className="opacity-70 text-lg">
                  A secure communication platform designed for every child's safety and well-being
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
