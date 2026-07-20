import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    serverTimestamp,
    collection,
    query,
    where,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import { auth, db, storage } from "./firebase.js";

import { showToast } from "./util.js";


let templatesMap = {};

export async function loadTemplates() {

    try {

        const user = auth.currentUser;

        if (!user) {
            return;
        }

        const tbody =
            document.getElementById(
                "templates-table-body"
            );

        if (!tbody) {
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="7"
                    class="text-center py-10 text-on-surface-variant">

                    Loading templates...

                </td>
            </tr>
        `;


        const templatesQuery =
            query(
                collection(
                    db,
                    "users",
                    user.uid,
                    "templates"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const snapshot =
            await getDocs(
                templatesQuery
            );

        if (snapshot.empty) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7"
                        class="text-center py-10 text-on-surface-variant">

                        No templates found

                    </td>
                </tr>
            `;

            return;
        }

        let html = "";

        snapshot.forEach(docSnap => {

            const template =
                docSnap.data();

            templatesMap[
                template.templateId
            ] = template;

            const createdDate =
                template.createdAt?.toDate
                    ? template.createdAt
                        .toDate()
                        .toLocaleDateString()
                    : "-";

            const updatedDate =
                template.updatedAt?.toDate
                    ? template.updatedAt
                        .toDate()
                        .toLocaleDateString()
                    : "-";

            html += `
                <tr class="hover:bg-surface-container-low/30 transition-colors">

                    <td class="px-lg py-5">

                        <div class="flex items-center gap-md">

                            <div
                                class="w-10 h-10 bg-indigo-50 text-secondary flex items-center justify-center rounded-lg">

                                <span
                                    class="material-symbols-outlined"
                                    style="font-variation-settings:'FILL' 1">

                                    description

                                </span>

                            </div>

                            <span class="font-bold text-primary">

                                ${template.fileName || "-"}

                            </span>

                        </div>

                    </td>

                    <td class="px-lg py-5">

                        <div
                            class="flex items-center gap-sm bg-surface-container-low px-2 py-1 rounded w-fit">

                            <code class="text-xs font-code">

                                ${template.templateId}

                            </code>

                            <button
                                class="copy-template"
                                data-template-id="${template.templateId}">

                                <span
                                    class="material-symbols-outlined text-sm">

                                    content_copy

                                </span>

                            </button>

                        </div>

                    </td>

            

                    <td class="px-lg py-5 font-medium">

                        ${template.usageCount || 0}

                    </td>

                    <td class="px-lg py-5 text-on-surface-variant text-sm">

                        ${createdDate}

                    </td>

                     <td class="px-lg py-5 text-on-surface-variant text-sm">

                        ${updatedDate}

                    </td>

                    <td class="px-lg py-5">

                        <div class="flex justify-end gap-md">

                            <button
                                class="view-fields text-secondary hover:underline text-sm font-semibold"
                                data-template-id="${template.templateId}">

                                View Fields

                            </button>

                            <button
                                class="update-template text-on-surface-variant hover:text-primary"
                                data-template-id="${template.templateId}">

                                <span class="material-symbols-outlined">

                                    file_upload

                                </span>

                            </button>

                            <button
                                class="download-template text-on-surface-variant hover:text-primary"
                                data-template-id="${template.templateId}">

                                <span class="material-symbols-outlined">

                                    download

                                </span>

                            </button>

                            <button
                                class="delete-template text-error hover:text-red-700"
                                data-template-id="${template.templateId}">

                                <span class="material-symbols-outlined">

                                    delete

                                </span>

                            </button>

                        </div>

                    </td>

                </tr>
            `;
        });

        tbody.innerHTML = html;

    } catch (error) {

        console.error(
            "Load templates failed:",
            error
        );

        showToast(
            "Failed to load templates",
            "error"
        );
    }
}


document.addEventListener("click", async (e) => {

    // COPY
    const copyBtn =
        e.target.closest(".copy-template");

    if (copyBtn) {

        await navigator.clipboard.writeText(
            copyBtn.dataset.templateId
        );

        showToast(
            "Template ID copied",
            "success"
        );

        return;
    }

    // VIEW FIELDS
    const fieldsBtn =
        e.target.closest(".view-fields");

    if (fieldsBtn) {

        await openFieldsDrawer(
            fieldsBtn.dataset.templateId
        );

        return;
    }

    // UPDATE
    const updateBtn =
        e.target.closest(".update-template");

    if (updateBtn) {

        openUpdateModal(
            updateBtn.dataset.templateId
        );

        return;
    }

    // DOWNLOAD
    const downloadBtn =
        e.target.closest(".download-template");

    if (downloadBtn) {

        await downloadTemplate(
            downloadBtn.dataset.templateId
        );

        return;
    }

    // DELETE
    const deleteBtn =
        e.target.closest(".delete-template");

    if (deleteBtn) {

        await deleteTemplate(
            deleteBtn.dataset.templateId
        );

        return;
    }
});


