{ pkgs }: {
  channel = "stable-24.11";
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    pkgs.psmisc
    pkgs.busybox
  ];
  idx.extensions = [
    "christian-kohler.path-intellisense"
    "dbaeumer.vscode-eslint"
    "esbenp.prettier-vscode"
  ];
}
