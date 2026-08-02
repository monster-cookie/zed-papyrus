//! Zed adapter for the Papyrus language server.

use std::fs;

use zed_extension_api::{self as zed, LanguageServerId, Result};

const LANGUAGE_SERVER_NAME: &str = "papyrus-language-server";
const LANGUAGE_SERVER_REPOSITORY: &str = "monster-cookie/papyrus-language-server";
const LANGUAGE_SERVER_VERSION: &str = "v0.1.0";

/// Zed extension state used to cache the downloaded language-server path.
struct PapyrusExtension {
    cached_binary_path: Option<String>,
}

/// Archive metadata for one supported language-server release target.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
struct ReleaseAsset {
    archive_name: &'static str,
    executable_name: &'static str,
    archive_kind: ArchiveKind,
}

/// Archive formats published by the language-server release workflow.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum ArchiveKind {
    GzipTar,
    Zip,
}

impl ArchiveKind {
    /// Converts the release archive format into the corresponding Zed download mode.
    fn downloaded_file_type(self) -> zed::DownloadedFileType {
        match self {
            Self::GzipTar => zed::DownloadedFileType::GzipTar,
            Self::Zip => zed::DownloadedFileType::Zip,
        }
    }
}

impl PapyrusExtension {
    /// Returns the configured, discovered, or downloaded language-server executable.
    fn language_server_binary_path(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
        configured_path: Option<String>,
    ) -> Result<String> {
        if let Some(path) = configured_path {
            return Ok(path);
        }

        if let Some(path) = worktree.which(LANGUAGE_SERVER_NAME) {
            return Ok(path);
        }

        if let Some(path) = &self.cached_binary_path
            && fs::metadata(path).is_ok_and(|metadata| metadata.is_file())
        {
            return Ok(path.clone());
        }

        let result = self.download_language_server(language_server_id);
        if let Err(error) = &result {
            zed::set_language_server_installation_status(
                language_server_id,
                &zed::LanguageServerInstallationStatus::Failed(error.clone()),
            );
        }
        result
    }

    /// Downloads the pinned language-server release for the current platform.
    fn download_language_server(
        &mut self,
        language_server_id: &LanguageServerId,
    ) -> Result<String> {
        let (os, architecture) = zed::current_platform();
        let asset = release_asset_for_platform(os, architecture)?;
        let version_directory = format!("{LANGUAGE_SERVER_NAME}-{LANGUAGE_SERVER_VERSION}");
        let binary_path = format!("{version_directory}/{}", asset.executable_name);

        if !fs::metadata(&binary_path).is_ok_and(|metadata| metadata.is_file()) {
            zed::set_language_server_installation_status(
                language_server_id,
                &zed::LanguageServerInstallationStatus::CheckingForUpdate,
            );
            let release = zed::github_release_by_tag_name(
                LANGUAGE_SERVER_REPOSITORY,
                LANGUAGE_SERVER_VERSION,
            )?;
            let release_asset = release
                .assets
                .iter()
                .find(|candidate| candidate.name == asset.archive_name)
                .ok_or_else(|| {
                    format!(
                        "{LANGUAGE_SERVER_VERSION} does not contain the required release asset {}",
                        asset.archive_name
                    )
                })?;

            zed::set_language_server_installation_status(
                language_server_id,
                &zed::LanguageServerInstallationStatus::Downloading,
            );
            zed::download_file(
                &release_asset.download_url,
                &version_directory,
                asset.archive_kind.downloaded_file_type(),
            )
            .map_err(|error| {
                format!(
                    "failed to download {} from {LANGUAGE_SERVER_VERSION}: {error}",
                    asset.archive_name
                )
            })?;

            if os != zed::Os::Windows {
                zed::make_file_executable(&binary_path)
                    .map_err(|error| format!("failed to mark {binary_path} executable: {error}"))?;
            }
        }

        if !fs::metadata(&binary_path).is_ok_and(|metadata| metadata.is_file()) {
            return Err(format!(
                "the {} archive did not contain {} at its root",
                asset.archive_name, asset.executable_name
            ));
        }

        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::None,
        );
        self.cached_binary_path = Some(binary_path.clone());
        Ok(binary_path)
    }
}

impl zed::Extension for PapyrusExtension {
    /// Creates an extension instance without a cached language-server binary.
    fn new() -> Self {
        Self {
            cached_binary_path: None,
        }
    }