async function openFieldsDrawer(
    templateId
) {

    const template =
        templatesMap[templateId];

    if (!template)
        return;

    const container =
        document.getElementById(
            "merge-fields-container"
        );

    let html = `
        <div class="space-y-6">
        
            <div>
          
        
                <div class="flex flex-wrap gap-2">
                    ${template.mergeFields.map(field => `
                        <div class="px-3 py-2 rounded-lg bg-purple-100 text-purple-700 font-mono text-sm rounded-lg">
        
                            {{${field}}}
        
                        </div>
                    `).join("")}
                </div>
            </div>
        
            <div>
    <h3 class="text-lg font-bold text-primary mb-3">
        Table Collections
    </h3>

    ${Object.keys(template.tables || {}).length === 0
            ? `
                <div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500">
                    <span class="material-symbols-outlined text-4xl mb-2 block text-gray-400">
                        table_rows
                    </span>
                    <p class="font-medium">No tables detected</p>
                    <p class="text-sm mt-1">
                        This template doesn't contain any repeating table collections.
                    </p>
                </div>
            `
            : Object.entries(template.tables)
                .map(([tableName, columns]) => `
                    <div class="mb-5 border rounded-xl overflow-hidden">

                        <div class="bg-gray-50 px-4 py-3 font-semibold">
                            ${tableName}
                        </div>

                        <table class="w-full">

                            <thead>
                                <tr>
                                    <th class="px-4 py-2 text-left">
                                        Field
                                    </th>

                                    <th class="px-4 py-2 text-left">
                                        Usage
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                ${columns.map(column => `
                                    <tr>

                                        <td class="px-4 py-2">
                                            ${column}
                                        </td>

                                        <td class="px-4 py-2 font-mono text-sm">
                                            ${tableName}.${column}
                                        </td>

                                    </tr>
                                `).join("")}

                            </tbody>

                        </table>

                    </div>
                `).join("")
        }

            </div>
        
        </div>
        `;
    container.innerHTML = html;
    document
        .getElementById("fields-drawer")
        .classList.remove("hidden");
}


async function downloadTemplate(
    templateId
) {

    const template =
        templatesMap[templateId];

    if (!template)
        return;

    window.open(
        template.fileUrl,
        "_blank"
    );
}


async function deleteTemplate(
    templateId
) {

    const confirmed =
        confirm(
            "Delete this template?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const template =
            templatesMap[templateId];

        if (!template) {
            throw new Error(
                "Template not found"
            );
        }

        // Delete actual file from Storage
        if (template.storagePath) {

            const storageRef =
                ref(
                    storage,
                    template.storagePath
                );

            await deleteObject(
                storageRef
            );

        }

        // Delete Firestore record
        await deleteDoc(
            doc(
                db,
                "users",
                auth.currentUser.uid,
                "templates",
                templateId
            )
        );

        // Remove from local cache
        delete templatesMap[templateId];

        showToast(
            "Template deleted successfully",
            "success"
        );

        await loadTemplates();

    } catch (error) {

        console.error(
            "Template deletion failed:",
            error
        );

        showToast(
            error.message ||
            "Failed to delete template",
            "error"
        );

    }

}


export function initializeTemplateUpload() {

    const uploadBtn =
        document.getElementById(
            "new-template-btn"
        );

    const fileInput =
        document.getElementById(
            "template-file"
        );

    if (!uploadBtn ||
        !fileInput) {

        return;
    }

    uploadBtn.onclick =
        () => {

            fileInput.click();

        };

    fileInput.onchange =
        async (event) => {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }

            await uploadTemplate(
                file
            );

            fileInput.value = "";
        };
}

