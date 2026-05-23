

async function loadComponent(id, file) {

    const res = await fetch(file);

    const html = await res.text();

    document.getElementById(id).innerHTML = html;

    if (id === "header") {

        setActiveNav();

        // 👇 LOAD AUTH NAV AFTER HEADER EXISTS
        import("./auth-navbar.js");
    }
}

function setActiveNav() {

    const links = document.querySelectorAll(".nav-link");

    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    links.forEach(link => {

        const href = link.getAttribute("href");

        if (href === currentPage) {
            link.classList.add("active");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {

    loadComponent("header", "/components/header.html");

    loadComponent("footer", "/components/footer.html");

});



document.addEventListener("click", async (e) => {

    if (e.target.id === "get-api-key-btn" || e.target.id === "get-api-key" || e.target.id === "start-building") {

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
                    ? "/dashboard.html"
                    : "/components/signup.html";

        });
    }

});
