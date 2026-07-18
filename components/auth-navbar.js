import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ===============================
// WAIT FOR AUTH SECTION
// ===============================
waitForAuthSection();

function waitForAuthSection() {

    const authSection = document.getElementById("auth-section");

    if (authSection) {

        initializeNavbar(authSection);

    } else {

        setTimeout(waitForAuthSection, 100);

    }

}


// ===============================
// NAVBAR
// ===============================
function initializeNavbar(authSection) {

    onAuthStateChanged(auth, (user) => {

        if (user) {

            authSection.innerHTML = `

            <button
                id="profile-btn"
                class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all">
            
                <div class="hidden md:flex flex-col items-end leading-tight">
            
                    <span class="text-sm font-semibold text-slate-800">
                        ${user.displayName || "User"}
                    </span>
            
                    <span class="text-xs text-slate-500">
                        ${user.email}
                    </span>
            
                </div>
            
                <img
                    src="${
                        user.photoURL ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.displayName || user.email
                        )}`
                    }"
                    alt="Profile"
                    class="w-9 h-9 rounded-full border border-slate-200 object-cover"
                />
            
            </button>
            
            `;

            document
                .getElementById("profile-btn")
                ?.addEventListener("click", () => {

                    window.location.href = "/dashboard.html";

                });

        } else {

            authSection.innerHTML = `

                <a href="components/login.html"
                    class="text-slate-600 text-sm font-medium hover:text-indigo-500">
                    Sign In
                </a>

                <a href="components/signup.html"
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                    Get Started
                </a>

            `;

        }

    });

}


// ===============================
// LOGOUT
// ===============================
const logoutBtn = document.getElementById("sidebar-logout-btn");

const logoutModal = document.getElementById("logout-modal");

const cancelLogoutBtn = document.getElementById("cancel-logout-btn");

const confirmLogoutBtn = document.getElementById("confirm-logout-btn");


logoutBtn?.addEventListener("click", () => {

    logoutModal.classList.remove("hidden");

    logoutModal.classList.add("flex");

});


cancelLogoutBtn?.addEventListener("click", () => {

    logoutModal.classList.add("hidden");

    logoutModal.classList.remove("flex");

});


confirmLogoutBtn?.addEventListener("click", async () => {

    try {

        await signOut(auth);

        window.location.href = "/index.html";

    } catch (error) {

        console.error(error);

    }

});