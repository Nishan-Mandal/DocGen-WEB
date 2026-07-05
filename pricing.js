import { auth } from "./components/firebase.js";
import { showToast } from "./components/util.js";

const API_BASE =
    "https://docgen-service-746637463346.us-central1.run.app";

const PADDLE_TOKEN =
    "test_6a6827ccb7c97df8ad27c026621";

Paddle.Environment.set("sandbox");

Paddle.Initialize({
    token: PADDLE_TOKEN
});

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("starterPlanBtn")
        ?.addEventListener("click", function () {
            subscribe("starter", this);
        });

    document
        .getElementById("growthPlanBtn")
        ?.addEventListener("click", function () {
            subscribe("growth", this);
        });

});

async function subscribe(plan, button) {

    const text =
        button.querySelector(".btn-text");

    const loader =
        button.querySelector(".loader");

    try {

        button.disabled = true;

        text.classList.add("hidden");

        loader.classList.remove("hidden");

        const user = auth.currentUser;

        if (!user) {
            window.location.href = "/dashboard.html";
            return;
        }

        const idToken =
            await user.getIdToken();

        const response =
            await fetch(
                `${API_BASE}/billing/create-checkout`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        plan
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Unable to create checkout."
            );
        }

        Paddle.Checkout.open({
            transactionId: data.transactionId
        });

    }
    catch (error) {

        console.error(error);

        alert(error.message);

    }
    finally {

        button.disabled = false;

        text.classList.remove("hidden");

        loader.classList.add("hidden");

    }

}


const modal = document.getElementById("enterpriseModal");

document
    .getElementById("contactSalesBtn")
    .addEventListener("click", () => {

        modal.classList.remove("hidden");
        modal.classList.add("flex");

    });

document
    .getElementById("closeEnterpriseModal")
    .addEventListener("click", () => {

        modal.classList.add("hidden");
        modal.classList.remove("flex");

    });


document
    .getElementById("submitEnterpriseLead")
    .addEventListener("click", async () => {

        const payload = {

            name:
                leadName.value.trim(),

            email:
                leadEmail.value.trim(),

            company:
                leadCompany.value.trim(),

            monthlyDocuments:
                leadVolume.value,

            requirements:
                leadRequirements.value.trim()

        };

        const submitBtn = document.getElementById("submitEnterpriseLead");
        const btnText = document.getElementById("enterprise-btn-text");
        const btnLoader = document.getElementById("enterprise-btn-loader");

        submitBtn.disabled = true;
        btnText.classList.add("hidden");
        btnLoader.classList.remove("hidden");

        try {

            const response = await fetch(
                `${API_BASE}/enterprise/lead`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(payload)

                });

            const data = await response.json();

            if (!response.ok) {

                showToast(data.error, "error");
                return;

            }

            showToast(
                "Your request has been submitted.",
                "success"
            );

            modal.classList.add("hidden");
            modal.classList.remove("flex");

        } catch (error) {

            showToast(
                "Unable to submit your request. Please try again.",
                "error"
            );

        } finally {

            submitBtn.disabled = false;

            btnLoader.classList.add("hidden");
            btnText.classList.remove("hidden");

        }

    });