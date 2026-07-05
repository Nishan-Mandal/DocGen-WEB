import {
    collection,
    query,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { auth, db } from "./firebase.js";

export async function loadTransactions() {

    try {

        const user = auth.currentUser;

        if (!user) {
            return;
        }

        const tbody =
            document.getElementById(
                "transactions-table"
            );

        if (!tbody) {
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="6"
                    class="text-center py-10 text-on-surface-variant">

                    Loading transactions...

                </td>
            </tr>
        `;

        const transactionsQuery =
            query(
                collection(
                    db,
                    "users",
                    user.uid,
                    "transactions"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const snapshot =
            await getDocs(
                transactionsQuery
            );

        if (snapshot.empty) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6"
                        class="text-center py-10 text-on-surface-variant">

                        No transactions found

                    </td>
                </tr>
            `;

            return;
        }

        let html = "";

        snapshot.forEach(docSnap => {

            const data = docSnap.data();
        
            const transaction = data.transaction || {};
        
            const payment =
                transaction.payments?.[0] || {};
        
            const amount =
                transaction.details?.totals?.grand_total || "0";
        
            const currency =
                transaction.currency_code || "USD";
        
            const plan =
                transaction.items?.[0]?.price?.description ||
                transaction.items?.[0]?.price?.name ||
                "-";
        
            const paymentMethod =
                payment.method_details?.type
                    ?.toUpperCase() || "-";
        
            const status =
                transaction.status || "-";
        
            const billedAt =
                transaction.billed_at
                    ? new Date(transaction.billed_at)
                        .toLocaleString("en-IN")
                    : "-";
        
            html += `
                <tr class="hover:bg-surface-container-low/30 transition-colors">
        
                    <td class="px-lg py-5 font-code">
                        ${transaction.id}
                    </td>
        
                    <td class="px-lg py-5">
                        ${plan}
                    </td>
        
                    <td class="px-lg py-5 font-semibold">
                        ${currency} ${(Number(amount) / 100).toFixed(2)}
                    </td>
        
                    <td class="px-lg py-5">
                        ${paymentMethod}
                    </td>
        
                    <td class="px-lg py-5">
        
                        ${
                            status === "completed"
                                ? `
                                    <span class="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-green-100 text-green-700 text-label-md">
                                        Completed
                                    </span>
                                `
                                : `
                                    <span class="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-yellow-100 text-yellow-700 text-label-md">
                                        ${status}
                                    </span>
                                `
                        }
        
                    </td>
        
                    <td class="px-lg py-5">
                        ${billedAt}
                    </td>
        
                </tr>
            `;
        });

        tbody.innerHTML = html;

    }
    catch (error) {

        console.error(
            "Load transactions failed:",
            error
        );

    }

}