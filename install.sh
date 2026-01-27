#!/bin/bash
# VERTEX One-Click Install Script with Interactive qBittorrent Installation
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
VERTEX_IMAGE="cczc9962/vertex02:stable"

INSTALL_DIR=""
CREATED_RESOURCES=()

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

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
        CODENAME=$VERSION_CODENAME
    elif [ -f /etc/redhat-release ]; then
        OS="centos"
    else
        OS="unknown"
    fi
}

install_docker_debian() {
    print_info "Installing Docker on Debian/Ubuntu..."
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release >/dev/null 2>&1
    
    mkdir -p /etc/apt/keyrings
    
    # 确定发行版名称
    local distro="$OS"
    [ "$distro" = "linuxmint" ] || [ "$distro" = "pop" ] && distro="ubuntu"
    
    curl -fsSL "https://download.docker.com/linux/${distro}/gpg" | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # 对于未知版本，使用最新稳定版的 codename
    local codename="${CODENAME:-bookworm}"
    # Debian 13 (trixie) 回退到 bookworm
    [ "$codename" = "trixie" ] && codename="bookworm"
    # Linux Mint / Pop!_OS 使用对应的 Ubuntu codename
    [ "$OS" = "linuxmint" ] && codename="jammy"
    [ "$OS" = "pop" ] && codename="jammy"
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${distro} ${codename} stable" > /etc/apt/sources.list.d/docker.list
    
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin >/dev/null 2>&1
}

install_docker_rhel() {
    print_info "Installing Docker on RHEL/CentOS/Fedora..."
    if command -v dnf &>/dev/null; then
        dnf install -y -q dnf-plugins-core >/dev/null 2>&1
        dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo >/dev/null 2>&1
        dnf install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin >/dev/null 2>&1
    else
        yum install -y -q yum-utils >/dev/null 2>&1
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo >/dev/null 2>&1
        yum install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin >/dev/null 2>&1
    fi
}

install_docker_arch() {
    print_info "Installing Docker on Arch Linux..."
    pacman -Sy --noconfirm docker docker-compose >/dev/null 2>&1
}

install_docker_alpine() {
    print_info "Installing Docker on Alpine..."
    apk add --no-cache docker docker-compose >/dev/null 2>&1
    rc-update add docker boot 2>/dev/null || true
}

install_docker_generic() {
    print_info "Trying generic Docker installation..."
    curl -fsSL https://get.docker.com | bash -s -- 2>/dev/null || {
        print_error "Generic installation failed"
        return 1
    }
}

install_docker() {
    detect_os
    print_info "Detected OS: $OS"
    
    case "$OS" in
        ubuntu|debian|linuxmint|pop)
            install_docker_debian
            ;;
        centos|rhel|fedora|rocky|almalinux|ol)
            install_docker_rhel
            ;;
        arch|manjaro)
            install_docker_arch
            ;;
        alpine)
            install_docker_alpine
            ;;
        *)
            install_docker_generic
            ;;
    esac
    
    systemctl enable docker 2>/dev/null || true
    systemctl start docker 2>/dev/null || service docker start 2>/dev/null || true
    print_success "Docker installed"
}

check_docker() {
    if command -v docker &> /dev/null; then
        local version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        print_success "Docker ${version}"
        return 0
    fi
    return 1
}

