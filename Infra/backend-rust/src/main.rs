use axum::{routing::get, Json, Router};
use serde::Serialize;
use std::net::SocketAddr;

#[derive(Serialize)]
struct Health {
    service: &'static str,
    status: &'static str,
}

async fn root() -> Json<Health> {
    Json(Health {
        service: "rust",
        status: "ok",
    })
}

async fn health() -> Json<Health> {
    Json(Health {
        service: "rust",
        status: "healthy",
    })
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(root)).route("/health", get(health));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    println!("Rust service listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}
