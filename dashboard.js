import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    startAfter,
    serverTimestamp,
    writeBatch,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { auth, db } from "./components/firebase.js";

import { initializeTemplateUpload, initializeTemplateUpdate, loadTemplates } from "./components/templates.js";
import { showToast } from "./components/util.js";
import {
    loadTransactions
} from "./components/transactions.js";

const PAGE_SIZE = 5;

let jobsPage = 1;
let logsPage = 1;

let jobsCursors = [];
let logsCursors = [];


// ===============================
// HELPERS
// ===============================
function formatNumber(num = 0) {
    return Intl.NumberFormat().format(num);
}

function formatDate(dateValue) {
    if (!dateValue) return '—';

    let date;

    if (dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
    } else {
        date = new Date(dateValue);
    }

    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusBadge(status) {

    if (status === 'completed') {
        return `
            <span class="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-green-100 text-green-800 text-label-md font-semibold">
                <span class="material-symbols-outlined text-[16px]">check_circle</span>
                Success
            </span>
        `;
    }

    if (status === 'pending' || status === 'zipping') {
        return `
            <span class="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-amber-100 text-amber-800 text-label-md font-semibold">
                <span class="material-symbols-outlined text-[16px]">pending</span>
                Pending
            </span>
        `;
    }

    return `
        <span class="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-error-container text-on-error-container text-label-md font-semibold">
            <span class="material-symbols-outlined text-[16px]">error</span>
            Failed
        </span>
    `;
}

function getInitials(name = "") {

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}

function getAvatarColor(text) {

    const colors = [
        "#712AE2",
        "#2563EB",
        "#16A34A",
        "#EA580C",
        "#DB2777",
        "#0891B2",
        "#7C3AED",
        "#DC2626"
    ];

    let hash = 0;

    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}


// ===============================
// MAP USER DATA
// ===============================
async function loadUserDashboard(user) {

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();

    const usage = userData.usage || {};

    const limits = userData.limits || {};


    // ===============================
    // USER CARD
    // ===============================
    const avatar = document.getElementById("user-avatar");
    const userPhoto = document.getElementById("user-photo");
    const initials = document.getElementById("user-initials");

    const photo = userData.photo || user.photoURL;

    const name =
        userData.name ||
        user.displayName ||
        user.email ||
        "User";

    if (photo) {

        userPhoto.src = photo;

        userPhoto.classList.remove("hidden");
        initials.classList.add("hidden");

    } else {

        userPhoto.classList.add("hidden");
        initials.classList.remove("hidden");

        initials.textContent = getInitials(name);

        avatar.style.backgroundColor = getAvatarColor(name);
    }

    document.querySelector('h3.font-h3.text-h3').textContent = userData.name || 'User';

    document.querySelector('.text-on-surface-variant.font-body-md').textContent =
        userData.email || user.email;

    document.querySelector('.bg-secondary-fixed').textContent =
        (userData.subscription?.plan || 'Free').toUpperCase();

    const joinedDateEl = document.getElementById('joined-date');
    const documentsGeneratedEl = document.getElementById('documents-generated');

    if (userData.createdAt?.seconds) {

        const joinedDate = new Date(userData.createdAt.seconds * 1000);

        joinedDateEl.textContent = joinedDate.toLocaleDateString('en-IN', {
            month: 'short',
            year: 'numeric'
        });

    }

    documentsGeneratedEl.textContent =
        formatNumber(usage.pdf.total + usage.docx.total || 0);


    // ===============================
    // PLAN SECTION
    // ===============================

    document.getElementById("current-plan").textContent =
        `${(userData.subscription?.plan || "FREE")
            .charAt(0)
            .toUpperCase()}${(userData.subscription?.plan || "FREE")
                .slice(1)
                .toLowerCase()} Tier`;

    const totalLimit = limits.total || 0;
    const limitUsed = usage.billingCycle || 0;

    document.querySelector('.flex.justify-between.text-label-md span:last-child').textContent =
        `${formatNumber(limitUsed)} / ${formatNumber(totalLimit)} docs`;

    const percentage = totalLimit > 0
        ? Math.min((limitUsed / totalLimit) * 100, 100)
        : 0;

    document.querySelector('.bg-secondary.h-full.rounded-full').style.width =
        `${percentage}%`;

    const remaining = Math.max(totalLimit - limitUsed, 0);

    document.querySelector('.space-y-sm p.text-body-sm').textContent =
        `${remaining} documents remaining.`;


    // ===============================
    // USAGE OVERVIEW CARDS
    // ===============================
    const overviewNumbers =
        document.querySelectorAll('.font-h2.text-h2.font-bold');


    // 0 → API Calls
    overviewNumbers[0].textContent =
        formatNumber(usage.pdf?.total + usage.docx?.total || 0);

    // 1 → PDF
    overviewNumbers[1].textContent =
        formatNumber(usage.pdf?.total || 0);

    // 2 → DOCX
    overviewNumbers[2].textContent =
        formatNumber(usage.docx?.total || 0);

    // 3 → Template Analysis
    overviewNumbers[3].textContent =
        formatNumber(usage.templateAnalysis?.total || 0);


    // ===============================
    // TODAY LABELS
    // ===============================
    const todayLabels =
        document.querySelectorAll(
            '.text-body-sm.text-on-surface-variant.mt-xs'
        );


    // 0 → API Calls Today
    todayLabels[0].innerHTML =
        `Today: <span class="font-semibold text-primary">
            ${formatNumber(usage.today || 0)}
        </span>`;


    // 1 → PDF Today
    todayLabels[1].innerHTML =
        `Today: <span class="font-semibold text-primary">
            ${formatNumber(usage.pdf?.today || 0)}
        </span>`;


    // 2 → DOCX Today
    todayLabels[2].innerHTML =
        `Today: <span class="font-semibold text-primary">
            ${formatNumber(usage.docx?.today || 0)}
        </span>`;


    // 3 → Template Analysis Today 
    todayLabels[3].innerHTML =
        `Today: <span class="font-semibold text-primary">
            ${formatNumber(usage.templateAnalysis?.today || 0)}
        </span>`;


    hideLoader();

    // ===============================
    // API KEYS TABLE
    // ===============================
    await loadApiKeys(user.uid);


    // ===============================
    // RECENT JOBS TABLE
    // ===============================
    await loadRecentJobs(user.uid);

    // ===============================
    // LOGS TABLE
    // ===============================
    await loadLogs(user.uid);

    setupApiModal(
        user.uid
    );

    document
        .getElementById(
            'jobs-next'
        )
        .onclick =
        async () => {

            jobsPage++;

            await loadRecentJobs(
                user.uid,
                'next'
            );

        };

    document
        .getElementById(
            'jobs-prev'
        )
        .onclick =
        async () => {

            if (
                jobsPage === 1
            )
                return;

            jobsPage--;

            await loadRecentJobs(
                user.uid,
                'prev'
            );

        };


    // INITIAL LOAD
    await loadLogs(
        user.uid,
        'first'
    );


    // NEXT
    document
        .getElementById(
            'logs-next'
        )
        .onclick =
        async () => {

            logsPage++;

            await loadLogs(
                user.uid,
                'next'
            );

        };


    // PREVIOUS
    document
        .getElementById(
            'logs-prev'
        )
        .onclick =
        async () => {

            if (
                logsPage === 1
            )
                return;

            logsPage--;

            await loadLogs(
                user.uid,
                'prev'
            );

        };

}


// ===============================
// API KEYS
// ===============================
async function loadApiKeys(userId) {

    const tbody = document.querySelectorAll('tbody')[0];

    const apiKeysRef = query(
        collection(db, "apiKeys"),
        where("userId", "==", userId),
        where("status", "!=", "deleted")
    );

    const apiKeysSnap = await getDocs(apiKeysRef);

    tbody.innerHTML = '';

    apiKeysSnap.forEach((docSnap) => {

        const data = docSnap.data();

        const row = `
            <tr class="hover:bg-surface-container-lowest transition-colors">

                <td class="px-lg py-md">
                    <div class="flex flex-col">
                        <span class="font-semibold">${data.name || 'Unnamed Key'}</span>
                        <span class="font-code text-body-sm text-on-surface-variant">
                            ${docSnap.id.slice(0, 12)}...
                        </span>
                    </div>
                </td>

                <td class="px-lg py-md font-body-md">
                    ${formatNumber(data.usage.total || 0)}
                </td>

                <td class="px-lg py-md font-body-md">
                    ${formatNumber(data.usage.today || 0)}
                </td>

                 <td class="px-lg py-md font-body-md">
                    ${formatNumber(data.usage.pdf.total || 0)}
                </td>

                 <td class="px-lg py-md font-body-md">
                    ${formatNumber(data.usage.docx.total || 0)}
                </td>

                <td class="px-lg py-md font-body-md">
                    ${formatNumber(data.usage.templateAnalysis.total || 0)}
                </td>
                

                <td class="px-lg py-md">
                    ${data.status === 'active'
                ? `
                            <span class="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-secondary-container/10 text-secondary text-label-md font-semibold">
                                <span class="w-2 h-2 rounded-full bg-secondary"></span>
                                Active
                            </span>
                        `
                : `
                            <span class="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-surface-container-highest text-on-surface-variant text-label-md font-semibold">
                                <span class="w-2 h-2 rounded-full bg-outline"></span>
                                Disabled
                            </span>
                        `
            }
                </td>

                <td class="px-lg py-md">
                    <div class="relative flex items-center gap-2">

                        <!-- Copy -->
                        <button
                            class="copy-btn bg-surface-container-high p-sm rounded-lg hover:bg-outline-variant/30"
                            data-key="${docSnap.id}">

                            <span class="material-symbols-outlined text-[18px]">
                                content_copy
                            </span>

                        </button>

                        <!-- Three dots -->
                        <button
                            class="menu-toggle bg-surface-container-high p-sm rounded-lg hover:bg-outline-variant/30"
                            data-key="${docSnap.id}">

                            <span class="material-symbols-outlined text-[18px]">
                                more_vert
                            </span>

                        </button>

                        <!-- Menu -->
                        <div
                            class="menu hidden absolute right-0 top-12 w-44 rounded-xl border bg-white shadow-xl z-[999]">

                            ${data.status === 'disabled'
                ? `
                                    <button
                                        class="enable-key w-full px-4 py-3 text-left hover:bg-surface-container"
                                        data-key="${docSnap.id}">

                                        Enable

                                    </button>
                                `
                : `
                                    <button
                                        class="disable-key w-full px-4 py-3 text-left hover:bg-surface-container"
                                        data-key="${docSnap.id}">

                                        Disable

                                    </button>
                                `
            }

                            <button
                                class="delete-key w-full px-4 py-3 text-left text-red-500 hover:bg-red-50"
                                data-key="${docSnap.id}">

                                Delete

                            </button>

                        </div>

                    </div>
                </td>

            </tr>
        `;

        tbody.innerHTML += row;
    });


    document.querySelectorAll('.copy-btn').forEach(btn => {

        btn.addEventListener(
            'click',
            async () => {

                try {

                    await navigator
                        .clipboard
                        .writeText(
                            btn.dataset.key
                        );

                    showToast(
                        'API key copied',
                        'success'
                    );

                }

                catch {

                    showToast(
                        'Failed to copy API key',
                        'error'
                    );

                }

            }
        );

    });
}


// ===============================
// RECENT JOBS
// ===============================
async function loadRecentJobs(
    userId,
    direction = 'next'
) {

    const tbody =
        document.querySelectorAll('tbody')[1];

    const constraints = [

        where(
            'userId',
            '==',
            userId
        ),

        orderBy(
            'createdAt',
            'desc'
        ),

        limit(PAGE_SIZE)

    ];

    if (
        direction === 'next'
        &&
        jobsPage > 1
    ) {

        constraints.push(
            startAfter(
                jobsCursors[
                jobsPage - 2
                ]
            )
        );

    }

    if (
        direction === 'prev'
        &&
        jobsPage > 1
    ) {

        constraints.push(
            startAfter(
                jobsCursors[
                jobsPage - 2
                ]
            )
        );

    }

    const snap =
        await getDocs(
            query(
                collection(
                    db,
                    'jobs'
                ),
                ...constraints
            )
        );

    tbody.innerHTML = '';

    if (snap.empty) {

        if (direction === "next") {
            jobsPage--;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-lg py-12 text-center text-on-surface-variant">
                    <div class="flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-[42px] text-outline">
                            work_history
                        </span>
                        <p class="font-semibold">No Jobs Found</p>
                        <p class="text-sm">
                            Your generated documents will appear here.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        document.getElementById("jobs-page").textContent = `Page ${jobsPage}`;
        document.getElementById("jobs-prev").disabled = jobsPage === 1;

        return;
    }

    snap.forEach((doc) => {

        const data =
            doc.data();

        tbody.innerHTML += `
            <tr>
                <td class="px-lg py-md">${doc.id}</td>
                <td class="px-lg py-md">
                    ${getStatusBadge(data.status)}
                </td>
                <td class="px-lg py-md">
                    ${data.document_format}
                </td>
                <td class="px-lg py-md">
                    ${formatNumber(data.total_records)}
                </td>
                <td class="px-lg py-md">
                    ${formatDate(data.createdAt)}
                </td>
                <td class="px-lg py-md">
                    ${formatDate(data.completedAt)}
                </td>
            </tr>
        `;
    });

    if (
        snap.docs.length
    ) {

        jobsCursors[
            jobsPage - 1
        ] =
            snap.docs[
            snap.docs.length - 1
            ];

    }

    document
        .getElementById(
            'jobs-page'
        )
        .textContent =
        `Page ${jobsPage}`;

    document
        .getElementById(
            'jobs-prev'
        )
        .disabled =
        jobsPage === 1;
}


// ===============================
// LOGS
// ===============================
async function loadLogs(
    userId,
    direction = 'next'
) {

    const tbody =
        document.getElementById(
            'logs-table'
        );

    const constraints = [

        where(
            'userId',
            '==',
            userId
        ),

        orderBy(
            'timestamp',
            'desc'
        ),

        limit(PAGE_SIZE)

    ];


    // NEXT / PREVIOUS
    if (
        direction !== 'first'
        &&
        logsPage > 1
    ) {

        constraints.push(

            startAfter(

                logsCursors[
                logsPage - 2
                ]

            )

        );

    }


    const logsQuery =
        query(
            collection(
                db,
                'logs'
            ),
            ...constraints
        );

    const snap =
        await getDocs(
            logsQuery
        );

    tbody.innerHTML = '';

    if (snap.empty) {

        if (direction === "next") {
            logsPage--;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-lg py-12 text-center text-on-surface-variant">
                    <div class="flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-[42px] text-outline">
                            receipt_long
                        </span>
                        <p class="font-semibold">No Activity Logs Found</p>
                        <p class="text-sm">
                            Your API activity will appear here.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        document.getElementById("logs-page").textContent = `Page ${logsPage}`;
        document.getElementById("logs-prev").disabled = logsPage === 1;

        return;
    }


    snap.forEach((docSnap) => {

        const data =
            docSnap.data();


        const badge =
            data.status === 'success'

                ? `
                    <span
                        class="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-green-100 text-green-800 text-label-md">

                        Success

                    </span>
                `

                : `

                    <span
                        class="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-red-100 text-red-700 text-label-md">

                        Failed

                    </span>

                `;


        tbody.innerHTML += `

        <tr
            class="hover:bg-surface-container-lowest">

            <td class="px-lg py-md">

                ${badge}

            </td>

            <td class="px-lg py-md">

                ${data.feature || '—'}

            </td>

            <td
                class="px-lg py-md font-code text-body-sm">

                ${(data.apiKey || '-')
                .slice(0, 12)}...

            </td>

            <td class="px-lg py-md">

                ${formatNumber(
                    data.recordCount || 0
                )}

            </td>

            <td class="px-lg py-md">
                <div class="max-w-[300px] overflow-x-auto whitespace-nowrap">
                    ${data.error || 'Completed'}
                </div>
            </td>


            <td
                class="px-lg py-md text-on-surface-variant">

                ${formatDate(
                    data.timestamp
                )}

            </td>

        </tr>

        `;

    });


    // SAVE CURSOR
    logsCursors[
        logsPage - 1
    ] =
        snap.docs[
        snap.docs.length - 1
        ];


    // PAGE LABEL
    document
        .getElementById(
            'logs-page'
        )
        .textContent =
        `Page ${logsPage}`;


    // PREV BUTTON
    document
        .getElementById(
            'logs-prev'
        )
        .disabled =
        logsPage === 1;

}

// ===============================
// LOADER
// ===============================
function showLoader() {

    document
        .getElementById(
            'dashboard-loader'
        )
        ?.classList
        .remove(
            'hidden'
        );

}


function hideLoader() {

    document
        .getElementById(
            'dashboard-loader'
        )
        ?.classList
        .add(
            'hidden'
        );

    document
        .getElementById(
            'dashboard-content'
        )
        ?.classList
        .remove(
            'hidden'
        );

}


// ===============================
// AUTH
// ===============================
onAuthStateChanged(
    auth,
    async (user) => {

        showLoader();

        try {

            if (!user) {

                window.location.replace("/components/signup.html");

                return;

            }

            await loadUserDashboard(
                user
            );

        }

        finally {

            hideLoader();

        }

    }
);



// ===============================
// API KEY GENERATION
// ===============================
function setupApiModal(
    userId
) {

    const modal =
        document.getElementById(
            'api-key-modal'
        );

    document
        .getElementById(
            'generate-api-btn'
        )
        ?.addEventListener(
            'click',
            () => {

                modal.classList.remove(
                    'hidden'
                );

                modal.classList.add(
                    'flex'
                );

            }
        );



    document
        .getElementById(
            'cancel-api-key'
        )
        ?.addEventListener(
            'click',
            () => {

                modal.classList.add(
                    'hidden'
                );

                modal.classList.remove(
                    'flex'
                );

            }
        );



    document
        .getElementById(
            'confirm-api-key'
        )
        ?.addEventListener(
            'click',
            async () => {

                const btn =
                    document.getElementById(
                        'confirm-api-key'
                    );

                const loader =
                    document.getElementById(
                        'generate-loader'
                    );

                const text =
                    document.getElementById(
                        'generate-text'
                    );

                const input =
                    document.getElementById(
                        'api-key-name'
                    );


                const name =
                    input.value.trim();

                if (!name) {

                    showToast(
                        'Please enter API key name',
                        'warning'
                    );

                    return;

                }

                try {

                    // ===============================
                    // SHOW LOADER
                    // ===============================
                    btn.disabled = true;

                    loader.classList.remove("hidden");
                    text.textContent = "Generating...";

                    const idToken = await auth.currentUser.getIdToken();

                    const response = await fetch(`https://docgen-service-746637463346.us-central1.run.app/apikey/create`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${idToken}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            name: name
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || "Unable to generate API key");
                    }

                    await loadApiKeys(userId);

                    showToast("API key generated successfully");

                    modal.classList.add("hidden");
                    modal.classList.remove("flex");

                    input.value = "";

                }
                catch (error) {

                    console.error(error);

                    showToast(
                        error.message || "Unable to generate API key",
                        "error"
                    );

                }
                finally {

                    btn.disabled = false;

                    loader.classList.add("hidden");

                    text.textContent = "Generate";

                }

            }
        );

}



document.addEventListener("click", async (e) => {

    // Toggle menu
    if (e.target.closest(".menu-toggle")) {

        document.querySelectorAll(".menu")
            .forEach(m => m.classList.add("hidden"));

        const menu =
            e.target.closest(".relative")
                .querySelector(".menu");

        menu.classList.toggle("hidden");

        return;
    }

    // Disable
    const disableBtn = e.target.closest(".disable-key");

    if (disableBtn) {

        const apiKey = disableBtn.dataset.key;

        await updateApiKeyStatus(
            apiKey,
            "disabled"
        );

        showToast(
            "API key disabled",
            "warning"
        );

        await loadApiKeys(
            auth.currentUser.uid
        );
    }

    // Delete
    const deleteBtn = e.target.closest(".delete-key");

    if (deleteBtn) {

        const confirmed =
            confirm(
                "Delete this API key?"
            );

        if (!confirmed)
            return;

        const row =
            deleteBtn.closest("tr");

        const apiKey = deleteBtn.dataset.key;

        await updateApiKeyStatus(
            apiKey,
            "deleted"
        );

        row.remove();

        showToast(
            "API key deleted",
            "success"
        );
    }

    // Enable
    const enableBtn =
        e.target.closest(
            ".enable-key"
        );

    if (enableBtn) {

        const apiKey =
            enableBtn.dataset.key;

        await updateApiKeyStatus(
            apiKey,
            "active"
        );

        showToast(
            "API key enabled",
            "success"
        );

        await loadApiKeys(
            auth.currentUser.uid
        );

        return;

    }

    // Close menus
    document.querySelectorAll(".menu")
        .forEach(m => {

            if (!m.contains(e.target)) {
                m.classList.add("hidden");
            }

        });

});


async function updateApiKeyStatus(
    apiKey,
    status
) {

    const idToken =
        await auth.currentUser.getIdToken();

    const payload = {
        key: apiKey,
        status: status
    };

    const response = await fetch(
        `https://docgen-service-746637463346.us-central1.run.app/apikey/status`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Unable to update API key"
        );
    }

}


function setActiveTab(activeId) {

    document.querySelectorAll(".nav-link").forEach(link => {

        link.classList.remove(
            "bg-secondary/10",
            "text-secondary",
            "font-bold"
        );

        link.classList.add(
            "text-on-surface-variant"
        );
    });

    const active = document.getElementById(activeId);

    active.classList.remove(
        "text-on-surface-variant"
    );

    active.classList.add(
        "bg-secondary/10",
        "text-secondary",
        "font-bold"
    );
}


const dashboardPage = document.getElementById("dashboard-page");
const templatesPage = document.getElementById("templates-page");

const transactionsPage =
    document.getElementById("transactions-page");

let transactionsLoaded = false;

let templateLoaded = false;

document.getElementById("templates-nav")
    .addEventListener("click", async (e) => {

        e.preventDefault();

        setActiveTab("templates-nav");

        dashboardPage.classList.add("hidden");
        transactionsPage.classList.add("hidden");
        templatesPage.classList.remove("hidden");

        if (!templateLoaded) {

            const res = await fetch("/components/templates.html");
            templatesPage.innerHTML = await res.text();

            initializeTemplateUpload();
            initializeTemplateUpdate();

            await loadTemplates();

            templateLoaded = true;
        }
    });

document.getElementById("dashboard-nav")
    .addEventListener("click", (e) => {

        e.preventDefault();

        setActiveTab("dashboard-nav");

        templatesPage.classList.add("hidden");
        dashboardPage.classList.remove("hidden");
        transactionsPage.classList.add("hidden");
        dashboardPage.classList.remove("hidden");
    });



document
    .getElementById("transactions-nav")
    .addEventListener("click", async (e) => {

        e.preventDefault();

        setActiveTab("transactions-nav");

        dashboardPage.classList.add("hidden");
        templatesPage.classList.add("hidden");

        transactionsPage.classList.remove("hidden");

        if (!transactionsLoaded) {

            const res =
                await fetch("/components/transactions.html");

            transactionsPage.innerHTML =
                await res.text();

            await loadTransactions();

            transactionsLoaded = true;
        }

    });



const sidebar = document.getElementById("sidebar");
const content = document.getElementById("page-content");
const footer = document.getElementById("footer-container");
const toggle = document.getElementById("sidebar-toggle");
const icon = document.getElementById("sidebar-icon");

toggle.addEventListener("click", () => {

    const collapsed =
        sidebar.classList.toggle("sidebar-collapsed");

    if (collapsed) {

        sidebar.classList.add("sidebar-collapsed");

        content.classList.remove("sidebar-open");
        content.classList.add("sidebar-closed");

        footer.classList.remove("sidebar-open");
        footer.classList.add("sidebar-closed");

        icon.textContent = "chevron_right";


    } else {

        sidebar.classList.remove("sidebar-collapsed");

        content.classList.remove("sidebar-closed");
        content.classList.add("sidebar-open");

        footer.classList.remove("sidebar-closed");
        footer.classList.add("sidebar-open");

        icon.textContent = "chevron_left";

    }

});