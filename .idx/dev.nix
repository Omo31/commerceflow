{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20 pkgs.gtk3 pkgs.nss pkgs.alsa-lib
  ];
  idx.extensions = [
    
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--hostname"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}