#!/bin/bash
# VERTEX One-Click Install Script
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

DEFAULT_INSTALL_DIR="/opt/vertex"
DEFAULT_PORT="3000"
VERTEX_IMAGE="fc0012/vertex:stable"

INSTALL_DIR=""
CREATED_RESOURCES=()

# Print functions
print_banner() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}${BOLD}            VERTEX One-Click Install Script              ${NC}${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_info() { echo -e "  ${BLUE}▶${NC} $1"; }
print_success() { echo -e "  ${GREEN}✔${NC} $1"; }
print_warning() { echo -e "  ${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "  ${RED}✖${NC} $1"; }
print_step() { echo -e "\n${BOLD}[$1/$2]${NC} ${CYAN}$3${NC}"; }

check_docker() {
    if command -v docker &> /dev/null; then
        local version=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
        print_success "Docker ${version}"
        return 0
    else
        print_error "Docker not installed"
        echo -e "      Install: ${YELLOW}curl -fsSL https://get.docker.com | bash${NC}"
        return 1
    fi
}

check_docker_compose() {
    if docker compose version &> /dev/null 2>&1; then
        local version=$(docker compose version | grep -oP '\d+\.\d+\.\d+' | head -1)
        print_success "Docker Compose ${version}"
        return 0
    elif command -v docker-compose &> /dev/null; then
        local version=$(docker-compose --version | grep -oP '\d+\.\d+\.\d+' | head -1)
        print_success "Docker Compose ${version}"
        return 0
    else
        print_error "Docker Compose not installed"
        echo -e "      Install: ${YELLOW}apt-get install docker-compose-plugin${NC}"
        return 1
    fi
}

check_dependencies() {
    print_step "1" "4" "Checking dependencies"
    local has_error=0
    check_docker || has_error=1
    check_docker_compose || has_error=1
    [ $has_error -eq 1 ] && { print_error "Missing dependencies"; return 1; }
    return 0
}

setup_directories() {
    local install_dir="${1:-$DEFAULT_INSTALL_DIR}"
    INSTALL_DIR="$install_dir"
    print_step "2" "4" "Setting up directories"
    [ ! -d "$install_dir" ] && { mkdir -p "$install_dir" || return 1; CREATED_RESOURCES+=("$install_dir"); }
    [ ! -d "$install_dir/data" ] && { mkdir -p "$install_dir/data" || return 1; CREATED_RESOURCES+=("$install_dir/data"); }
    chmod 755 "$install_dir" "$install_dir/data" 2>/dev/null || true
    print_success "Created ${install_dir}"
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
trap 'echo ""; print_warning "Interrupted"; cleanup; exit 130' INT TERM

generate_docker_compose() {
    local install_dir="${1:-$INSTALL_DIR}"
    local port="${2:-$DEFAULT_PORT}"
    cat > "$install_dir/docker-compose.yml" << EOF
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
    cat > "$daemon_json" << 'EOF'
{
  "registry-mirrors": ["https://docker.1ms.run", "https://docker.xuanyuan.me"]
}
EOF
    systemctl daemon-reload 2>/dev/null || true
    systemctl restart docker 2>/dev/null || true
    sleep 2
    print_success "Configured Docker mirror"
}

start_services() {
    local install_dir="${1:-$INSTALL_DIR}"
    print_step "3" "4" "Starting VERTEX"
    configure_mirror
    print_info "Pulling image..."
    cd "$install_dir"
    
    # Suppress warnings and verbose output
    if docker compose version &> /dev/null 2>&1; then
        docker compose pull 2>&1 | grep -v "WARN\|version" || true
        print_success "Image pulled"
        print_info "Starting container..."
        docker compose up -d 2>&1 | grep -v "WARN\|version" || true
    else
        docker-compose pull 2>&1 | grep -v "WARN\|version" || true
        print_success "Image pulled"
        print_info "Starting container..."
        docker-compose up -d 2>&1 | grep -v "WARN\|version" || true
    fi
    print_success "VERTEX is running"
}

show_result() {
    local install_dir="${1:-$INSTALL_DIR}"
    local port="${2:-$DEFAULT_PORT}"
    local server_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    
    print_step "4" "4" "Finishing up"
    print_info "Waiting for initialization..."
    
    local password_file="$install_dir/data/data/password"
    local password=""
    local retry=0
    while [ $retry -lt 30 ]; do
        if [ -f "$password_file" ]; then
            password=$(cat "$password_file" 2>/dev/null)
            [ -n "$password" ] && break
        fi
        sleep 1
        retry=$((retry + 1))
    done
    print_success "VERTEX is ready"
    
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}${GREEN}${BOLD}              ✔ Installation Complete!                    ${NC}${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BOLD}Access URL${NC}"
    echo -e "    Local:    ${CYAN}http://localhost:${port}${NC}"
    echo -e "    Network:  ${CYAN}http://${server_ip}:${port}${NC}"
    echo ""
    echo -e "  ${BOLD}Login Credentials${NC}"
    echo -e "    Username: ${YELLOW}admin${NC}"
    if [ -n "$password" ]; then
        echo -e "    Password: ${YELLOW}${password}${NC}"
    else
        if [ -f "$install_dir/data/data/setting.json" ]; then
            echo -e "    Password: ${YELLOW}(use your previous password)${NC}"
        else
            echo -e "    Password: ${YELLOW}cat ${install_dir}/data/data/password${NC}"
        fi
    fi
    echo ""
    echo -e "  ${BOLD}Commands${NC}"
    echo -e "    Start:  ${GREEN}cd ${install_dir} && docker compose up -d${NC}"
    echo -e "    Stop:   ${GREEN}cd ${install_dir} && docker compose down${NC}"
    echo -e "    Logs:   ${GREEN}cd ${install_dir} && docker compose logs -f${NC}"
    echo ""
}

main() {
    print_banner
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
    show_result "$install_dir" "$port"
}

main "$@"