    /// Builds the command Zed uses to launch the Papyrus language server over stdio.
    fn language_server_command(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let settings =
            zed::settings::LspSettings::for_worktree(language_server_id.as_ref(), worktree)?;
        let configured_path = settings
            .binary
            .as_ref()
            .and_then(|binary| binary.path.clone());
        let args = settings
            .binary
            .as_ref()
            .and_then(|binary| binary.arguments.clone())
            .unwrap_or_default();
        let env = settings
            .binary
            .and_then(|binary| binary.env)
            .unwrap_or_default()
            .into_iter()
            .collect();

        Ok(zed::Command {
            command: self.language_server_binary_path(
                language_server_id,
                worktree,
                configured_path,
            )?,
            args,
            env,
        })
    }
}

/// Returns the exact release asset published for a supported Zed host platform.
fn release_asset_for_platform(
    os: zed::Os,
    architecture: zed::Architecture,
) -> Result<ReleaseAsset> {
    let asset = match (os, architecture) {
        (zed::Os::Windows, zed::Architecture::X8664) => ReleaseAsset {
            archive_name: "papyrus-language-server-x86_64-pc-windows-msvc.zip",
            executable_name: "papyrus-language-server.exe",
            archive_kind: ArchiveKind::Zip,
        },
        (zed::Os::Linux, zed::Architecture::X8664) => ReleaseAsset {
            archive_name: "papyrus-language-server-x86_64-unknown-linux-gnu.tar.gz",
            executable_name: "papyrus-language-server",
            archive_kind: ArchiveKind::GzipTar,
        },
        (zed::Os::Mac, zed::Architecture::X8664) => ReleaseAsset {
            archive_name: "papyrus-language-server-x86_64-apple-darwin.tar.gz",
            executable_name: "papyrus-language-server",
            archive_kind: ArchiveKind::GzipTar,
        },
        (zed::Os::Mac, zed::Architecture::Aarch64) => ReleaseAsset {
            archive_name: "papyrus-language-server-aarch64-apple-darwin.tar.gz",
            executable_name: "papyrus-language-server",
            archive_kind: ArchiveKind::GzipTar,
        },
        _ => {
            return Err(format!(
                "papyrus-language-server {LANGUAGE_SERVER_VERSION} does not publish a release for {os:?} {architecture:?}; configure lsp.{LANGUAGE_SERVER_NAME}.binary.path to use a compatible local build"
            ));
        }
    };
    Ok(asset)
}

zed::register_extension!(PapyrusExtension);

#[cfg(test)]
mod tests {
    use super::{ArchiveKind, release_asset_for_platform};
    use zed_extension_api::{Architecture, Os};

    /// Verifies every release artifact produced by the language-server workflow.
    #[test]
    fn maps_supported_release_assets() {
        let cases = [
            (
                Os::Windows,
                Architecture::X8664,
                "papyrus-language-server-x86_64-pc-windows-msvc.zip",
                "papyrus-language-server.exe",
                ArchiveKind::Zip,
            ),
            (
                Os::Linux,
                Architecture::X8664,
                "papyrus-language-server-x86_64-unknown-linux-gnu.tar.gz",
                "papyrus-language-server",
                ArchiveKind::GzipTar,
            ),
            (
                Os::Mac,
                Architecture::X8664,
                "papyrus-language-server-x86_64-apple-darwin.tar.gz",
                "papyrus-language-server",
                ArchiveKind::GzipTar,
            ),
            (
                Os::Mac,
                Architecture::Aarch64,
                "papyrus-language-server-aarch64-apple-darwin.tar.gz",
                "papyrus-language-server",
                ArchiveKind::GzipTar,
            ),
        ];

        for (os, architecture, archive_name, executable_name, archive_kind) in cases {
            let asset = release_asset_for_platform(os, architecture)
                .expect("supported platform should have an asset");
            assert_eq!(asset.archive_name, archive_name);
            assert_eq!(asset.executable_name, executable_name);
            assert_eq!(asset.archive_kind, archive_kind);
        }
    }

    /// Verifies unsupported architectures fail instead of downloading an incompatible binary.
    #[test]
    fn rejects_platforms_without_release_assets() {
        for (os, architecture) in [
            (Os::Windows, Architecture::Aarch64),
            (Os::Windows, Architecture::X86),
            (Os::Linux, Architecture::Aarch64),
            (Os::Linux, Architecture::X86),
            (Os::Mac, Architecture::X86),
        ] {
            let error = release_asset_for_platform(os, architecture)
                .expect_err("unsupported platform should be rejected");
            assert!(error.contains("does not publish a release"));
            assert!(error.contains("binary.path"));
        }
    }
}
