# Known issues and deferred work

## Diagnostic-first language server

`papyrus-language-server` 0.1.0 provides native syntax and structural diagnostics for open buffers. It does not yet provide:

- completion or signature help;
- hover information;
- go to definition, references, or rename;
- workspace symbols or project indexing;
- semantic type checking;
- compiler discovery or automatic compilation;
- formatting;
- debugging.

Those features require later language-server milestones. Debugging is a separate Debug Adapter Protocol concern.

## Automatic-download acceptance

The adapter is pinned to the published `papyrus-language-server` release `v0.1.0`. Its release workflow successfully built and published native archives for all four supported platforms.

Windows local-binary diagnostic acceptance completed successfully on 2026-08-02. The clean automatic-download acceptance pass remains incomplete until Windows Zed has downloaded and launched the pinned server without a configured binary or `PATH` override.

## Supported automatic-download platforms

Release assets are mapped for:

- Windows x64;
- Linux x64 using glibc;
- macOS Intel;
- macOS Apple Silicon.

Windows ARM64, Windows x86, Linux ARM64, Linux x86, and macOS x86 are rejected with a clear message rather than receiving an incompatible executable. Users on other targets may configure a compatible local build explicitly.

## Release checksums

The language-server release workflow publishes a SHA-256 file beside every archive. Zed's current extension download helper downloads and extracts the selected GitHub release asset directly and does not expose the archive bytes for adapter-side checksum verification. The adapter therefore relies on the pinned tag, GitHub HTTPS, exact asset names, and Zed's download implementation.

## Vim text objects

The text-object query compiles and every declared capture is exercised automatically. Manual Vim-mode validation remains deferred because enabling Vim mode changes a global Zed setting.
