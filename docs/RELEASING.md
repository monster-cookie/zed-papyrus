# Releasing the Zed extension

## Marketplace model

This grammar-only extension does not produce a standalone marketplace package in this repository. Zed publishes extensions from the [`zed-industries/extensions`](https://github.com/zed-industries/extensions) registry after a registry pull request is reviewed and merged.

The extension repository is added to that registry as a Git submodule. Zed then packages and publishes the referenced revision. The authoritative process is documented in [Developing Extensions](https://zed.dev/docs/extensions/developing-extensions#publishing-your-extension).

## Release prerequisites

Before publishing a version:

- complete the Linux continuous-integration checks;
- complete the Windows Zed acceptance checks in `docs/TESTING.md`;
- confirm `extension.toml` contains the intended semantic version;
- confirm the grammar revision is the full commit SHA containing the released grammar;
- confirm the referenced commit is available from a branch in the public repository;
- retain the accepted root `LICENSE` file;
- do not include Bethesda source files, local game paths, generated `grammar/papyrus.wasm`, or development build output.

## Version and tag policy

Release tags will use `v<major>.<minor>.<patch>`, matching the version in `extension.toml`. A release tag must identify a commit reachable from `master`.

The current CI workflow does not run on tag pushes and does not publish releases. A future release workflow may be added under a separate approved plan. That workflow must:

1. trigger only for version tags;
2. verify that the tagged commit belongs to `master`;
3. verify that the tag and manifest versions match;
4. rerun the complete Linux validation suite;
5. avoid marketplace credentials for untrusted pull requests;
6. require explicit approval before creating or updating a registry pull request.

## Initial marketplace submission

The first marketplace submission is manual:

1. Fork `zed-industries/extensions` to a personal GitHub account.
2. Add this public repository as an HTTPS submodule at `extensions/papyrus`.
3. Add the `papyrus` entry and matching version to the registry's `extensions.toml`.
4. Run the registry's required `pnpm sort-extensions` command.
5. Open a pull request to `zed-industries/extensions` and complete its review process.

After that pull request is merged, Zed packages and publishes the extension. Updating an existing marketplace version requires advancing the registry submodule and its matching version in a new registry pull request.