check_docker_compose() {
    if docker compose version &> /dev/null 2>&1; then
        local version=$(docker compose version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        print_success "Docker Compose ${version}"
        return 0
    elif command -v docker-compose &> /dev/null; then
        local version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        print_success "Docker Compose ${version}"
        return 0
    fi
    return 1
}

check_dependencies() {
    print_step "1" "5" "Checking dependencies"
    
    if ! check_docker; then
        print_warning "Docker not found, installing..."
        install_docker
        if ! check_docker; then
            print_error "Failed to install Docker"
            return 1
        fi
    fi
    
    if ! check_docker_compose; then
        print_error "Docker Compose not available"
        return 1
    fi
    
    return 0
}

setup_directories() {
    local install_dir="${1:-$DEFAULT_INSTALL_DIR}"
    INSTALL_DIR="$install_dir"
    print_step "2" "5" "Setting up directories"
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
    mkdir -p /etc/docker
    cat > "$daemon_json" << 'EOF'
{
  "registry-mirrors": ["https://docker.1ms.run", "https://docker.xuanyuan.me"]
}
EOF
    systemctl daemon-reload 2>/dev/null || true
    systemctl restart docker 2>/dev/null || service docker restart 2>/dev/null || true
    sleep 2
    print_success "Configured Docker mirror"
}

start_services() {
    local install_dir="${1:-$INSTALL_DIR}"
    print_step "3" "5" "Starting VERTEX"
    configure_mirror
    cd "$install_dir"

    local start_time=$(date +%s)
    echo -ne "  ${BLUE}▶${NC} Pulling image... ${YELLOW}0s${NC}"

    if docker compose version &> /dev/null 2>&1; then
        docker compose pull -q 2>/dev/null &
    else
        docker-compose pull -q 2>/dev/null &
    fi
    local pull_pid=$!

    while kill -0 $pull_pid 2>/dev/null; do
        local elapsed=$(($(date +%s) - start_time))
        echo -ne "\r  ${BLUE}▶${NC} Pulling image... ${YELLOW}${elapsed}s${NC}  "
        sleep 1
    done
    wait $pull_pid

    local total_time=$(($(date +%s) - start_time))
    echo -ne "\r  ${GREEN}✔${NC} Image pulled (${total_time}s)          \n"

    echo -ne "  ${BLUE}▶${NC} Starting container..."
    if docker compose version &> /dev/null 2>&1; then
        docker compose up -d 2>/dev/null
    else
        docker-compose up -d 2>/dev/null
    fi
    echo -e "\r  ${GREEN}✔${NC} Container started     "
    print_success "VERTEX is running"
}

show_vertex_result() {
    local install_dir="${1:-$INSTALL_DIR}"
    local port="${2:-$DEFAULT_PORT}"
    local server_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    
    print_step "4" "5" "Finishing VERTEX setup"
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
    echo -e "${CYAN}║${NC}${GREEN}${BOLD}              ✔ VERTEX Installation Complete!             ${NC}${CYAN}║${NC}"
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

    # 安全提醒
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}${BOLD}${YELLOW}              ⚠️  安全提醒 ⚠️                          ${NC}${RED}║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}为了您的账户安全，请立即更改默认密码！${NC}"
    echo ""
    echo -e "${CYAN}更改 VERTEX 密码:${NC}"
    echo -e "  1. 登录 VERTEX 系统"
    echo -e "  2. 进入 ${GREEN}系统设置 → 安全设置${NC}"
    echo -e "  3. 修改密码并保存"
    echo ""
    echo -e "${RED}当前使用的是默认密码，存在安全风险！${NC}"
    echo ""
}

# ============================================
# 自动安装 qBittorrent Dedicated Seedbox
# ============================================

seedbox_menu() {
    clear
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}${BOLD}       调用 jerry048 Seedbox 安装模块                  ${NC}${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # 生成随机用户名和密码
    local sb_user="qb_$(head /dev/urandom | tr -dc a-z0-9 | head -c 8)"
    local sb_pass=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 16)

    # 自动检测系统内存并设置为八分之一
    local total_mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local total_mem_gb=$((total_mem_kb / 1024 / 1024))
    local sb_cache=$((total_mem_gb / 8))
    # 转换为 MiB (1 GiB = 1024 MiB)
    local cache_mib=$((sb_cache * 1024))

    # 确保缓存大小至少为 256 MiB
    if [ $cache_mib -lt 256 ]; then
        cache_mib=256
        sb_cache=1
    fi

    # 设置 qBittorrent 和 libtorrent 版本（使用稳定版本）
    local qb_version="4.3.9"
    local lt_version="v1.2.19"

    echo ""
    echo -e "${BLUE}自动配置信息:${NC}"
    echo -e "  用户名: ${YELLOW}${sb_user}${NC}"
    echo -e "  密码: ${YELLOW}${sb_pass}${NC}"
    echo -e "  系统内存: ${YELLOW}${total_mem_gb} GiB${NC}"
    echo -e "  缓存大小: ${YELLOW}${sb_cache} GiB (内存的1/8，最小 256 MiB)${NC}"
    echo -e "  qBittorrent 版本: ${YELLOW}${qb_version}${NC}"
    echo -e "  libtorrent 版本: ${YELLOW}${lt_version}${NC}"
    echo -e "  网络优化: ${YELLOW}BBRx${NC}"
    echo ""

    print_info "正在启动安装程序，请稍候..."

    print_step "5" "5" "Installing qBittorrent Dedicated Seedbox"
    if command -v wget &> /dev/null; then
        bash <(wget -qO- https://raw.githubusercontent.com/jerry048/Dedicated-Seedbox/main/Install.sh) \
            -u "$sb_user" \
            -p "$sb_pass" \
            -c "$cache_mib" \
            -q "$qb_version" \
            -l "$lt_version" \
            -x
    elif command -v curl &> /dev/null; then
        bash <(curl -sSL https://raw.githubusercontent.com/jerry048/Dedicated-Seedbox/main/Install.sh) \
            -u "$sb_user" \
            -p "$sb_pass" \
            -c "$cache_mib" \
            -q "$qb_version" \
            -l "$lt_version" \
            -x
    else
        print_error "Neither wget nor curl is available"
        return 1
    fi

    print_success "qBittorrent installation completed"

    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}${GREEN}${BOLD}         ✔ qBittorrent Installation Complete!          ${NC}${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BOLD}qBittorrent Access${NC}"
    echo -e "    Web UI:  ${CYAN}http://$(hostname -I 2>/dev/null | awk '{print $1}'):8080${NC}"
    echo -e "    Username: ${YELLOW}${sb_user}${NC}"
    echo -e "    Password: ${YELLOW}${sb_pass}${NC}"
    echo ""

    # 安全提醒
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}${BOLD}${YELLOW}              ⚠️  安全提醒 ⚠️                          ${NC}${RED}║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}请妥善保存您的登录凭据！${NC}"
    echo ""
    echo -e "${CYAN}更改 qBittorrent 密码:${NC}"
    echo -e "  1. 登录 qBittorrent Web UI"
    echo -e "  2. 进入 ${GREEN}工具 → 选项${NC}"
    echo -e "  3. 选择 ${GREEN}Web UI${NC} 标签"
    echo -e "  4. 修改密码并保存"
    echo ""
    echo -e "${RED}请务必保存以上凭据信息！${NC}"
    echo ""
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -d, --dir DIR      Installation directory (default: /opt/vertex)"
    echo "  -p, --port PORT    VERTEX port (default: 3000)"
    echo "  --skip-qb          Skip qBittorrent installation prompt"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Notes:"
    echo "  - After VERTEX installation, you will be prompted to install qBittorrent"
    echo "  - qBittorrent uses jerry048's Dedicated-Seedbox installation script"
    echo "  - Cache size will be automatically set to 1/8 of system memory (min 256 MiB)"
    echo "  - Username and password will be randomly generated for security"
    echo "  - qBittorrent version: 4.3.9, libtorrent version: v1.2.19"
    echo "  - BBRx network optimization will be enabled"
    echo "  - Use --skip-qb to skip the qBittorrent installation prompt"
    echo ""
    echo "Examples:"
    echo "  # Install VERTEX and prompt for qBittorrent installation"
    echo "  $0"
    echo ""
    echo "  # Install with custom directory and port"
    echo "  $0 -d /opt/myvertex -p 8080"
    echo ""
    echo "  # Install VERTEX only (skip qBittorrent prompt)"
    echo "  $0 --skip-qb"
    echo ""
}

