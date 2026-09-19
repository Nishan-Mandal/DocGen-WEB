import { ROUTES } from "../routes.js";

export { ROUTES };

export function applyRoutes(root = document) {
    if (!root) return;

    root.querySelectorAll("[data-route]").forEach((el) => {
        const routeKey = el.getAttribute("data-route");
        if (routeKey && ROUTES[routeKey]) {
            el.href = ROUTES[routeKey];
        }
    });

    // Backward-compatibility fallback for specific IDs if present
    const docsLink = document.getElementById("docsLink");
    if (docsLink && !docsLink.hasAttribute("data-route")) {
        docsLink.href = ROUTES.docs;
    }
    const pricingLink = document.getElementById("pricingLink");
    if (pricingLink && !pricingLink.hasAttribute("data-route")) {
        pricingLink.href = ROUTES.pricing;
    }
}

function normalizePath(path) {
    if (!path) return "";
    let clean = path.split("?")[0].split("#")[0];
    clean = clean.replace(/^\/+|\/+$/g, "");
    const segment = clean.split("/").pop() || "";
    const withoutExt = segment.replace(/\.html$/, "");
    if (withoutExt === "" || withoutExt === "index") {
        return "home";
    }
    return withoutExt;
}

function setActiveNav() {
    const currentNorm = normalizePath(window.location.pathname);

    // Target header navigation links specifically to prevent affecting sidebar tabs on other pages
    const headerNav = document.getElementById("header");
    const navLinks = headerNav
        ? headerNav.querySelectorAll(".nav-link")
        : document.querySelectorAll("nav .nav-link");

    navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        const routeKey = link.getAttribute("data-route");
        let linkNorm = "";
        if (routeKey) {
            linkNorm = routeKey === "home" ? "home" : normalizePath(ROUTES[routeKey] || href);
        } else if (href) {
            linkNorm = normalizePath(href);
        }

        if (currentNorm && linkNorm === currentNorm) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    const mobileLinks = headerNav
        ? headerNav.querySelectorAll(".mobile-nav-link")
        : document.querySelectorAll("#mobile-menu .mobile-nav-link");

    mobileLinks.forEach((link) => {
        const href = link.getAttribute("href");
        const routeKey = link.getAttribute("data-route");
        let linkNorm = "";
        if (routeKey) {
            linkNorm = routeKey === "home" ? "home" : normalizePath(ROUTES[routeKey] || href);
        } else if (href) {
            linkNorm = normalizePath(href);
        }

        if (currentNorm && linkNorm === currentNorm) {
            link.classList.add("text-[#712AE2]", "bg-purple-50", "dark:bg-slate-900", "font-semibold");
        } else {
            link.classList.remove("text-[#712AE2]", "bg-purple-50", "dark:bg-slate-900", "font-semibold");
        }
    });
}

function initMobileMenu(headerContainer) {
    if (!headerContainer) return;
    const btn = headerContainer.querySelector("#mobile-menu-btn");
    const menu = headerContainer.querySelector("#mobile-menu");
    const iconOpen = headerContainer.querySelector("#mobile-menu-icon-open");
    const iconClose = headerContainer.querySelector("#mobile-menu-icon-close");
    if (!btn || !menu) return;

    function toggleMenu(forceOpen) {
        const isCurrentlyOpen = !menu.classList.contains("hidden");
        const open = typeof forceOpen === "boolean" ? forceOpen : !isCurrentlyOpen;
        if (open) {
            menu.classList.remove("hidden");
            btn.setAttribute("aria-expanded", "true");
            if (iconOpen) iconOpen.classList.add("hidden");
            if (iconClose) iconClose.classList.remove("hidden");
        } else {
            menu.classList.add("hidden");
            btn.setAttribute("aria-expanded", "false");
            if (iconOpen) iconOpen.classList.remove("hidden");
            if (iconClose) iconClose.classList.add("hidden");
        }
    }

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    menu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            toggleMenu(false);
        });
    });

    document.addEventListener("click", (e) => {
        if (!headerContainer.contains(e.target)) {
            toggleMenu(false);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            toggleMenu(false);
        }
    });
}

async function loadComponent(id, file) {
    const container = document.getElementById(id);
    if (!container) return;

    try {
        const res = await fetch(file);
        if (!res.ok) return;
        const html = await res.text();
        container.innerHTML = html;

        applyRoutes(container);

        if (id === "header") {
            setActiveNav();
            initMobileMenu(container);
            // 👇 LOAD AUTH NAV AFTER HEADER EXISTS
            import("./auth-navbar.js");
        }
    } catch (error) {
        console.error(`Failed to load component ${id}:`, error);
    }
}

function initLayout() {
    applyRoutes(document);
    loadComponent("header", "/components/header.html");
    loadComponent("footer", "/components/footer.html");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLayout);
} else {
    initLayout();
}



document.addEventListener("click", async (e) => {

    if (e.target.id === "get-api-key-btn" 
        || e.target.id === "get-api-key" 
        || e.target.id === "start-building" 
        || e.target.id === "dashboard-tab" 
        || e.target.id === "freePlanBtn"
        ) {

        const { auth } = await import("./firebase.js");

        const {
            onAuthStateChanged
        } = await import(
            "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
        );

        const unsubscribe = onAuthStateChanged(auth, (user) => {

            unsubscribe();

            window.location.href =
                user
                    ? ROUTES.dashboard
                    : ROUTES.signup;

        });
    }

});
