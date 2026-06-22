//signup.js

import { auth, googleProvider } from "./firebase.js";
import { createUserDocument } from "./user-service.js";
import { showToast } from "./util.js";


import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ---------------- GOOGLE SIGNUP ----------------

const googleBtn = document.getElementById("google-social-btn");

googleBtn?.addEventListener("click", async () => {

  try {

    showLoader();

    const result =
      await signInWithPopup(auth, googleProvider);

    await createUserDocument(result.user);

    window.location.href = "/dashboard.html";

  } catch (error) {

    hideLoader();

    console.error(error);

    console.log('-------------')

    showToast(
      error.message,
      "error"
    );

  }

});


// ---------------- EMAIL SIGNUP ----------------

const signupForm = document.getElementById("signup-form");

signupForm?.addEventListener("submit", async (e) => {

  e.preventDefault();

  try {

    showLoader();

    const name =
      document.getElementById("name").value;

    const email =
      document.getElementById("email").value;

    const password =
      document.getElementById("password").value;

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await updateProfile(
      result.user,
      {
        displayName: name
      }
    );

    await createUserDocument({
      ...result.user,
      displayName: name
    });

    window.location.href =
      "/dashboard.html";

  } catch (error) {

    hideLoader();

    console.error(error);

    console.log('-------------')

    showToast(
      error.message,
      "error"
    );

  }

});


function showLoader() {

  document
    .getElementById("signup-loader")
    ?.classList.remove("hidden");

  document
    .querySelectorAll("button,input")
    .forEach(el => el.disabled = true);

}

function hideLoader() {

  document
    .getElementById("signup-loader")
    ?.classList.add("hidden");

  document
    .querySelectorAll("button,input")
    .forEach(el => el.disabled = false);

}

// ---------------- PASSWORD TOGGLE ----------------

const passwordInput =
  document.getElementById("password");

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

  });