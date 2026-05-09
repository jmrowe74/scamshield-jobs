{ pkgs }: {
  channel = "stable-24.11";
  packages = [
    pkgs.nodejs_22
    pkgs.busybox
    pkgs.psmisc
  ];
  idx.extensions = [
    "rvest.vs-code-prettier-eslint"
  ];
}
