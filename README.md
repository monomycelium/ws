# WebSegments
WebSegments, or `ws`, is a small project to serve a webpage where users can interactively draw on a four-digit seven-segment display and update a real-time TM1637 display connected to the server. It uses Zig for the WebSocket server and HTML, CSS, and JavaScript for the front end.

## Acknowledgements
This project would not be possible without the `tm1637-gpio-driver` to interface the TM1637 display. Furthermore, the front end was deeply inspired by [Jason Cox](https://github.com/jasonacox)'s [7-Segment LED Display Animator Tool](https://jasonacox.github.io/TM1637TinyDisplay/examples/7-segment-animator.html). Lastly, thanks to the [wsServer](https://github.com/Theldus/wsServer) for simply working flawlessly as I was developing the prototype.

## Deployment
To deploy the server, you need the Zig toolchain to build the WebSocket server. Clone and enter the repository locally, and follow these instructions:

### Host Front-End (Optional)
You can host the front-end at `./web/` yourself; e.g.:

``` bash
cd web
python -m http.server
cd ..
```

Visit `http://localhost:8000/` to access the front-end. I am also hosting it on `https://marsh.digitya.com/segments`.

### GPIO
Connect a TM1637 display to GPIO, with clock and data pins connected to GPIO pins 24 and 11, respectively. Ensure your user has permission to access the GPIO interface; e.g.:
``` bash
sudo usermod -aG gpio ${USER}
```

### Compile WebSocket Server
Since the web server is written in Zig, it must be compiled. After [installing Zig](https://ziglang.org/learn/getting-started/#installing-zig) [(version 0.11.0)](https://ziglang.org/download/#release-0.11.0), build the server:
``` bash
cd server
zig build -Doptimize=ReleaseFast
cd ..
```

### Run WebSocket Server
Finally, you can run the server:

``` bash
./server/zig-out/bin/ws 0.0.0.0 8080
```

This should expose a WebSocket listening at `0.0.0.0:8080`. To connect to this local instance, connect to `ws://localhost:8080` from the front-end. If there are no errors in the web console, you can press each segment in each digit to toggle them and see them change in real-time on the TM1637 display! You can even copy each segment's array of hex values to the clipboard and clear the display.

### Secure Layers
Out of the box, the WebSocket server does not support TLS or SSL. However, you can run a reverse proxy like Caddy to enforce better security. Here is an example Caddyfile entry:

``` conf
ws.example.com {
    root * /path/to/ws/web
    reverse_proxy /ws/* :8080
}
```

The WebSocket instance would be exposed at `wss://ws.example.com/ws/` and the front-end at `https://ws.example.com/`. Do note that a front-end hosted by a static server through HTTPS can only connect to a WebSocket instance with SSL or TLS.
