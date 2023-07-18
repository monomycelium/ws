// prepare WebSocket connection to server. TODO: automatically connect.
let socket = undefined;
// let socket = new WebSocket("wss://" + window.location.hostname + "/ws");
// socket.onerror = () => {
//     socket.close();
//     socket = undefined;
// }

// document elements
let digits = document.querySelectorAll(".digit"); // SVG digits
let screen = document.getElementById("screen"); // screen to show bytes

// elements for server form
let connect_dialogue_items = document.querySelectorAll(".hostname");

// byte array representation of digits
let bytes = new Uint8Array(4).fill(0);
let brightness = 0b1111;

// send data to WebSocket server and refresh bytes
function update() {
    screen.textContent = Array.from(bytes).map(number => {
        let hex = number.toString(16);
        return (hex.length < 2) ? "0x0" + hex : "0x" + hex;
    }).join(", ");

    if (socket) {
        let data = new Uint8Array(bytes.length + 1);
        data[0] = brightness;
        data.set(bytes, 1);
        socket.send(data);
    }
}

// clear digits
function clear() {
    bytes.fill(0);
    digits.forEach((x) => {
        for (let j = 0; j < x.children.length; j++)
            x.children.item(j).classList = "off";
    });

    update();
}

// toggle every bit
function flip() {
    for (let i = 0; i < digits.length; i++) {
        bytes[i] ^= 0xFF;

        for (let j = 0; j < digits[i].children.length; j++)
            digits[i].children.item(j).classList.toggle("on");
    }

    update();
}

// copy bytes as hexadecimal array (i.e. "0xFF, 0xc0, 0xFE, 0xAA")
function copy() {
    navigator.clipboard.writeText(screen.textContent);
}

// show dialogue to connect to custom server
function toggle_dialogue() {
    connect_dialogue_items.forEach(e => {
        e.style.display = e.style.display == "none" ? "block" : "none";
    });
}

// toggle segment of digit
function toggle(digit, segment) {
    digits[digit].children.item(segment).classList.toggle("on");

    if (digits[digit].children.item(segment).classList.contains("on"))
        bytes[digit] |= 1 << segment; // set bit
    else
        bytes[digit] &= ~(1 << segment); // unset bit
}

// connect websocket event handler
function connect() {
    if (socket) socket.close();

    try {
        socket = new WebSocket(connect_dialogue_items[0].value);
        socket.onerror = (_) => {
            alert(`failed to connect to ${connect_dialogue_items[0].value}.`);
            socket.close();
            socket = undefined;
        }
    } catch (e) {
        alert(`failed to connect to ${connect_dialogue_items[0].value}: ${e}.`);
    }
}

window.onload = () => {
    update();
    toggle_dialogue();

    // initialise every segment in every digit
    for (let i = 0; i < digits.length; i++) {
        for (let j = 0; j < digits[i].children.length; j++) {
            digits[i].children.item(j).onclick = () => {
                toggle(i, j);
                update();
            }
        }
    }

    // buttons
    document.getElementById("copy").onclick = copy;
    document.getElementById("clear").onclick = clear;
    document.getElementById("toggle").onclick = flip;
    document.getElementById("toggle_dialogue").onclick = toggle_dialogue;
    connect_dialogue_items[1].onclick = connect;
}
