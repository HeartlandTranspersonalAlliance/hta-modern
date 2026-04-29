{
  description = "HTA Modern Astro development and LAN preview environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];

      forAllSystems =
        f:
        nixpkgs.lib.genAttrs systems (
          system:
          f {
            pkgs = import nixpkgs { inherit system; };
            inherit system;
          }
        );
    in
    {
      packages = forAllSystems (
        { pkgs, system }:
        {
          hta-lan-preview = pkgs.writeShellApplication {
            name = "hta-lan-preview";
            runtimeInputs = [
              pkgs.bash
              pkgs.coreutils
              pkgs.gawk
              pkgs.gnugrep
              pkgs.gnused
              pkgs.iproute2
              pkgs.nginx
              pkgs.nodejs_24
            ];
            text = ''
              export LAN_PREVIEW_NAME="HTA Modern"
              export LAN_PREVIEW_COMMAND="hta-lan-preview"
              export LAN_PREVIEW_ENV_PREFIX="HTA"
              export LAN_PREVIEW_DEFAULT_PORT="8081"
            '' + builtins.readFile ./nix/lan-preview.sh;
          };

          default = self.packages.${system}.hta-lan-preview;
        }
      );

      apps = forAllSystems (
        { system, ... }:
        {
          hta-lan-preview = {
            type = "app";
            program = "${self.packages.${system}.hta-lan-preview}/bin/hta-lan-preview";
          };

          default = self.apps.${system}.hta-lan-preview;
        }
      );

      devShells = forAllSystems (
        { pkgs, system }:
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.iproute2
              pkgs.nginx
              pkgs.nodejs_24
              self.packages.${system}.hta-lan-preview
            ];

            shellHook = ''
              preview_port="''${LAN_PREVIEW_PORT:-''${HTA_PORT:-8081}}"
              preview_auto="''${LAN_PREVIEW_AUTO:-''${HTA_AUTO_PREVIEW:-1}}"

              echo "HTA Modern Astro shell"
              echo "  npm run dev          # Astro dev server"
              echo "  npm run build        # Build static dist/"
              echo "  hta-lan-preview      # Foreground nginx preview"
              echo "  hta-lan-preview --stop"
              echo

              if [ "$preview_auto" = "1" ]; then
                echo "HTA Modern LAN preview auto-start"
                echo "  Serving existing dist/ on port $preview_port"
                HTA_BUILD="''${HTA_AUTO_BUILD:-0}" hta-lan-preview --daemon || {
                  echo "  Preview did not start. Run npm run build, then hta-lan-preview --daemon."
                }
              else
                echo "HTA Modern LAN preview"
                echo "  Auto-start disabled by HTA_AUTO_PREVIEW=0 or LAN_PREVIEW_AUTO=0"
                echo "  Start:  hta-lan-preview --daemon"
                echo "  Local:  http://127.0.0.1:$preview_port/"
              fi
            '';
          };
        }
      );
    };
}
