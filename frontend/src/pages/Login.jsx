import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import api from "../api/api";

function Login({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Student");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      /*
       * Backend response:
       * {
       *   access_token: "...",
       *   token_type: "bearer",
       *   user_id: 8,
       *   full_name: "Priya Sharma",
       *   email: "priya.student@campusleave.edu",
       *   role: "STUDENT"
       * }
       *
       * The user information is returned directly,
       * not inside response.data.user.
       */

      const {
        access_token,
        user_id,
        full_name,
        email: userEmail,
        role: userRole,
      } = response.data;

      if (!access_token) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      const user = {
        user_id,
        full_name,
        email: userEmail,
        role: userRole,
      };

      // Save authentication information
      localStorage.setItem("campusleave_token", access_token);
      localStorage.setItem("campusleave_user", JSON.stringify(user));

      // Send authenticated user to App.jsx
      onLogin(user);
    } catch (err) {
      console.error("Login error:", err);

      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (err.response?.status === 422) {
        setError("Please enter a valid college email and password.");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="min-h-screen lg:grid lg:grid-cols-2">

        {/* =========================================================
            LEFT SIDE - BRANDING
        ========================================================= */}
        <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12 xl:p-16">

          {/* Background decoration */}
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
              <GraduationCap size={25} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                CampusLeave
              </h1>

              <p className="text-xs text-slate-400">
                AI Management
              </p>
            </div>
          </div>

          {/* Main message */}
          <div className="relative max-w-xl">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-300">
              <Sparkles size={16} />
              AI-powered leave management
            </div>

            <h2 className="text-5xl font-bold leading-tight xl:text-6xl">
              Smarter leave
              <span className="block text-indigo-400">
                management.
              </span>
            </h2>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
              Simplify leave applications, approvals and attendance
              tracking with intelligent insights designed for modern
              colleges.
            </p>

            {/* Features */}
            <div className="mt-10 space-y-4">

              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle2
                  className="text-emerald-400"
                  size={20}
                />
                AI-assisted leave analysis
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle2
                  className="text-emerald-400"
                  size={20}
                />
                Real-time attendance insights
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle2
                  className="text-emerald-400"
                  size={20}
                />
                Transparent approval workflow
              </div>

            </div>
          </div>

          {/* Bottom */}
          <div className="relative flex items-center gap-2 text-sm text-slate-500">
            <BrainCircuit size={16} />
            Built with AI • Secure • Transparent
          </div>
        </div>

        {/* =========================================================
            RIGHT SIDE - LOGIN
        ========================================================= */}
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">

          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <GraduationCap size={25} />
              </div>

              <div>
                <h1 className="font-bold">
                  CampusLeave
                </h1>

                <p className="text-xs text-slate-500">
                  AI Management
                </p>
              </div>

            </div>

            {/* Heading */}
            <div className="mb-8">

              <h2 className="text-3xl font-bold tracking-tight">
                Welcome back 👋
              </h2>

              <p className="mt-2 text-slate-500">
                Sign in to manage your college leaves.
              </p>

            </div>

            {/* Login card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50">

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Email */}
                <div>

                  <label className="mb-2 block text-sm font-medium">
                    College Email
                  </label>

                  <div className="relative">

                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                      }}
                      placeholder="student@college.edu"
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />

                  </div>

                </div>

                {/* Password */}
                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Password
                  </label>

                  <div className="relative">

                    <LockKeyhole
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setError("");
                      }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                </div>

                {/* Role */}
                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Sign in as
                  </label>

                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option>Student</option>
                    <option>Faculty</option>
                    <option>HOD</option>
                    <option>Administrator</option>
                  </select>

                </div>

                {/* Remember / forgot */}
                <div className="flex items-center justify-between text-sm">

                  <label className="flex items-center gap-2 text-slate-500">

                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />

                    Remember me

                  </label>

                  <button
                    type="button"
                    className="font-medium text-indigo-600 hover:text-indigo-700"
                    onClick={() => {
                      setError(
                        "Password recovery will be available soon."
                      );
                    }}
                  >
                    Forgot password?
                  </button>

                </div>

                {/* Sign in */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-indigo-600/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}

                </button>

              </form>

              {/* Security */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <LockKeyhole size={13} />
                Your information is securely protected
              </div>

            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-slate-400">
              CampusLeave AI • College Leave Management System
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;