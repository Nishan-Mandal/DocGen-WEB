// login.js

import { auth, googleProvider } from "./firebase.js";
import { createUserDocument } from "./user-service.js";
import { showToast } from "./util.js";
import { ROUTES } from "../routes.js";

function applyRoutes() {
  document.querySelectorAll("[data-route]").forEach((el) => {
    const routeKey = el.dataset.route;
    if (routeKey && ROUTES[routeKey]) {
      el.href = ROUTES[routeKey];
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyRoutes);
} else {
  applyRoutes();
}


import {
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ---------------- GOOGLE LOGIN ----------------

const googleBtn = document.getElementById("google-social-btn");

googleBtn?.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    showLoader();

    try {
      await createUserDocument(result.user.displayName || result.user.email?.split("@")[0] || "User");
    } catch (docErr) {
      console.warn("User document sync note:", docErr);
    }

    console.log("Google Login Success:", result.user);

    window.location.href = ROUTES.dashboard;

  } catch (error) {
    hideLoader();
    console.error("Google Login Error:", error);
    showToast(
      getErrorMessage(error),
      "error"
    );
  }
});


// ---------------- EMAIL LOGIN ----------------

const loginForm = document.getElementById("login-form");

loginForm?.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    showLoader();

    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    await createUserDocument(result.user.displayName);

    console.log("Login Success:", result.user);

    hideLoader();

    window.location.href = ROUTES.dashboard;

  } catch (error) {
    console.error(error.message);
    hideLoader();

    showToast(
      getErrorMessage(error),
      "error"
    );
  }

});



// ---------------- LOADER ----------------

function showLoader() {

  document
    .getElementById("login-loader")
    ?.classList.remove("hidden");

  document
    .querySelectorAll("button,input")
    .forEach(el => el.disabled = true);

}

function hideLoader() {

  document
    .getElementById("login-loader")
    ?.classList.add("hidden");

  document
    .querySelectorAll("button,input")
    .forEach(el => el.disabled = false);

}


// ---------------- PASSWORD TOGGLE ----------------

const passwordInput =
document.getElementById(
    "password"
);

const toggleBtn =
document.getElementById(
    "toggle-password-btn"
);

const icon =
toggleBtn?.querySelector(
    ".material-symbols-outlined"
);

toggleBtn?.addEventListener(
    "click",
    () => {

        const hidden =
            passwordInput.type ===
            "password";

        passwordInput.type =
            hidden
                ? "text"
                : "password";

        if (icon) {

            icon.textContent =
                hidden
                    ? "visibility_off"
                    : "visibility";

        }

    }
);


// ---------------- FORGOT PASSWORD ----------------

const forgotPasswordLink =
  document.getElementById("forgot-password-link");

forgotPasswordLink?.addEventListener("click", async (e) => {

  e.preventDefault();

  const email =
    document.getElementById("email").value.trim();

  if (!email) {

    showToast(
      "Please enter your email address first.",
      "warning"
    );

    return;

  }

  try {

    showLoader();

    await sendPasswordResetEmail(auth, email);

    hideLoader();

    showToast(
      "A password reset link has been sent to your email.",
      "success"
    );

  } catch (error) {

    hideLoader();

    console.error(error);

    showToast(
      getErrorMessage(error),
      "error"
    );

  }

});

function getErrorMessage(error) {
  if (!error) return "An unexpected error occurred.";
  if (error.code === "auth/unauthorized-domain") {
    return "Domain not authorized. If testing locally, open http://localhost:5500 instead of 127.0.0.1, or add 127.0.0.1 to Firebase Console > Authentication > Settings > Authorized domains.";
  }
  if (error.code === "auth/popup-blocked") {
    return "Sign-in popup was blocked by your browser. Please allow popups for this site.";
  }
  if (error.code === "auth/popup-closed-by-user") {
    return "Sign-in popup was closed before completing.";
  }
  if (error.code === "auth/cancelled-popup-request") {
    return "Sign-in request was cancelled.";
  }
  return error.message
    ?.replace(/^Firebase:\s*/i, "")
    .trim() || "An unexpected error occurred.";
}