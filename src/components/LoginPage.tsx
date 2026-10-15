import React, { useState } from "react";
import {
  registerWithEmailAndPassword,
  signInWithPassword,
  sendPasswordResetOtp,
  signInWithGoogle,
  setGuestMode,
  validateRealEmail,
  getEmailCategory,
  getStoredSavedAccount,
  saveAccountProfile,
  removeStoredAccountProfile,
  SavedAccountProfile,
} from "../services/authService";
import { LoginIllustration } from "./LoginIllustration";
import { AvatarGraphic } from "./AvatarGraphic";
import { Eye, EyeOff, CheckCircle2, AlertCircle, X, ArrowRight } from "lucide-react";

interface LoginPageProps {
  onAuthSuccess: (userEmail: string) => void;
  onContinueAsGuest: () => void;
  onClose?: () => void;
}

export type AuthMode = "signin" | "signup" | "welcome";

export const LoginPage: React.FC<LoginPageProps> = ({
  onAuthSuccess,
  onContinueAsGuest,
  onClose,
}) => {
  // Read remembered saved account (stored in localStorage / browser cookie)
  const [savedAccount, setSavedAccount] = useState<SavedAccountProfile | null>(() =>
    getStoredSavedAccount()
  );

  // If a saved account exists on this device/cookies, initial mode is "welcome" (Instagram-style Welcome Back)
  // Otherwise (first-time visitor or cleared storage), initial mode is "signin"
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    const saved = getStoredSavedAccount();
    return saved ? "welcome" : "signin";
  });

  // Form states - initialized with remembered email if available
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>(() => savedAccount?.email || "");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Status feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  } | null>(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes("error_description=")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const desc = params.get("error_description") || "Google Sign-In failed.";
        window.history.replaceState(null, "", window.location.pathname);
        return {
          type: "error",
          text: `Google OAuth note: ${decodeURIComponent(desc.replace(/\+/g, " "))}. You can sign in directly with your SOA email & password.`,
        };
      }
    }
    return null;
  });

  const handleGuestEntry = () => {
    setGuestMode(true);
    onContinueAsGuest();
  };

  // 1. Sign In (Mode: "signin")
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setStatusMessage({ type: "error", text: "Please enter both your college email and password." });
      return;
    }

    const emailValidation = validateRealEmail(trimmedEmail);
    if (!emailValidation.isValid) {
      setStatusMessage({
        type: "error",
        text: emailValidation.reason || "Please enter a valid personal or university email address.",
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const result = await signInWithPassword(trimmedEmail, password);
    setIsLoading(false);

    if (result.success) {
      if (rememberMe) {
        saveAccountProfile(trimmedEmail);
        setSavedAccount(getStoredSavedAccount());
      } else {
        removeStoredAccountProfile();
        setSavedAccount(null);
      }
      setStatusMessage({ type: "success", text: result.message });
      setTimeout(() => {
        onAuthSuccess(trimmedEmail);
      }, 400);
    } else {
      if (result.isAccountNotFound) {
        const namePart = trimmedEmail.split("@")[0].replace(/[._\d-]+/g, " ").trim();
        const suggestedName = namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : "";

        setStatusMessage({
          type: "error",
          text: `No account found for "${trimmedEmail}". New to CampusCue?`,
          action: {
            label: "Create an Account / Sign Up",
            onClick: () => {
              setAuthMode("signup");
              setConfirmPassword(password);
              if (!fullName && suggestedName) {
                setFullName(suggestedName);
              }
              setStatusMessage({
                type: "info",
                text: "Switched to Sign Up. We've preserved your email and password—click Create Account to finish!",
              });
            },
          },
        });
      } else {
        setStatusMessage({ type: "error", text: result.message });
      }
    }
  };

  // 2. Sign Up / Register (Mode: "signup")
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatusMessage({ type: "error", text: "Please enter your college email address (e.g. jaisingh@soa.ac.in)." });
      return;
    }

    const emailValidation = validateRealEmail(trimmedEmail);
    if (!emailValidation.isValid) {
      setStatusMessage({
        type: "error",
        text: emailValidation.reason || "Please enter a valid personal or university email address.",
      });
      return;
    }

    if (!password || password.length < 8) {
      setStatusMessage({ type: "error", text: "Password must be at least 8 characters long." });
      return;
    }

    if (password !== confirmPassword) {
      setStatusMessage({ type: "error", text: "Passwords do not match. Please verify both fields." });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const result = await registerWithEmailAndPassword(trimmedEmail, password);
    setIsLoading(false);

    if (result.alreadyExists) {
      setStatusMessage({
        type: "error",
        text: `An account for "${trimmedEmail}" already exists! Welcome back.`,
        action: {
          label: "Sign In to Your Account",
          onClick: () => {
            setAuthMode("signin");
            setStatusMessage({
              type: "info",
              text: "Switched to Sign In. Your email and password are preserved—click Login to continue!",
            });
          },
        },
      });
      return;
    }

    if (result.success) {
      if (rememberMe) {
        saveAccountProfile(trimmedEmail, fullName.trim() || undefined);
        setSavedAccount(getStoredSavedAccount());
      }
      setStatusMessage({ type: "success", text: result.message });
      setTimeout(() => {
        onAuthSuccess(trimmedEmail);
      }, 400);
      return;
    }

    setStatusMessage({ type: "error", text: result.message });
  };

  // 3. Welcome Back Password Login (Mode: "welcome")
  const handleWelcomePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savedAccount?.email || !password) {
      setStatusMessage({ type: "error", text: "Please enter your password to continue." });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const result = await signInWithPassword(savedAccount.email, password);
    setIsLoading(false);

    if (result.success) {
      saveAccountProfile(savedAccount.email, savedAccount.name, savedAccount.avatarId);
      setStatusMessage({ type: "success", text: result.message });
      setTimeout(() => {
        onAuthSuccess(savedAccount.email);
      }, 400);
    } else {
      setStatusMessage({ type: "error", text: result.message });
    }
  };

  // 4. Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    const result = await signInWithGoogle();
    setIsLoading(false);

    if (!result.success) {
      setStatusMessage({
        type: "error",
        text: result.isProviderDisabled
          ? "Google OAuth provider is not yet activated in your Supabase Auth Dashboard (Authentication → Providers → Google). You can sign in or register with your college email & password."
          : result.message,
      });
    }
  };

  // 5. Forgot Password
  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatusMessage({ type: "error", text: "Please enter your college email address above to reset password." });
      return;
    }

    const emailValidation = validateRealEmail(trimmedEmail);
    if (!emailValidation.isValid) {
      setStatusMessage({
        type: "error",
        text: emailValidation.reason || "Please enter a valid email address.",
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    const res = await sendPasswordResetOtp(trimmedEmail);
    setIsLoading(false);
    setStatusMessage({ type: res.success ? "success" : "error", text: res.message });
  };

  // Instagram-style "Not you? Log in with a different account"
  const handleSwitchToDifferentAccount = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAuthMode("signin");
    setStatusMessage(null);
  };

  // Instagram-style "Need an account? Sign up"
  const handleSwitchToSignUp = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAuthMode("signup");
    setStatusMessage(null);
  };

  // Remove saved account from this device (for public/library computers)
  const handleRemoveSavedAccount = () => {
    removeStoredAccountProfile();
    setSavedAccount(null);
    setEmail("");
    setPassword("");
    setAuthMode("signin");
    setStatusMessage(null);
  };

  return (
    <div className="login-page-backdrop" role="main">
      {/* Centered Dual-Panel Template Card */}
      <div className="login-split-card">
        {/* ======================================================== */}
        {/* LEFT PANEL: High Taste Vector Illustration & Hero Copy   */}
        {/* ======================================================== */}
        <LoginIllustration
          headline="Good food. Smarter choices."
          subhead="Find what fits your cravings, budget and time."
        />

        {/* ======================================================== */}
        {/* RIGHT PANEL: Modern Clean Form                           */}
        {/* ======================================================== */}
        <div className="login-form-panel">
          {/* Modal Close Button (if opened as modal inside chat app) */}
          {onClose && (
            <button
              type="button"
              className="login-modal-close-btn"
              onClick={onClose}
              title="Close and return to app"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}

          <div>
            {/* Top Logo & Header */}
            <div className="login-form-header">
              {/* Modern geometric 4-axis logo mark from Template */}
              <div className="login-logo-mark" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                  <line x1="17" y1="4" x2="17" y2="30" stroke="#5e1e38" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="4" y1="17" x2="30" y2="17" stroke="#5e1e38" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="11" cy="11" r="2.2" fill="#5e1e38" />
                  <circle cx="23" cy="11" r="2.2" fill="#5e1e38" />
                  <circle cx="11" cy="23" r="2.2" fill="#5e1e38" />
                  <circle cx="23" cy="23" r="2.2" fill="#5e1e38" />
                </svg>
              </div>

              {/* TWO-WAY MODE TABS: Sign In & Sign Up ONLY (Shown for signin and signup modes) */}
              {(authMode === "signin" || authMode === "signup") && (
                <>
                  <div className="login-tab-pill-group" role="tablist" aria-label="Authentication Options">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authMode === "signin"}
                      className={`login-tab-pill ${authMode === "signin" ? "active" : ""}`}
                      onClick={() => {
                        setAuthMode("signin");
                        setStatusMessage(null);
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authMode === "signup"}
                      className={`login-tab-pill ${authMode === "signup" ? "active" : ""}`}
                      onClick={() => {
                        setAuthMode("signup");
                        setStatusMessage(null);
                      }}
                    >
                      Sign Up
                    </button>
                  </div>

                  {/* If user has a saved account on this device, offer quick return banner */}
                  {savedAccount && (
                    <div className="login-switch-back-banner">
                      <button
                        type="button"
                        className="login-switch-back-btn"
                        onClick={() => {
                          setAuthMode("welcome");
                          setStatusMessage(null);
                        }}
                      >
                        <AvatarGraphic avatarId={savedAccount.avatarId || "samosa-monkey"} size={18} />
                        <span>Continue as <strong>{savedAccount.name}</strong> ({savedAccount.email}) →</span>
                      </button>
                    </div>
                  )}

                  {authMode === "signin" && (
                    <>
                      <h1 className="login-title">Login to your Account</h1>
                      <p className="login-subtitle">See what is going on with your canteens</p>
                    </>
                  )}

                  {authMode === "signup" && (
                    <>
                      <h1 className="login-title">Create an Account</h1>
                      <p className="login-subtitle">Start for free and join your campus dining community</p>
                    </>
                  )}
                </>
              )}

              {/* WELCOME BACK HEADLINE: Only shown in "welcome" mode */}
              {authMode === "welcome" && (
                <>
                  <h1 className="login-title">Welcome back, {savedAccount?.name || "Student"}</h1>
                  <p className="login-subtitle">Instant 1-click continuation for returning students</p>
                </>
              )}
            </div>

            {/* Feedback Status Message */}
            {statusMessage && (
              <div
                className={`login-status-banner ${statusMessage.type}`}
                role="alert"
              >
                <div className="login-status-banner-content">
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 size={16} className="login-status-icon success" />
                  ) : statusMessage.type === "info" ? (
                    <CheckCircle2 size={16} className="login-status-icon info" />
                  ) : (
                    <AlertCircle size={16} className="login-status-icon error" />
                  )}
                  <span className="login-status-text">{statusMessage.text}</span>
                </div>
                {statusMessage.action && (
                  <button
                    type="button"
                    onClick={statusMessage.action.onClick}
                    className="login-status-action-btn"
                  >
                    <span>{statusMessage.action.label}</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* MODE 1: SIGN IN FORM (Matches Template Right Panel)     */}
            {/* ======================================================== */}
            {authMode === "signin" && (
              <>
                {/* Google Sign In Button */}
                <button
                  type="button"
                  className="login-google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="login-divider">
                  <span>or sign in with email</span>
                </div>

                <form onSubmit={handleSignIn}>
                  {/* Email */}
                  <div className="login-input-group">
                    <label className="login-label">Email</label>
                    <div className="login-input-wrap">
                      <input
                        type="email"
                        className="login-input"
                        placeholder="jaisingh004@outlook.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="login-input-group">
                    <label className="login-label">Password</label>
                    <div className="login-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="login-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="login-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password Row */}
                  <div className="login-options-row">
                    <label className="login-remember">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Remember Me</span>
                    </label>
                    <button
                      type="button"
                      className="login-forgot-link"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    className="login-submit-btn"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? "Signing in..." : "Login"}</span>
                  </button>
                </form>

                {/* Switcher to Sign Up */}
                <div className="login-bottom-prompt">
                  <span>Not Registered Yet? </span>
                  <button
                    type="button"
                    className="login-bottom-link"
                    onClick={() => {
                      setAuthMode("signup");
                      setStatusMessage(null);
                    }}
                  >
                    Create an account
                  </button>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* MODE 2: SIGN UP FORM                                     */}
            {/* ======================================================== */}
            {authMode === "signup" && (
              <>
                {/* Google Sign In Button */}
                <button
                  type="button"
                  className="login-google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="login-divider">
                  <span>or register with email</span>
                </div>

                <form onSubmit={handleSignUp}>
                  {/* Full Name */}
                  <div className="login-input-group">
                    <label className="login-label">Full Name</label>
                    <div className="login-input-wrap">
                      <input
                        type="text"
                        className="login-input"
                        placeholder="e.g. Jai Singh"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* College Email */}
                  <div className="login-input-group">
                    <label className="login-label">College Email</label>
                    <div className="login-input-wrap">
                      <input
                        type="email"
                        className="login-input"
                        placeholder="jaisingh@soa.ac.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    {email.trim().length > 0 && (() => {
                      const cat = getEmailCategory(email);
                      if (cat.type === "empty") return null;
                      const isPositive = cat.type === "soa" || cat.type === "university" || cat.type === "standard";
                      return (
                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "11px",
                            color: isPositive ? "#059669" : "#dc2626",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>{cat.label}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Password */}
                  <div className="login-input-group">
                    <label className="login-label">Password (min 8 characters)</label>
                    <div className="login-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="login-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="login-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="login-input-group">
                    <label className="login-label">Confirm Password</label>
                    <div className="login-input-wrap">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="login-input"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="login-eye-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="login-options-row">
                    <label className="login-remember">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Remember Me</span>
                    </label>
                  </div>

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    className="login-submit-btn"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
                  </button>
                </form>

                {/* Switcher */}
                <div className="login-bottom-prompt">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    className="login-bottom-link"
                    onClick={() => {
                      setAuthMode("signin");
                      setStatusMessage(null);
                    }}
                  >
                    Sign in
                  </button>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* MODE 3: WELCOME BACK (Ref: Instagram-Style 1-Click Login) */}
            {/* ======================================================== */}
            {authMode === "welcome" && savedAccount && (
              <div className="login-welcome-box">
                {/* Profile Avatar with vibrant ring and active status dot */}
                <div className="login-welcome-avatar-wrap">
                  <div className="login-welcome-avatar">
                    <AvatarGraphic
                      avatarId={savedAccount.avatarId || "samosa-monkey"}
                      size={76}
                    />
                  </div>
                  <div className="login-welcome-online-dot" title="Ready to connect" />
                </div>

                {/* Email Chip */}
                <div className="login-welcome-email-chip">
                  <span>{savedAccount.email}</span>
                </div>

                {/* Prominent Actions */}
                <div className="login-welcome-actions">
                  {/* Google Sign In Option */}
                  <button
                    type="button"
                    className="login-google-btn"
                    style={{
                      padding: "11px 20px",
                      borderRadius: "999px",
                      fontWeight: 600,
                      borderColor: "#d1d5db",
                    }}
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Inline Quick Password Authentication */}
                  <form onSubmit={handleWelcomePasswordSubmit} style={{ width: "100%", marginTop: "2px" }}>
                    <div className="login-input-wrap" style={{ marginBottom: "10px" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="login-input"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                        style={{ borderRadius: "999px", padding: "10px 40px 10px 18px" }}
                      />
                      <button
                        type="button"
                        className="login-eye-btn"
                        style={{ right: "14px" }}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="login-submit-btn"
                      style={{ borderRadius: "999px" }}
                      disabled={isLoading || !password.trim()}
                    >
                      <span>{isLoading ? "Signing in..." : `Sign in with Password →`}</span>
                    </button>
                  </form>
                </div>

                {/* Instagram-Style Navigation Switchers */}
                <div className="login-welcome-links">
                  <div>
                    <span>Not you? </span>
                    <button
                      type="button"
                      className="login-bottom-link font-semibold"
                      onClick={handleSwitchToDifferentAccount}
                    >
                      Log in with a different account
                    </button>
                  </div>
                  <div>
                    <span>Need an account? </span>
                    <button
                      type="button"
                      className="login-bottom-link font-semibold"
                      onClick={handleSwitchToSignUp}
                    >
                      Sign up
                    </button>
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <button
                      type="button"
                      className="login-forget-link"
                      onClick={handleRemoveSavedAccount}
                      title="Clear saved account from this browser"
                    >
                      Remove saved account from this device
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Guest Mode Option: Accessible in all views */}
          <div style={{ marginTop: "16px", width: "100%", textAlign: "center" }}>
            <button
              type="button"
              className="login-guest-btn"
              onClick={handleGuestEntry}
            >
              Continue as Guest (No account needed)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
