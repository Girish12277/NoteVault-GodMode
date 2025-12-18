
import { CopyKey } from "../types/auth";

// God-Level Copy Lockdown (Rule 3 & 5)
// Immutable dictionary. 100% Coverage required.

export const AUTH_COPY: Record<CopyKey, string> = {
    // Errors
    ERR_NET: "We couldn’t connect. Check your internet and try again.",
    ERR_CRED: "The email or password you entered is incorrect.",
    ERR_LOCK: "Your account is temporarily locked for security reasons.",
    ERR_GOOGLE_FAIL: "Google sign-in failed. Please use email or try again.",
    ERR_PHONE_INVALID: "Please enter a valid 10-digit mobile number.",
    ERR_OTP_INVALID: "That code looks incorrect. Please try again.",

    // Warnings
    WARN_CAPS: "Caps Lock is on.",
    WARN_TYPO: "Did you mean @gmail.com?",

    // Info
    INFO_SECURE_FOOTER: "Your login information is encrypted and never shared.",
    INFO_GOOGLE_RECOMMENDED: "Recommended for faster and more secure sign-in.",

    // Timeouts
    TIME_VAL: "Validating is taking longer than usual.",
    TIME_SUB_EMAIL: "Signing in is taking too long. Check your connection.",
    TIME_SUB_GOOGLE: "Google is taking a while to respond.",
    TIME_SUB_PASSWORD: "Password verification is slow. Please retry.",

    // Headers
    HDR_WELCOME: "Sign in to your NoteSnap account",
    HDR_SUB: "Access your notes, purchases, and saved progress securely.",

    // Labels
    LBL_EMAIL: "Email address",
    LBL_PHONE: "Mobile Number",
    LBL_PASS: "Password",

    // Buttons
    BTN_SIGN_IN: "Sign In",
    BTN_GET_OTP: "Get OTP",
    BTN_VERIFY: "Verify & Continue",
    BTN_FORGOT_PASS: "Forgot Password?",

    // Interactive Text
    TXT_NO_ACC: "Don't have an account?",
    TXT_SIGN_UP: "Sign up",
    TXT_HAS_ACC: "Already have an account?",
    TXT_LOGIN: "Log in",
    TXT_TERMS_PREFIX: "By signing up, you agree to our",
    LBL_TERMS: "Terms of Service",
    LBL_PRIVACY: "Privacy Policy",
};
