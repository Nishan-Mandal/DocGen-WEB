// ===============================
// TOAST
// ===============================
export function showToast(
    message,
    type = "info",
    duration = 3000
) {

    const container =
        document.getElementById(
            "toastContainer"
        );

    const icons = {

        success:
            "check_circle",

        error:
            "error",

        warning:
            "warning",

        info:
            "info"

    };

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `toast ${type}`;


    toast.innerHTML = `

        <div class="toast-inner">

            <div class="toast-icon">

                <span
                    class="material-symbols-outlined">

                    ${icons[type]}

                </span>

            </div>

            <div class="toast-content">

                ${message}

            </div>

            <div
                class="toast-progress"
                style="
                    animation-duration:
                    ${duration}ms
                ">
            </div>

        </div>

    `;


    container.appendChild(
        toast
    );


    setTimeout(
        () =>
            toast.classList.add(
                "show"
            ),
        10
    );


    const removeToast =
        () => {

            toast.classList.remove(
                "show"
            );

            setTimeout(
                () =>
                    toast.remove(),
                300
            );

        };


    const timeout =
        setTimeout(
            removeToast,
            duration
        );


    toast.addEventListener(
        "click",
        () => {

            clearTimeout(
                timeout
            );

            removeToast();

        }
    );

}