#!/usr/bin/env bash
set -euo pipefail

name="${LAN_PREVIEW_NAME:-Astro site}"
command_name="${LAN_PREVIEW_COMMAND:-site-lan-preview}"
env_prefix="${LAN_PREVIEW_ENV_PREFIX:-SITE}"
default_port="${LAN_PREVIEW_DEFAULT_PORT:-8080}"

usage() {
  cat <<USAGE
Build and serve the generated $name Astro site over the local network with nginx.

Usage:
  $command_name
  $command_name --daemon
  $command_name --status
  $command_name --stop

Environment:
  ${env_prefix}_HOST=0.0.0.0      Address nginx listens on.
  ${env_prefix}_PORT=$default_port         Port nginx listens on. Use a non-root port.
  ${env_prefix}_BUILD=1           Build before serving. Set to 0 to serve existing dist/.
  ${env_prefix}_SITE_ROOT=\$PWD    Site root. Defaults to the current directory.
  ${env_prefix}_DIST_DIR=dist     Static output directory, relative to site root unless absolute.
  ${env_prefix}_BASE_PATH=        Optional deployment base path for non-root previews.

Examples:
  $command_name
  $command_name --daemon
  $command_name --status
  $command_name --stop
  ${env_prefix}_PORT=$((default_port + 10)) $command_name
  ${env_prefix}_BUILD=0 $command_name
USAGE
}

mode="foreground"
case "${1:-}" in
  "")
    mode="foreground"
    ;;
  -h | --help)
    usage
    exit 0
    ;;
  --daemon | --start | start)
    mode="daemon"
    ;;
  --foreground | serve)
    mode="foreground"
    ;;
  --status | status)
    mode="status"
    ;;
  --stop | stop)
    mode="stop"
    ;;
  *)
    echo "error: unknown argument: $1" >&2
    usage >&2
    exit 2
    ;;
esac

host_var="${env_prefix}_HOST"
port_var="${env_prefix}_PORT"
build_var="${env_prefix}_BUILD"
site_root_var="${env_prefix}_SITE_ROOT"
dist_dir_var="${env_prefix}_DIST_DIR"
base_path_var="${env_prefix}_BASE_PATH"

site_root="$(cd "${LAN_PREVIEW_SITE_ROOT:-${!site_root_var:-$PWD}}" && pwd)"
host="${LAN_PREVIEW_HOST:-${!host_var:-0.0.0.0}}"
port="${!port_var:-$default_port}"
build="${LAN_PREVIEW_BUILD:-${!build_var:-1}}"
dist_setting="${LAN_PREVIEW_DIST_DIR:-${!dist_dir_var:-dist}}"
base_path="${LAN_PREVIEW_BASE_PATH:-${!base_path_var:-}}"

