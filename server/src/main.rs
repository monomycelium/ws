use futures::StreamExt;
use std::{
    net,
    sync::{mpsc, Arc, Mutex},
    thread, time,
};
use tm1637_gpio_driver::{gpio_api, TM1637Adapter};
use tokio::sync::oneshot;
use warp::{ws, Filter};

#[tokio::main]
async fn main() {
    let (sender, receiver) = mpsc::channel::<[u8; 4]>();
    let sender = Arc::new(Mutex::new(sender));

    let route_root = warp::get()
        .and(warp::path("segments"))
        .and(warp::fs::dir("web"));
    let route_ws = ws().and(warp::addr::remote()).and(warp::path("ws")).map(
        move |ws: ws::Ws, remote: Option<net::SocketAddr>| {
            let mpsc_tx = Arc::clone(&sender);
            let handle_websocket = move |websocket: ws::WebSocket| {
                handle_websocket(websocket, remote.clone(), Arc::clone(&mpsc_tx))
            };
            ws.on_upgrade(handle_websocket)
        },
    );

    let (tx, rx) = oneshot::channel();
    let (_, server) = warp::serve(route_ws.or(route_root))
        .tls()
        .cert_path("server/ssl/cert.pem")
        .key_path("server/ssl/key.rsa")
        .bind_with_graceful_shutdown(([0, 0, 0, 0], 443), async {
            rx.await.ok();
        });

    std::thread::spawn(move || {
        let display: TM1637Adapter = gpio_api::setup_gpio_cdev(
            24,
            11,
            Box::from(|| thread::sleep(time::Duration::from_micros(10))),
            "/dev/gpiochip0",
        );

        loop {
            let result = receiver.recv();
            if result.is_err() {
                break;
            }

            display.write_segments_raw(&result.unwrap(), 0);
        }
    });

    tokio::task::spawn(server);
    tokio::signal::ctrl_c().await.unwrap();
    let _ = tx.send(());
}

async fn handle_websocket(
    mut websocket: ws::WebSocket,
    remote: Option<net::SocketAddr>,
    sender: Arc<Mutex<mpsc::Sender<[u8; 4]>>>,
) {
    let remote = remote
        .map(|addr| addr.to_string())
        .unwrap_or("0.0.0.0".to_string());

    println!("c: {remote}");

    while let Some(result) = websocket.next().await {
        if !result.is_ok() {
            eprintln!("websocket error: {}", result.err().unwrap());
            continue;
        }

        let bytes = result.unwrap().into_bytes();

        if bytes.len() != 4 {
            continue;
        };

        let mut array: [u8; 4] = [0; 4];
        array.copy_from_slice(&bytes[..4]);
        println!("m: {}\t{}", remote, fmt(&array));

        let result = sender.lock();
        if result.is_err() {
            eprintln!("failed to lock sender: {}", result.err().unwrap());
            continue;
        }

        let result = result.unwrap().send(array);
        if result.is_err() {
            eprintln!("failed to send array: {}", result.err().unwrap());
            continue;
        }
    }

    println!("d: {remote}");
}

fn fmt(array: &[u8]) -> String {
    return array
        .iter()
        .map(|x| format!("0x{x:02x}"))
        .collect::<Vec<String>>()
        .join(", ");
}
