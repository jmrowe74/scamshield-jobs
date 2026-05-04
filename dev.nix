{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.busybox
  ];
  idx.extensions = [
    "styled-components.vscode-styled-components"
    "esbenp.prettier-vscode"
  ];
}