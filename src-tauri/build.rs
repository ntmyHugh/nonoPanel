use std::env;
use std::path::PathBuf;

fn main() {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap_or_default());
    let env_candidates = [manifest_dir.join(".env"), manifest_dir.parent().map(|p| p.join(".env")).unwrap_or_default()];

    if env::var("QWEATHER_API_KEY").ok().filter(|value| !value.is_empty()).is_none() {
        for candidate in env_candidates {
            if !candidate.as_os_str().is_empty() && candidate.exists() {
                if let Ok(iter) = dotenvy::from_path_iter(&candidate) {
                    for item in iter.flatten() {
                        if item.0 == "QWEATHER_API_KEY" && !item.1.is_empty() {
                            println!("cargo:rustc-env=QWEATHER_API_KEY={}", item.1);
                            break;
                        }
                    }
                }
                println!("cargo:rerun-if-changed={}", candidate.display());
            }
        }
    } else if let Ok(value) = env::var("QWEATHER_API_KEY") {
        println!("cargo:rustc-env=QWEATHER_API_KEY={value}");
    }

    tauri_build::build()
}
