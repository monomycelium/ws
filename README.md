# WebSegments
WebSegments, or `ws`, is a small project to serve a webpage where users can interactively draw on a four-digit seven-segment display and update a real-time TM1637 display connected to the server. It uses Rust for the backend server and HTML, CSS, and JavaScript for the front end.

## Acknowledgements
This project would not be possible without the `tm1637-gpio-driver` to interface the TM1637 display. Furthermore, the front end was deeply inspired by [Jason Cox](https://github.com/jasonacox)'s [7-Segment LED Display Animator Tool](https://jasonacox.github.io/TM1637TinyDisplay/examples/7-segment-animator.html). Lastly, thanks to the [wsServer](https://github.com/Theldus/wsServer) for simply working flawlessly as I was developing the prototype.

## Deployment
To deploy the server, clone and enter the repository locally and follow these instructions:

### GPIO
Connect a TM1637 display to GPIO, with clock and data pins connected to GPIO pins 24 and 11, respectively. Ensure your user has permission to access the GPIO interface, e.g.:
``` bash
sudo usermod -aG gpio ${USER}
```

### SSL Certificates
The `warp` server requires SSL certificates. Use the `openssl` command (or other services like [Let's Encrypt](https://www.digitalocean.com/community/tutorials/how-to-use-certbot-standalone-mode-to-retrieve-let-s-encrypt-ssl-certificates-on-ubuntu-16-04)) to generate them:
``` bash
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout server/ssl/key.rsa -out server/ssl/cert.pem
```

### Compile Server
Since the web server is written in Rust, it must be compiled. If you have [`rustup`](https://rustup.rs/) installed, you can use `cargo`:
``` bash
cd server && cargo build --release && cd ..
```

### Run Server

Finally, you can run the server. First, ensure your user has permission to bind to port 443, e.g.:
``` bash
sudo sysctl -w net.ipv4.ip_unprivileged_port_start=443
```

Next, from the root of the repository, run the compiled binary:
``` bash
./server/target/release/ws
```

If you do not see any errors, your server is (probably) running at `https://0.0.0.0`. When you visit the webpage, you can press each segment in each digit to toggle them and see them change in real-time on the TM1637 display! You can even copy each segment's array of hex values to the clipboard and clear the display.