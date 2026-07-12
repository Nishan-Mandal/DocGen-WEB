import { auth } from "./firebase.js";

const API_BASE = "https://docgen-service-746637463346.us-central1.run.app";

export async function createUserDocument(name) {

    const currentUser = auth.currentUser;

    const idToken = await currentUser.getIdToken(true);

    const response = await fetch(`${API_BASE}/user/create`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${idToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name
        })
    });
    
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Unable to create user");
    }

    return data;
}
