const form = document.getElementById("contactForm");
const submitBtn = document.getElementById("submitBtn");
const statusMessage = document.getElementById("statusMessage");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    statusMessage.textContent = "";

    const payload = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        subject: document.getElementById("subject").value.trim(),
        message: document.getElementById("message").value.trim()
    };

    try {

        const response = await fetch("https://api.everypapers.com/support", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {

            statusMessage.style.color = "#16a34a";
            statusMessage.textContent =
                "Your support request has been submitted successfully.";

            form.reset();

        } else {

            throw new Error(data.message || "Something went wrong.");

        }

    } catch (err) {

        statusMessage.style.color = "#dc2626";
        statusMessage.textContent = err.message;

    } finally {

        submitBtn.disabled = false;
        submitBtn.textContent = "Send Message";

    }

});