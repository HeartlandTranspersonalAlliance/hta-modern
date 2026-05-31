{ pkgs, ... }:

let
  htaLanPreview = pkgs.writeShellApplication {
    name = "hta-lan-preview";
    runtimeInputs = [
      pkgs.bash
      pkgs.coreutils
      pkgs.gawk
      pkgs.gnugrep
      pkgs.gnused
      pkgs.nginx
      pkgs.nodejs_24
    ] ++ pkgs.lib.optionals pkgs.stdenv.hostPlatform.isLinux [
      pkgs.iproute2
    ];
    text = ''
      export LAN_PREVIEW_NAME="HTA Modern"
      export LAN_PREVIEW_COMMAND="hta-lan-preview"
      export LAN_PREVIEW_ENV_PREFIX="HTA"
      export LAN_PREVIEW_DEFAULT_PORT="8081"
    '' + builtins.readFile ./nix/lan-preview.sh;
  };
in
{
  name = "hta-modern";

  packages = [
    pkgs.nginx
    pkgs.nodejs_24
    htaLanPreview
  ] ++ pkgs.lib.optionals pkgs.stdenv.hostPlatform.isLinux [
    pkgs.iproute2
  ];

  scripts = {
    preview.exec = "hta-lan-preview --daemon";
    preview-foreground.exec = "hta-lan-preview";
    preview-status.exec = "hta-lan-preview --status";
    preview-stop.exec = "hta-lan-preview --stop";
    preview-build.exec = "HTA_BUILD=1 hta-lan-preview --daemon";
  };

  processes.preview.exec = "hta-lan-preview";

  enterShell = ''
    preview_port="''${LAN_PREVIEW_PORT:-''${HTA_PORT:-8081}}"
    preview_auto="''${LAN_PREVIEW_AUTO:-''${HTA_AUTO_PREVIEW:-1}}"
    preview_build="''${LAN_PREVIEW_AUTO_BUILD:-''${HTA_AUTO_BUILD:-0}}"
    preview_root="''${LAN_PREVIEW_SITE_ROOT:-''${HTA_SITE_ROOT:-$PWD}}"
    preview_dist="''${LAN_PREVIEW_DIST_DIR:-''${HTA_DIST_DIR:-dist}}"
    case "$preview_dist" in
      /*) preview_index="$preview_dist/index.html" ;;
      *) preview_index="$preview_root/$preview_dist/index.html" ;;
    esac

    echo "HTA Modern Astro shell"
    echo "  npm run dev          # Astro dev server"
    echo "  npm run build        # Build static dist/"
    echo "  hta-lan-preview      # Foreground nginx preview"
    echo "  hta-lan-preview --stop"
    echo "  preview              # Start daemonized local preview"
    echo "  preview-stop         # Stop daemonized local preview"
    echo "  devenv up            # Run local preview in the foreground"
    echo

    if [ "$preview_auto" = "1" ]; then
      echo "HTA Modern LAN preview auto-start"
      echo "  Serving existing dist/ on port $preview_port"
      if [ "$preview_build" = "1" ] || [ -f "$preview_index" ]; then
        HTA_BUILD="$preview_build" hta-lan-preview --daemon || {
          echo "  Preview did not start. Run npm run build, then hta-lan-preview --daemon."
        }
      else
        echo "  No $preview_dist/index.html yet. Run npm run build, then hta-lan-preview --daemon."
        echo "  Or set HTA_AUTO_BUILD=1 to build during shell entry."
      fi
    else
      echo "HTA Modern LAN preview"
      echo "  Auto-start disabled by HTA_AUTO_PREVIEW=0 or LAN_PREVIEW_AUTO=0"
      echo "  Start:  hta-lan-preview --daemon"
      echo "  Local:  http://127.0.0.1:$preview_port/"
    fi
  '';
}
