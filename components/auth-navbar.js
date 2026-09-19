import { auth } from "./firebase.js";
import { ROUTES } from "../routes.js";

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

        const mobileAuth = document.getElementById("mobile-drawer-auth");

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
                    class="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200 object-cover"
                />
            
            </button>
            
            `;

            document
                .getElementById("profile-btn")
                ?.addEventListener("click", () => {

                    window.location.href = ROUTES.dashboard;

                });

            if (mobileAuth) {
                mobileAuth.innerHTML = `
                    <div class="px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center gap-3 mb-1">
                        <img
                            src="${
                                user.photoURL ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    user.displayName || user.email
                                )}`
                            }"
                            alt="Profile"
                            class="w-8 h-8 rounded-full border border-slate-200 object-cover"
                        />
                        <div class="flex flex-col text-left truncate">
                            <span class="text-sm font-semibold text-slate-800 dark:text-white">
                                ${user.displayName || "User"}
                            </span>
                            <span class="text-xs text-slate-500 truncate max-w-[180px]">
                                ${user.email}
                            </span>
                        </div>
                    </div>
                    <a href="${ROUTES.dashboard}" data-route="dashboard"
                        class="w-full text-center py-2.5 px-4 rounded-xl bg-[#712AE2] text-white text-sm font-semibold hover:opacity-90 transition-all">
                        Go to Dashboard
                    </a>
                `;
            }

        } else {

            authSection.innerHTML = `

                <a href="${ROUTES.login}" data-route="login"
                    class="hidden md:inline-flex text-slate-600 text-sm font-medium hover:text-indigo-500">
                    Sign In
                </a>

                <a href="${ROUTES.signup}" data-route="signup"
                    class="hidden md:inline-flex bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                    Get Started
                </a>

            `;

            if (mobileAuth) {
                mobileAuth.innerHTML = `
                    <a href="${ROUTES.login}" data-route="login" class="w-full text-center py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                        Sign In
                    </a>
                    <a href="${ROUTES.signup}" data-route="signup" class="w-full text-center py-2.5 px-4 rounded-xl bg-[#712AE2] text-white text-sm font-semibold hover:opacity-90 shadow-md shadow-[#712AE2]/20 transition-all">
                        Get Started Free
                    </a>
                `;
            }

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

        window.location.href = ROUTES.home;

    } catch (error) {

        console.error(error);

    }

});