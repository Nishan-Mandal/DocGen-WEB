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

    await createUserDocument(name);

    window.location.href =
      "/dashboard.html";

  } catch (error) {

    hideLoader();

    console.error(error);

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



  // ---------------- PASSWORD STRENGTH ----------------

const strengthBars = [
  document.getElementById("strength-bar-1"),
  document.getElementById("strength-bar-2"),
  document.getElementById("strength-bar-3"),
  document.getElementById("strength-bar-4")
];

const strengthText =
  document.getElementById("password-strength");

passwordInput?.addEventListener("input", () => {

  const password = passwordInput.value;

  let score = 0;

  // Minimum length
  if (password.length >= 8) score++;

  // Uppercase letter
  if (/[A-Z]/.test(password)) score++;

  // Number
  if (/[0-9]/.test(password)) score++;

  // Special character
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Reset bars
  strengthBars.forEach(bar => {

    bar.className =
      "h-1 flex-1 rounded-full bg-surface-variant";

  });

  let color = "";
  let label = "";

  switch (score) {

    case 0:
    case 1:
      color = "bg-error";
      label = "Too Weak";
      break;

    case 2:
      color = "bg-orange-500";
      label = "Weak";
      break;

    case 3:
      color = "bg-yellow-500";
      label = "Good";
      break;

    case 4:
      color = "bg-green-500";
      label = "Strong";
      break;

  }

  for (let i = 0; i < score; i++) {

    strengthBars[i].classList.remove("bg-surface-variant");
    strengthBars[i].classList.add(color);

  }

  strengthText.textContent =
    `Password strength: ${label}`;

});