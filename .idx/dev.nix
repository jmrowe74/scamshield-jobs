{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.busybox
  ];
  idx.extensions = [
    "rvest.vs-code-prettier-eslint"
  ];
}