const APP = document.getElementById("app");

const STORAGE_KEY = "azde_app_trusted_device";

function showUnlockScreen() {

    APP.innerHTML = `
        <div class="unlock-container">

            <div class="unlock-card">

                <h1>🔒 Azure Data Engineering Interview Guide</h1>

                <p>Enter your access key</p>

                <div class="password-box">

                    <input
                        id="password"
                        type="password"
                        placeholder="Access Key"
                        autofocus
                    >

                    <span id="togglePassword" class="eye">👁️</span>

                </div>

                <label class="remember">

                    <input
                        type="checkbox"
                        id="remember"
                    >

                    Trust this device

                </label>

                <button id="unlock">

                    Unlock

                </button>

                <div id="error"></div>

                <div class="credits">

    <div>
        Crafted with ❤️ by
        <a href="https://www.linkedin.com/in/salman-khan-p/" target="_blank">
            Salman Khan
        </a>
    </div>

    <div class="version">
    ${window.APP_VERSION}
</div>

</div>

            </div>

        </div>
    `;

    const input = document.getElementById("password");

    const eye = document.getElementById("togglePassword");

    eye.addEventListener("click", () => {

        if (input.type === "password") {

            input.type = "text";
            eye.innerHTML = "🙈";

        } else {

            input.type = "password";
            eye.innerHTML = "👁️";

        }

    });

    input.addEventListener("keydown", e => {

        if (e.key === "Enter") {

            unlock();

        }

    });

    document
        .getElementById("unlock")
        .addEventListener("click", unlock);

}

async function deriveKey(password, salt) {

    const enc = new TextEncoder();

    const keyMaterial =
        await crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["decrypt"]
    );

}

async function decryptSite(password) {

    const page =
        location.pathname
            .split("/")
            .pop()
            .replace(".html", "");

    const encFile =
        page === "" || page === "index"
            ? "index.enc"
            : page + ".enc";

    const response =
        await fetch(encFile + "?ts=" + Date.now());

    if (!response.ok) {

        throw new Error("Unable to load encrypted guide.");

    }

    const payload =
        await response.json();

    const salt =
        Uint8Array.from(
            atob(payload.salt),
            c => c.charCodeAt(0)
        );

    const iv =
        Uint8Array.from(
            atob(payload.iv),
            c => c.charCodeAt(0)
        );

    const tag =
        Uint8Array.from(
            atob(payload.tag),
            c => c.charCodeAt(0)
        );

    const data =
        Uint8Array.from(
            atob(payload.data),
            c => c.charCodeAt(0)
        );

    const encrypted =
        new Uint8Array(
            data.length + tag.length
        );

    encrypted.set(data);

    encrypted.set(tag, data.length);

    const key =
        await deriveKey(password, salt);

    const decrypted =
        await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv
            },
            key,
            encrypted
        );

    return new TextDecoder().decode(decrypted);

}

async function unlock() {

    const password = document.getElementById("password").value;

    const error = document.getElementById("error");

    const button = document.getElementById("unlock");

    error.innerHTML = "";

    button.disabled = true;

    button.innerHTML = `
        <div class="loader"></div>
        Decrypting...
    `;

    try {

        const html = await decryptSite(password);

        if (document.getElementById("remember").checked) {

            localStorage.setItem(
                STORAGE_KEY,
                password
            );

        }

        document.open();
        document.write(html);
        document.close();

        if ("serviceWorker" in navigator) {

            navigator.serviceWorker
                .register("service-worker.js")
                .then(reg => reg.update());

        }

    }

    catch (e) {

        button.disabled = false;

        button.innerHTML = "Unlock";

        error.innerHTML = "❌ Invalid Access Key";

    }

}

async function unlockUsing(password) {

    try {

        const html = await decryptSite(password);

        document.open();
        document.write(html);
        document.close();

        if ("serviceWorker" in navigator) {

            navigator.serviceWorker
                .register("service-worker.js")
                .then(reg => reg.update());

        }

    }

    catch (e) {

        localStorage.removeItem(STORAGE_KEY);

        showUnlockScreen();

    }

}

window.addEventListener("load", async () => {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {

        await unlockUsing(saved);

    }

    else {

        showUnlockScreen();

    }

});