main() {
    print_banner
    
    local install_dir="$DEFAULT_INSTALL_DIR"
    local port="$DEFAULT_PORT"
    local skip_qb=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--dir)
                install_dir="$2"
                shift 2
                ;;
            -p|--port)
                port="$2"
                shift 2
                ;;
            --skip-qb)
                skip_qb=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # 安装 VERTEX
    check_dependencies || exit 1
    setup_directories "$install_dir" || { cleanup; exit 1; }
    generate_docker_compose "$install_dir" "$port" || { cleanup; exit 1; }
    start_services "$install_dir" || { cleanup; exit 1; }
    show_vertex_result "$install_dir" "$port"

    # 询问用户是否安装 qBittorrent（除非跳过）
    if [ "$skip_qb" = false ]; then
        echo ""
        echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${CYAN}║${NC}${BOLD}              qBittorrent 安装选项                    ${NC}${CYAN}║${NC}"
        echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}是否安装 qBittorrent Dedicated Seedbox?${NC}"
        echo ""
        echo -e "  qBittorrent 将会自动配置以下信息:"
        echo -e "    - 用户名: ${YELLOW}随机生成 (qb_xxxxxxxx)${NC}"
        echo -e "    - 密码: ${YELLOW}随机生成 (16位字符)${NC}"
        echo -e "    - 缓存大小: ${YELLOW}系统内存的 1/8 (最小 256 MiB)${NC}"
        echo -e "    - qBittorrent 版本: ${YELLOW}4.3.9${NC}"
        echo -e "    - libtorrent 版本: ${YELLOW}v1.2.19${NC}"
        echo -e "    - 网络优化: ${YELLOW}BBRx${NC}"
        echo ""
        echo -e "  安装后访问地址:"
        echo -e "    - Web UI: ${CYAN}http://<服务器IP>:8080${NC}"
        echo ""
        echo -e "${RED}⚠️  注意: 安装后请妥善保存随机生成的用户名和密码！${NC}"
        echo ""

        while true; do
            read -p "是否安装 qBittorrent? [Y/n]: " install_qb
            case $install_qb in
                [Yy]*|"")
                    seedbox_menu
                    break
                    ;;
                [Nn]*)
                    print_info "跳过 qBittorrent 安装"
                    echo ""
                    break
                    ;;
                *)
                    print_error "无效输入，请输入 Y 或 n"
                    ;;
            esac
        done
    fi
}

main "$@"
