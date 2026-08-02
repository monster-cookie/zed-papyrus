# Known issues and deferred work

## Diagnostic-first language server

`papyrus-language-server` 0.1 provides native syntax and structural diagnostics for open buffers. It does not yet provide:

- completion or signature help;
- hover information;
- go to definition, references, or rename;
- workspace symbols or project indexing;
- semantic type checking;
- compiler discovery or automatic compilation;
- formatting;
- debugging.

Those features require later language-server milestones. Debugging is a separate Debug Adapter Protocol concern.

## Automatic download awaits the first server release

The adapter is pinned to `papyrus-language-server` release `v0.1.0`. Until that tag's release workflow publishes native archives, automatic installation will report that the release is unavailable. Development testing must use a locally built executable through the Zed binary-path setting or `PATH`.

The automatic-download acceptance pass remains incomplete until all four release archives exist and Windows Zed has successfully downloaded and launched the pinned server without a local override.

## Supported automatic-download platforms

Release assets are mapped for:

- Windows x64;
- Linux x64 using glibc;
- macOS Intel;
- macOS Apple Silicon.

Windows ARM64, Windows x86, Linux ARM64, Linux x86, and macOS x86 are rejected with a clear message rather than receiving an incompatible executable. Users on other targets may configure a compatible local build explicitly.

## Release checksums

The language-server release workflow publishes a SHA-256 file beside every archive. Zed's current extension download helper downloads and extracts the selected GitHub release asset directly and does not expose the archive bytes for adapter-side checksum verification. The adapter therefore relies on the pinned tag, GitHub HTTPS, exact asset names, and Zed's download implementation.

## Diagnostic acceptance still requires Zed testing

The native language-server tests already verify the missing-`EndIf` message and diagnostic clearing after the closer is inserted. Before release, the development extension must still demonstrate in Zed that:

- an error appears without saving;
- the range identifies the conflicting closer rather than the whole file;
- hover displays `Missing EndIf before EndFunction`;
- the error appears in Zed's diagnostics view;
- inserting `EndIf` clears it promptly.

## Vim text objects

The text-object query compiles and every declared capture is exercised automatically. Manual Vim-mode validation remains deferred because enabling Vim mode changes a global Zed setting.
