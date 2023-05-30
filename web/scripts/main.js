const socket = new WebSocket("wss://" + window.location.hostname + "/ws");
const digits = document.querySelectorAll(".digit");
var bytes = new Uint8Array(4);

function clear() {
    bytes.fill(0);
    digits.forEach((x) => {
        for (let j = 0; j < x.children.length; j++) {
            x.children.item(j).classList = "off";
        }
    });
    socket.send(bytes);
}

function copy() {
    navigator.clipboard.writeText(Array.from(bytes).map(byte => "0x" + byte.toString(16)).join(', '));
}

function toggle(digit, segment) {
    if (digits[digit].children.item(segment).classList.contains("on")) bytes[digit] |= 1 << segment;
    else bytes[digit] &= ~(1 << segment);
}

window.onload = () => {
    for (let i = 0; i < digits.length; i++) {
        for (let j = 0; j < digits[i].children.length; j++) {
            digits[i].children.item(j).onclick = () => {
                digits[i].children.item(j).classList.toggle("on");
                toggle(i, j);
                socket.send(bytes);
            };
        }
    }

    document.getElementById("copy").onclick = copy;
    document.getElementById("clear").onclick = clear;
}