if [[ "$dist_setting" = /* ]]; then
  dist_dir="$dist_setting"
else
  dist_dir="$site_root/$dist_setting"
fi

if [[ -z "$base_path" && -f "$site_root/src/config.yaml" ]]; then
  base_path="$(
    sed -n "s/^[[:space:]]*base:[[:space:]]*['\"]\{0,1\}\([^'\"]*\)['\"]\{0,1\}[[:space:]]*$/\1/p" \
      "$site_root/src/config.yaml" |
      head -n 1
  )"
fi

if [[ -n "$base_path" && "$base_path" != "/" ]]; then
  base_path="/${base_path#/}"
  base_path="${base_path%/}"
else
  base_path=""
fi

if [[ ! -f "$site_root/package.json" ]]; then
  echo "error: $site_root does not look like the $name site root" >&2
  echo "       cd into the project root or set ${env_prefix}_SITE_ROOT." >&2
  exit 1
fi

has_astro_config=0
for config_file in astro.config.mjs astro.config.ts astro.config.js astro.config.cjs; do
  if [[ -f "$site_root/$config_file" ]]; then
    has_astro_config=1
    break
  fi
done

if [[ "$has_astro_config" != "1" ]]; then
  echo "error: $site_root does not contain an Astro config file" >&2
  exit 1
fi

if [[ "$port" =~ [^0-9] || "$port" -lt 1024 || "$port" -gt 65535 ]]; then
  echo "error: ${env_prefix}_PORT must be a number between 1024 and 65535" >&2
  exit 1
fi

runtime_base="${LAN_PREVIEW_RUNTIME_DIR:-${XDG_RUNTIME_DIR:-}}"
if [[ -z "$runtime_base" || ! -d "$runtime_base" || ! -w "$runtime_base" ]]; then
  runtime_base="/tmp"
fi

runtime_slug="$(printf "%s" "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g; s/--*/-/g; s/^-//; s/-$//')"
runtime_dir="$runtime_base/$runtime_slug-nginx-$port"
conf_file="$runtime_dir/nginx.conf"
pid_file="$runtime_dir/nginx.pid"

running_pid() {
  local pid

  if [[ ! -f "$pid_file" ]]; then
    return 1
  fi

  pid="$(cat "$pid_file" 2>/dev/null || true)"
  if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
    echo "$pid"
    return 0
  fi

  return 1
}

port_in_use() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | grep -q .
    return $?
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -H -ltn "sport = :$port" 2>/dev/null | grep -q .
    return $?
  fi

  return 1
}

check_port_available() {
  if port_in_use; then
    echo "error: $name nginx preview cannot start: $host:$port is already in use" >&2
    echo "       stop the process using that port or choose another port with ${env_prefix}_PORT=$((port + 1))." >&2
    exit 1
  fi
}

print_urls() {
  echo "  Local:  http://127.0.0.1:$port/"
  if [[ -n "$base_path" ]]; then
    echo "  Base:   http://127.0.0.1:$port$base_path/"
  fi

  if [[ "$host" != "0.0.0.0" && "$host" != "127.0.0.1" ]]; then
    echo "  Host:   http://$host:$port/"
    if [[ -n "$base_path" ]]; then
      echo "  Host:   http://$host:$port$base_path/"
    fi
  fi

  if command -v ip >/dev/null 2>&1; then
    addresses="$(
      ip -o -4 addr show scope global 2>/dev/null |
        awk '{ split($4, address, "/"); print address[1] }' || true
    )"
  elif [[ -x /sbin/ifconfig ]]; then
    addresses="$(
      /sbin/ifconfig 2>/dev/null |
        awk '/^[[:space:]]*inet / && $2 != "127.0.0.1" { print $2 }' || true
    )"
  else
    addresses=""
  fi

  while read -r address; do
    if [[ -n "$address" ]]; then
      echo "  LAN:    http://$address:$port/"
      if [[ -n "$base_path" ]]; then
        echo "  LAN:    http://$address:$port$base_path/"
      fi
    fi
  done <<< "$addresses"
}

print_logs() {
  echo "  Logs:   $runtime_dir/logs/access.log"
  echo "          $runtime_dir/logs/error.log"
}

prepare_runtime() {
  mkdir -p \
    "$runtime_dir/logs" \
    "$runtime_dir/tmp/client_body" \
    "$runtime_dir/tmp/proxy" \
    "$runtime_dir/tmp/fastcgi" \
    "$runtime_dir/tmp/uwsgi" \
    "$runtime_dir/tmp/scgi"
}

close_extra_fds() {
  local fd fd_dir fd_path

  if [[ -d "/proc/$$/fd" ]]; then
    fd_dir="/proc/$$/fd"
  elif [[ -d "/dev/fd" ]]; then
    fd_dir="/dev/fd"
  else
    return 0
  fi

  for fd_path in "$fd_dir"/*; do
    fd="${fd_path##*/}"
    [[ "$fd" =~ ^[0-9]+$ ]] || continue
    [[ "$fd" -gt 2 ]] || continue
    [[ "$fd" -ne 255 ]] || continue
    eval "exec ${fd}>&-"
  done
}

