// login.js

import { auth, googleProvider } from "./firebase.js";
import { createUserDocument } from "./user-service.js";
import { showToast } from "./util.js";
import { ROUTES } from "../routes.js";


import {
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ---------------- GOOGLE LOGIN ----------------

const googleBtn = document.getElementById("google-social-btn");

googleBtn?.addEventListener("click", async () => {
  try {

    showLoader();

    const result = await signInWithPopup(auth, googleProvider);

    await createUserDocument(result.user.displayName);

    console.log("Google Login Success:", result.user);

    hideLoader();

    window.location.href = ROUTES.docs;

  } catch (error) {
    console.error(error.message);
    hideLoader();
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

    window.location.href = "/dashboard.html";

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
  return error.message
    ?.replace(/^Firebase:\s*/i, "")
    .trim();
}