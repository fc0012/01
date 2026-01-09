#!/bin/bash
# VERTEX One-Click Install Script
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEFAULT_INSTALL_DIR="/opt/vertex"
DEFAULT_PORT="3000"
VERTEX_IMAGE="lswl/vertex:stable"

INSTALL_DIR=""
CREATED_RESOURCES=()

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker is installed: $(docker --version)"
        return 0
    else
        print_error "Docker is not installed."
        echo "Please install: curl -fsSL https://get.docker.com | bash"
        return 1
    fi
}

check_docker_compose() {
    if docker compose version &> /dev/null; then
        print_success "Docker Compose is installed: $(docker compose version)"
        return 0
    elif command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is installed: $(docker-compose --version)"
        return 0
    else
        print_error "Docker Compose is not installed."
        echo "Please install: sudo apt-get install docker-compose-plugin"
        return 1
    fi
}

check_dependencies() {
    print_info "Checking dependencies..."
    local has_error=0
    check_docker || has_error=1
    check_docker_compose || has_error=1
    [ $has_error -eq 1 ] && { print_error "Missing dependencies."; return 1; }
    print_success "All dependencies are installed."
    return 0
}


setup_directories() {
    local install_dir="${1:-$DEFAULT_INSTALL_DIR}"
    INSTALL_DIR="$install_dir"
    print_info "Setting up directory: $install_dir"
    [ ! -d "$install_dir" ] && { mkdir -p "$install_dir" || return 1; CREATED_RESOURCES+=("$install_dir"); }
    [ ! -d "$install_dir/data" ] && { mkdir -p "$install_dir/data" || return 1; CREATED_RESOURCES+=("$install_dir/data"); }
    chmod 755 "$install_dir" "$install_dir/data" 2>/dev/null || true
    print_success "Directory setup completed."
}

cleanup() {
    [ ${#CREATED_RESOURCES[@]} -eq 0 ] && return 0
    print_warning "Cleaning up..."
    [ -f "$INSTALL_DIR/docker-compose.yml" ] && { cd "$INSTALL_DIR"; docker compose down 2>/dev/null || true; }
    for ((i=${#CREATED_RESOURCES[@]}-1; i>=0; i--)); do
        [ -e "${CREATED_RESOURCES[$i]}" ] && rm -rf "${CREATED_RESOURCES[$i]}" 2>/dev/null
    done
}

trap 'cleanup' ERR
trap 'echo ""; print_warning "Interrupted."; cleanup; exit 130' INT TERM

generate_docker_compose() {
    local install_dir="${1:-$INSTALL_DIR}"
    local port="${2:-$DEFAULT_PORT}"
    print_info "Generating docker-compose.yml..."
    cat > "$install_dir/docker-compose.yml" << EOF
version: '3'
services:
  vertex:
    image: ${VERTEX_IMAGE}
    container_name: vertex
    restart: always
    ports:
      - "${port}:3000"
    volumes:
      - ./data:/vertex
    environment:
      - TZ=Asia/Shanghai
EOF
    CREATED_RESOURCES+=("$install_dir/docker-compose.yml")
    print_success "Generated docker-compose.yml"
}

configure_mirror() {
    local daemon_json="/etc/docker/daemon.json"
    [ -f "$daemon_json" ] && return 0
    print_info "Configuring Docker mirror..."
    cat > "$daemon_json" << 'EOF'
{
  "registry-mirrors": ["https://docker.1ms.run", "https://docker.xuanyuan.me"]
}
EOF
    systemctl daemon-reload 2>/dev/null || true
    systemctl restart docker 2>/dev/null || true
    sleep 2
    print_success "Docker mirror configured."
}

start_services() {
    local install_dir="${1:-$INSTALL_DIR}"
    configure_mirror
    print_info "Pulling VERTEX image (please wait, this may take a few minutes)..."
    cd "$install_dir"
    if docker compose version &> /dev/null; then
        docker compose pull --quiet && print_success "Image pulled." || docker compose pull
        print_info "Starting VERTEX..."
        docker compose up -d
    else
        docker-compose pull --quiet && print_success "Image pulled." || docker-compose pull
        print_info "Starting VERTEX..."
        docker-compose up -d
    fi
    print_success "VERTEX started successfully."
}

show_result() {
    local install_dir="${1:-$INSTALL_DIR}"
    local port="${2:-$DEFAULT_PORT}"
    local server_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    
    # Wait for VERTEX to generate password file (up to 30 seconds)
    local password_file="$install_dir/data/password"
    local password=""
    print_info "Waiting for VERTEX to initialize..."
    local retry=0
    while [ $retry -lt 30 ] && [ ! -f "$password_file" ]; do
        sleep 1
        retry=$((retry + 1))
    done
    [ -f "$password_file" ] && password=$(cat "$password_file" 2>/dev/null)
    
    echo ""
    echo "=============================================="
    print_success "VERTEX installation completed!"
    echo "=============================================="
    echo ""
    echo "Access URL: http://localhost:${port}"
    echo "           http://${server_ip}:${port}"
    echo ""
    echo "Default Credentials:"
    echo "  Username: admin"
    if [ -n "$password" ]; then
        echo "  Password: ${password}"
    else
        echo "  Password: (run: cat ${install_dir}/data/password)"
    fi
    echo ""
    echo "Commands:"
    echo "  Start:   cd ${install_dir} && docker compose up -d"
    echo "  Stop:    cd ${install_dir} && docker compose down"
    echo "  Logs:    cd ${install_dir} && docker compose logs -f"
    echo ""
}

main() {
    echo ""
    echo "=============================================="
    echo "       VERTEX One-Click Install Script       "
    echo "=============================================="
    echo ""
    local install_dir="$DEFAULT_INSTALL_DIR"
    local port="$DEFAULT_PORT"
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--dir) install_dir="$2"; shift 2 ;;
            -p|--port) port="$2"; shift 2 ;;
            -h|--help) echo "Usage: install.sh [-d DIR] [-p PORT]"; exit 0 ;;
            *) print_error "Unknown option: $1"; exit 1 ;;
        esac
    done
    check_dependencies || exit 1
    setup_directories "$install_dir" || { cleanup; exit 1; }
    generate_docker_compose "$install_dir" "$port" || { cleanup; exit 1; }
    start_services "$install_dir" || { cleanup; exit 1; }
    sleep 5
    show_result "$install_dir" "$port"
}

main "$@"
