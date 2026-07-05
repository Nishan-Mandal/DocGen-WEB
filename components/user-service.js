import { auth } from "./firebase.js";

const API_BASE = "https://docgen-service-746637463346.us-central1.run.app";

export async function createUserDocument() {

    const currentUser = auth.currentUser;

    if (!currentUser) {
        throw new Error("User is not logged in.");
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch(`${API_BASE}/user/create`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${idToken}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Unable to create user");
    }

    return data;
}

export function generateApiKey() {

    let key = "dg_" + crypto.randomUUID().replace(/-/g, "");

    return key;
}