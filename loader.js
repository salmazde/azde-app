const APP = document.getElementById("app");

const STORAGE_KEY = "azde_trusted_device";

function showUnlockScreen() {

    APP.innerHTML = `
        <div class="unlock-container">

            <div class="unlock-card">

                <h1>🔒 Azure Data Engineering Interview Guide</h1>

                <p>
                    Enter your access key
                </p>

                <input
                    id="password"
                    type="password"
                    placeholder="Access Key"
                >

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

            </div>

        </div>
    `;

    document
        .getElementById("unlock")
        .addEventListener("click", unlock);
}

async function deriveKey(password, salt){

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
            iterations:100000,
            hash:"SHA-256"
        },
        keyMaterial,
        {
            name:"AES-GCM",
            length:256
        },
        false,
        ["decrypt"]
    );

}

async function unlock(){

    const password =
        document.getElementById("password").value;

    try{

        const response =
            await fetch("index.enc");

        const payload =
            await response.json();

        const salt =
            Uint8Array.from(
                atob(payload.salt),
                c=>c.charCodeAt(0)
            );

        const iv =
            Uint8Array.from(
                atob(payload.iv),
                c=>c.charCodeAt(0)
            );

        const tag =
            Uint8Array.from(
                atob(payload.tag),
                c=>c.charCodeAt(0)
            );

        const data =
            Uint8Array.from(
                atob(payload.data),
                c=>c.charCodeAt(0)
            );

        const encrypted =
            new Uint8Array(
                data.length + tag.length
            );

        encrypted.set(data);

        encrypted.set(
            tag,
            data.length
        );

        const key =
            await deriveKey(
                password,
                salt
            );

        const decrypted =
            await crypto.subtle.decrypt(
                {
                    name:"AES-GCM",
                    iv
                },
                key,
                encrypted
            );

        const html =
            new TextDecoder().decode(
                decrypted
            );

        if(
            document
                .getElementById("remember")
                .checked
        ){

            localStorage.setItem(
                STORAGE_KEY,
                password
            );

        }

        document.open();

        document.write(html);

        document.close();

    }

    catch(e){

        document
            .getElementById("error")
            .innerHTML =
            "Invalid Access Key";

    }

}

window.addEventListener(
    "load",
    ()=>{

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );

        if(saved){

            document.body.innerHTML =
                '<div id="app"></div>';

            unlockUsing(saved);

        }

        else{

            showUnlockScreen();

        }

    }
);

async function unlockUsing(password){

    document.body.innerHTML =
        '<div id="app"></div>';

    document.getElementById =
        ()=>({value:password});

    await unlock();

}
