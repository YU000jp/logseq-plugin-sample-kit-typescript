# Logseq Plugin: Sample Kit for TypeScript

- Sample kit for a simple Logseq plugin that does not require React or other tools.

<!-- 

- Not published yet 👷🚧

> [Release](https://github.com/YU000jp/logseq-plugin-sample-kit-typescript/releases) information is on the right. Load files at developer mode.

[![latest release version](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-sample-kit-typescript)](https://github.com/YU000jp/logseq-plugin-sample-kit-typescript/releases)
[![Downloads](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-sample-kit-typescript/total.svg)](https://github.com/YU000jp/logseq-plugin-sample-kit-typescript/releases)

---

-->

<!-- start doc -->

## Preparing the repository

1. Clone this repository or use it as a template to create a new repository. <a href="#"><img src="https://github.com/user-attachments/assets/dcf349bc-fb96-4d4e-afa7-e26aca1efb9d"/></a>
   - Configure the workflow permissions for the repository." Select "Read and write permissions". (Settings > Actions > General)
1. Match repository name, etc.
   - Replace all of the strings "YU000jp/logseq-plugin-sample-kit-typescript" in files in the folder.
   - Replace the value of "PLUGIN NAME" in the "release.config.js" file.
   - Replaces a personal name in the "LICENSE" file.
1. In the same folder as "package.json", run 'pnpm install' from a terminal.
1. "pnpm build" will generate an executable folder (converted to JavaScript).
   - It can now be loaded from developer mode.
   - During plugin development, reload from the plugin screen after changes have been made.
- Document Link:
  1. https://plugins-doc.logseq.com/
  1. https://github.com/logseq/logseq-plugin-samples
  1. https://correctroad.gitbook.io/logseq-plugins-in-action (👲Chinese)
- Note:
  1. The kit incorporates [logseq-l10n](https://github.com/sethyuan/logseq-l10n) so that translation by L10N can be provided.
     - When describing user messages, use `t("string")`.

## Steps to publish a plugin

1. Prepare an icon, approximately 64px in size.
   - If it is an SVG file, replace icon.svg.
   - If it is not an SVG file, place the file in the same folder as package.json and rewrite "icon.svg" in the "release.config.js" file.
1. Run the GitHub Actions Workflow to generate a public version of the release file.
   - Open the Actions tab, select 'Release' and then press the 'Run workflow' button.
   - If the manifesto has not been submitted, it will not yet be published at this stage.
1. Submit a manifesto to Logseq.
   - https://github.com/logseq/marketplace

<!-- end -->

<!--

## Features

1. A
1. B
1. C

---

## Getting Started

### Install from Logseq Marketplace (Coming👷🚧)

- Press [`---`] on the top right toolbar to open [`Plugins`]. Select marketplace. Type `WORD` in the search field, select it from the search results and install

-->
