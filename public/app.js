const chat = document.getElementById("chat");
const input = document.getElementById("message");
const button = document.getElementById("send");

async function sendMessage() {
    const message = input.value.trim();

    if (!message) return;

    chat.innerHTML += `
        <div class="user">
            <b>Ty</b><br>
            ${message}
        </div>
    `;

    input.value = "";

    chat.scrollTop = chat.scrollHeight;

    try {

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message
            })
        });

        const data = await response.json();

        chat.innerHTML += `
            <div class="assistant">
                <b>HADES</b><br>
                ${data.answer}
            </div>
        `;

    } catch (err) {

        chat.innerHTML += `
            <div class="assistant">
                <b>HADES</b><br>
                Błąd połączenia z serwerem.
            </div>
        `;

    }

    chat.scrollTop = chat.scrollHeight;
}

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});