async function uploadTemplate(file) {
    try {

        const user =
            auth.currentUser;

        if (!user) {

            showToast(
                "User not logged in",
                "error"
            );

            return;
        }

        showToast(
            "Analyzing template...",
            "info",
            4000
        );

        // STEP 1
        const analysis =
            await analyzeTemplate(file);



        const mergeFields =
            analysis.fields || [];

        const tables =
            analysis.tables || {};

        showToast(
            "Uploading template...",
            "info"
        );

        // STEP 2
        const templateId = generateTemplateId()

        const storagePath =
            `users/${user.uid}/templates/${templateId}/${file.name}`;

     

        const storageRef =
            ref(
                storage,
                storagePath
            );
        await uploadBytes(
            storageRef,
            file
        );

        const fileUrl =
            await getDownloadURL(
                storageRef
            );


        console.log(fileUrl)

        // STEP 3
        await await setDoc(

            doc(
                db,
                "users",
                user.uid,
                "templates",
                templateId
            ),

            {
                templateId,
                userId: user.uid,

                fileName:
                    file.name,

                fileUrl,

                storagePath,

                mergeFields,

                tables,

                usageCount: 0,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            }

        );

        showToast(
            "Template uploaded successfully",
            "success"
        );

        await loadTemplates();

    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Upload failed",
            "error"
        );
    }
}


async function getLatestApiKey() {

    const user = auth.currentUser;

    const q = query(
        collection(db,"apiKeys"),
        where("userId", "==", user.uid),
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
        limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        throw new Error(
            "No active API key found"
        );
    }

    return snapshot.docs[0].data().key;
}

async function analyzeTemplate(file) {

    const apiKey =
        await getLatestApiKey();

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );
    
    const response =
        await fetch(
            "https://docgen-service-746637463346.us-central1.run.app/v1/analyze_template",
            {
                method: "POST",
                headers: {
                    "x-api-key": apiKey
                },
                body: formData
            }
        );

    if (!response.ok) {

        throw new Error(
            "Failed to analyze template"
        );
    }

    return await response.json();
}

function generateTemplateId() {

    return (
        "TMP_" +
        Date.now()
            .toString(36)
            .toUpperCase()
    );
}

let updatingTemplateId = null;

function openUpdateModal(templateId) {

    updatingTemplateId = templateId;

    const updateFileInput =
        document.getElementById(
            "update-template-file"
        );

    if (!updateFileInput) {

        console.error(
            "update-template-file not found"
        );

        return;
    }

    updateFileInput.click();

}



export function initializeTemplateUpdate() {

    const updateFileInput =
        document.getElementById(
            "update-template-file"
        );

    if (!updateFileInput) {
        return;
    }

    updateFileInput.onchange =
        async (event) => {

            const file =
                event.target.files[0];

            if (!file ||
                !updatingTemplateId) {

                return;
            }

            await updateTemplate(
                updatingTemplateId,
                file
            );

            updatingTemplateId = null;

            updateFileInput.value = "";
        };

}



async function updateTemplate(
    templateId,
    file
) {

    const template =
        templatesMap[templateId];

    if (!template) {
        return;
    }

    try {

        showToast(
            "Analyzing template...",
            "info"
        );

        // Analyze new template
        const analysis =
            await analyzeTemplate(file);

        const mergeFields =
            analysis.fields || [];

        const tables =
            analysis.tables || {};

        showToast(
            "Updating template...",
            "info"
        );

        const user =
            auth.currentUser;

        // Store the old path before updating
        const oldStoragePath =
            template.storagePath;

        // Create new path using new filename
        const newStoragePath =
            `users/${user.uid}/templates/${templateId}/${file.name}`;

        const newStorageRef =
            ref(
                storage,
                newStoragePath
            );

        // Upload new file
        await uploadBytes(
            newStorageRef,
            file
        );

        // Get new download URL
        const fileUrl =
            await getDownloadURL(
                newStorageRef
            );

        // Update Firestore
        await setDoc(
            doc(
                db,
                "users",
                user.uid,
                "templates",
                templateId
            ),
            {
                ...template,

                fileName:
                    file.name,

                fileUrl,

                storagePath:
                    newStoragePath,

                mergeFields,

                tables,

                updatedAt:
                    serverTimestamp()
            }
        );

        // Delete old file only when path changed
        if (
            oldStoragePath &&
            oldStoragePath !== newStoragePath
        ) {

            const oldStorageRef =
                ref(
                    storage,
                    oldStoragePath
                );

            await deleteObject(
                oldStorageRef
            );

        }

        showToast(
            "Template updated successfully",
            "success"
        );

        await loadTemplates();

    } catch (error) {

        console.error(
            "Template update failed:",
            error
        );

        showToast(
            error.message ||
            "Template update failed",
            "error"
        );

    }

}