write_config() {
  nginx_prefix="$(dirname "$(dirname "$(command -v nginx)")")"
  mime_types="$nginx_prefix/conf/mime.types"
  base_location=""

  if [[ -n "$base_path" ]]; then
    base_location="
    location ^~ $base_path/ {
      rewrite ^$base_path/?(.*)$ /\$1 break;
      try_files \$uri \$uri/index.html \$uri.html /404.html;
    }
"
  fi

  cat > "$conf_file" <<EOF
worker_processes 1;
pid $pid_file;
error_log $runtime_dir/logs/error.log info;

events {
  worker_connections 1024;
}

http {
  include $mime_types;
  default_type application/octet-stream;

  access_log $runtime_dir/logs/access.log;
  sendfile on;
  keepalive_timeout 65;
  server_tokens off;

  client_body_temp_path $runtime_dir/tmp/client_body;
  proxy_temp_path $runtime_dir/tmp/proxy;
  fastcgi_temp_path $runtime_dir/tmp/fastcgi;
  uwsgi_temp_path $runtime_dir/tmp/uwsgi;
  scgi_temp_path $runtime_dir/tmp/scgi;

  gzip on;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;

  server {
    listen $host:$port;
    server_name _;
    root "$dist_dir";
    index index.html;
    absolute_redirect off;

$base_location

    location / {
      try_files \$uri \$uri/index.html \$uri.html /404.html;
    }

    error_page 404 /404.html;

    location = /404.html {
      try_files /404.html =404;
    }

    location ~* \.(?:css|js|png|jpg|jpeg|gif|svg|ico|webmanifest|xml|woff|woff2|ttf|otf|avif|webp)$ {
      try_files \$uri =404;
      expires 1h;
      add_header Cache-Control "public";
    }
  }
}
EOF
}

if [[ "$mode" == "status" ]]; then
  if pid="$(running_pid)"; then
    echo "$name nginx preview is running on pid $pid"
    print_urls
    print_logs
    exit 0
  fi

  echo "$name nginx preview is not running on port $port"
  exit 1
fi

if [[ "$mode" == "stop" ]]; then
  if pid="$(running_pid)"; then
    kill "$pid" 2>/dev/null || true

    for _ in 1 2 3 4 5; do
      if kill -0 "$pid" 2>/dev/null; then
        sleep 1
      else
        break
      fi
    done

    if kill -0 "$pid" 2>/dev/null; then
      echo "$name nginx preview is still stopping on pid $pid"
    else
      rm -f "$pid_file"
      echo "Stopped $name nginx preview on port $port"
    fi
    exit 0
  fi

  rm -f "$pid_file"
  echo "$name nginx preview is not running on port $port"
  exit 0
fi

if [[ "$build" != "0" ]]; then
  if [[ ! -d "$site_root/node_modules" ]]; then
    if [[ -f "$site_root/package-lock.json" ]]; then
      echo "node_modules not found; installing dependencies with npm ci..."
      (cd "$site_root" && npm ci)
    else
      echo "node_modules not found; installing dependencies with npm install..."
      (cd "$site_root" && npm install)
    fi
  fi

  echo "Building $name Astro site..."
  (cd "$site_root" && npm run build)
fi

if [[ ! -f "$dist_dir/index.html" ]]; then
  echo "error: $dist_dir/index.html does not exist" >&2
  echo "       run npm run build or use ${env_prefix}_BUILD=1." >&2
  exit 1
fi

prepare_runtime

if pid="$(running_pid)"; then
  echo "$name nginx preview is already running on pid $pid"
  print_urls
  print_logs
  exit 0
fi

rm -f "$pid_file"

check_port_available

write_config

if [[ "$mode" == "daemon" ]]; then
  start_log="$runtime_dir/logs/start.log"

  if ! (
    close_extra_fds
    exec nginx -e "$runtime_dir/logs/error.log" -p "$runtime_dir" -c "$conf_file" \
      </dev/null >"$start_log" 2>&1
  ); then
    cat "$start_log" >&2
    exit 1
  fi

  echo "Started $name nginx preview from $dist_dir"
  print_urls
  print_logs
  exit 0
fi

echo
echo "Serving $name static site from:"
echo "  $dist_dir"
echo
echo "Reachable URLs:"
print_urls
echo
print_logs
echo
echo "Stop with Ctrl-C."
echo

exec nginx -e "$runtime_dir/logs/error.log" -p "$runtime_dir" -c "$conf_file" -g "daemon off;"
