import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";


export async function createUserDocument(user) {

    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const userSnap = await getDoc(userRef);

    // Prevent duplicate creation
    if (userSnap.exists()) return;

    const apiKey = generateApiKey();

    // ===============================
    // USER DOCUMENT
    // ===============================

    await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "User",
        email: user.email || "",
        photo: user.photoURL || "",
        provider: user.providerData?.[0]?.providerId || "password",
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        lastUsedAt: serverTimestamp(),
        plan: "Free",
        status: "active",
        limits: {
            daily: 100,
            total: 1000,
            apiKey: {
                total: 5
            },
            pdf: {
                daily: 50,
                total: 500
            },
            docx: {
                daily: 50,
                total: 500
            },
            templateAnalysis: {
                daily: 50,
                total: 500
            }
        },
        usage: {
            total: 0,
            today: 0,
            todayDate: null,
            pdf: {
                total: 0,
                today: 0
            },
            docx: {
                total: 0,
                today: 0
            },
            templateAnalysis: {
                total: 0,
                today: 0
            }
        },
        failures: {
            total: 0,
            today: 0,
            todayDate: null,
            pdf: {
                total: 0,
                today: 0
            },
            docx: {
                total: 0,
                today: 0
            },
            templateAnalysis: {
                total: 0,
                today: 0
            }
        }
    });

    console.log("User document created");


    // ===============================
    // GLOBAL API KEY
    // ===============================
    await setDoc(doc(db, "apiKeys", apiKey), {
        key: apiKey,
        name: "New Key",
        status: "active",
        userId: user.uid,
        createdAt: serverTimestamp(),
        lastUsedAt: null,
        usage: {
            total: 0,
            today: 0,
            todayDate: null,
            pdf: {
                total: 0,
                today: 0
            },
            docx: {
                total: 0,
                today: 0
            },
            templateAnalysis: {
                total: 0,
                today: 0
            }
        },
        failures: {
            total: 0,
            today: 0,
            todayDate: null,
            pdf: {
                total: 0,
                today: 0
            },
            docx: {
                total: 0,
                today: 0
            },
            templateAnalysis: {
                total: 0,
                today: 0
            }
        }
    }
    );


    // ===============================
    // USER SUBCOLLECTION API KEY
    // ===============================
    await setDoc(
        doc(db, "users", user.uid, "apiKeys", apiKey),
        {
            key: apiKey,
            name: "New Key",
            status: "active",
            userId: user.uid,
            createdAt: serverTimestamp(),
            lastUsedAt: null,
            totalRequest: 0,
            usageToday: 0,
            lastUsedDate: null,
            usage: {
                total: 0,
                today: 0,
                todayDate: null,
                pdf: {
                    total: 0,
                    today: 0
                },
                docx: {
                    total: 0,
                    today: 0
                },
                templateAnalysis: {
                    total: 0,
                    today: 0
                }
            },
            failures: {
                total: 0,
                today: 0,
                todayDate: null,
                pdf: {
                    total: 0,
                    today: 0
                },
                docx: {
                    total: 0,
                    today: 0
                },
                templateAnalysis: {
                    total: 0,
                    today: 0
                }
            }
        }
    );

    console.log("User & Free API Key created");
}

export function generateApiKey() {

    let key = "dg_" + crypto.randomUUID().replace(/-/g, "");

    return key;
}