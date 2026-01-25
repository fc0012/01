#!/bin/bash
# Vertex 鉴权问题诊断脚本
# 用于排查"安装后登录，鉴权失效"问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}            Vertex 鉴权问题诊断工具                    ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_info() { echo -e "  ${BLUE}ℹ${NC} $1"; }
print_success() { echo -e "  ${GREEN}✔${NC} $1"; }
print_warning() { echo -e "  ${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "  ${RED}✖${NC} $1"; }
print_step() { echo -e "\n${BOLD}[步骤 $1]${NC} $2"; }

# 获取安装目录
get_install_dir() {
    local install_dir="/opt/vertex"
    if [ -f "/opt/vertex/docker-compose.yml" ]; then
        install_dir="/opt/vertex"
    elif [ -f "/vertex/docker-compose.yml" ]; then
        install_dir="/vertex"
    else
        read -p "请输入 Vertex 安装目录 [默认: /opt/vertex]: " install_dir
        install_dir=${install_dir:-/opt/vertex}
    fi
    echo "$install_dir"
}

# 检查 Docker 环境
check_docker() {
    print_step "1" "检查 Docker 环境"

    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        return 1
    fi
    print_success "Docker 已安装: $(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"

    if ! docker compose version &> /dev/null 2>&1 && ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装"
        return 1
    fi
    print_success "Docker Compose 已安装"
}

# 检查容器状态
check_container() {
    print_step "2" "检查 Vertex 容器状态"

    local install_dir="$1"
    cd "$install_dir" 2>/dev/null || {
        print_error "无法进入安装目录: $install_dir"
        return 1
    }

    if ! docker compose ps &> /dev/null; then
        print_error "docker-compose.yml 文件不存在或格式错误"
        return 1
    fi

    local container_status=$(docker compose ps | grep vertex | awk '{print $4, $5}')
    if [ -z "$container_status" ]; then
        print_warning "Vertex 容器未运行"
        print_info "尝试启动容器..."
        docker compose up -d || {
            print_error "启动容器失败"
            return 1
        }
        sleep 3
    fi

    print_success "Vertex 容器状态: $container_status"
}

# 检查 Redis 服务
check_redis() {
    print_step "3" "检查 Redis 服务"

    local install_dir="$1"

    # 检查 Redis 是否在容器内运行
    print_info "检查容器内 Redis 进程..."
    local redis_pid=$(docker exec vertex 2>/dev/null pgrep redis-server || echo "")
    if [ -n "$redis_pid" ]; then
        print_success "Redis 进程运行中 (PID: $redis_pid)"
    else
        print_error "Redis 进程未运行"
        return 1
    fi

    # 检查 Redis 端口
    print_info "检查 Redis 端口..."
    local redis_port=$(docker exec vertex 2>/dev/null printenv REDISPORT || echo "6379")
    print_info "Redis 端口配置: $redis_port"

    # 测试 Redis 连接
    print_info "测试 Redis 连接..."
    local redis_test=$(docker exec vertex 2>/dev/null redis-cli -p $redis_port ping || echo "FAILED")
    if [ "$redis_test" = "PONG" ]; then
        print_success "Redis 连接正常"
    else
        print_error "Redis 连接失败: $redis_test"
        return 1
    fi

    # 检查 Redis 中的 session 数据
    print_info "检查 Redis 中的 session 数据..."
    local session_count=$(docker exec vertex 2>/dev/null redis-cli -p $redis_port KEYS "vertex:sess:*" | wc -l)
    if [ "$session_count" -gt 0 ]; then
        print_success "Redis 中存在 $session_count 个 session"
        docker exec vertex 2>/dev/null redis-cli -p $redis_port KEYS "vertex:sess:*" | head -5 | while read key; do
            print_info "  Session Key: $key"
        done
    else
        print_warning "Redis 中没有 session 数据（正常，如果用户未登录）"
    fi
}

# 检查配置文件
check_config_files() {
    print_step "4" "检查配置文件"

    local install_dir="$1"

    # 检查 setting.json
    print_info "检查 setting.json..."
    if [ ! -f "$install_dir/data/setting.json" ]; then
        print_error "setting.json 文件不存在"
        return 1
    fi

    print_success "setting.json 存在"

    # 检查配置格式
    print_info "验证 setting.json 格式..."
    if docker exec vertex 2>/dev/null node -e "JSON.parse(require('fs').readFileSync('/vertex/data/setting.json', 'utf8'))" 2>/dev/null; then
        print_success "setting.json 格式正确"
    else
        print_error "setting.json 格式错误"
        return 1
    fi

    # 检查认证配置
    print_info "检查认证配置..."
    local username=$(docker exec vertex 2>/dev/null node -e "console.log(JSON.parse(require('fs').readFileSync('/vertex/data/setting.json', 'utf8')).username)" 2>/dev/null)
    local has_password=$(docker exec vertex 2>/dev/null node -e "console.log(JSON.parse(require('fs').readFileSync('/vertex/data/setting.json', 'utf8')).password ? 'yes' : 'no')" 2>/dev/null)
    local has_otp=$(docker exec vertex 2>/dev/null node -e "console.log(JSON.parse(require('fs').readFileSync('/vertex/data/setting.json', 'utf8')).otp ? 'yes' : 'no')" 2>/dev/null)

    if [ -n "$username" ]; then
        print_success "用户名: $username"
    else
        print_error "用户名未配置"
        return 1
    fi

    if [ "$has_password" = "yes" ]; then
        print_success "密码已配置"
    else
        print_error "密码未配置"
        return 1
    fi

    if [ "$has_otp" = "yes" ]; then
        print_success "OTP 已配置"
    else
        print_info "OTP 未配置（可选）"
    fi

    # 检查初始密码文件
    print_info "检查初始密码文件..."
    if [ -f "$install_dir/data/data/password" ]; then
        print_success "初始密码文件存在"
        print_info "  路径: $install_dir/data/data/password"
        print_warning "  如果是首次安装，请使用此文件中的密码登录"
    else
        print_warning "初始密码文件不存在（正常，如果已修改过密码）"
    fi
}

# 检查应用日志
check_app_logs() {
    print_step "5" "检查应用日志"

    local install_dir="$1"

    print_info "检查最近的错误日志..."
    local errors=$(docker logs vertex 2>&1 | grep -i "error\|fail\|exception" | tail -10 || echo "")

    if [ -n "$errors" ]; then
        print_warning "发现以下错误:"
        echo "$errors" | sed 's/^/    /'
    else
        print_success "没有发现明显错误"
    fi

    # 检查 Redis 相关日志
    print_info "检查 Redis 相关日志..."
    local redis_errors=$(docker logs vertex 2>&1 | grep -i "redis" | grep -i "error\|fail\|connection" | tail -5 || echo "")

    if [ -n "$redis_errors" ]; then
        print_warning "发现 Redis 相关错误:"
        echo "$redis_errors" | sed 's/^/    /'
    else
        print_success "没有发现 Redis 相关错误"
    fi

    # 检查 Session 相关日志
    print_info "检查 Session 相关日志..."
    local session_errors=$(docker logs vertex 2>&1 | grep -i "session\|鉴权" | tail -5 || echo "")

    if [ -n "$session_errors" ]; then
        print_info "Session 相关日志:"
        echo "$session_errors" | sed 's/^/    /'
    else
        print_info "没有发现 Session 相关日志"
    fi
}

# 检查网络连接
check_network() {
    print_step "6" "检查网络连接"

    local install_dir="$1"

    # 检查端口映射
    print_info "检查端口映射..."
    local port_mapping=$(docker port vertex 2>/dev/null || echo "")
    if [ -n "$port_mapping" ]; then
        print_success "端口映射:"
        echo "$port_mapping" | sed 's/^/    /'
    else
        print_error "端口映射未配置"
        return 1
    fi

    # 测试 HTTP 访问
    local http_port=$(docker port vertex 2>/dev/null | grep "3000/tcp" | awk -F: '{print $2}' | head -1)
    if [ -n "$http_port" ]; then
        print_info "测试 HTTP 访问 (端口 $http_port)..."
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:$http_port 2>/dev/null | grep -q "200\|302"; then
            print_success "HTTP 访问正常"
        else
            print_warning "HTTP 访问可能有问题"
        fi
    fi
}

# 检查时间同步
check_time_sync() {
    print_step "7" "检查时间同步"

    print_info "检查容器时间..."
    local container_time=$(docker exec vertex 2>/dev/null date || echo "")
    local host_time=$(date || echo "")

    if [ -n "$container_time" ]; then
        print_success "容器时间: $container_time"
    else
        print_error "无法获取容器时间"
        return 1
    fi

    if [ -n "$host_time" ]; then
        print_success "主机时间: $host_time"
    fi

    # 检查时区
    print_info "检查时区配置..."
    local container_tz=$(docker exec vertex 2>/dev/null printenv TZ || echo "")
    if [ -n "$container_tz" ]; then
        print_success "容器时区: $container_tz"
    else
        print_warning "容器时区未配置"
    fi
}

# 提供修复建议
provide_fix_suggestions() {
    print_step "8" "修复建议"

    echo ""
    echo -e "${CYAN}常见的鉴权失效问题和解决方案:${NC}"
    echo ""
    echo "1. ${YELLOW}Redis Session 丢失${NC}"
    echo "   原因: Redis 服务重启或数据丢失"
    echo "   解决: 清除浏览器 cookie，重新登录"
    echo ""
    echo "2. ${YELLOW}配置文件损坏${NC}"
    echo "   原因: setting.json 文件格式错误"
    echo "   解决: 检查并修复配置文件，或从备份恢复"
    echo ""
    echo "3. ${YELLOW}时间不同步${NC}"
    echo "   原因: OTP 验证依赖准确的时间"
    echo "   解决: 同步系统时间，配置正确的时区"
    echo ""
    echo "4. ${YELLOW}Cookie 域名问题${NC}"
    echo "   原因: 浏览器 cookie 域名不匹配"
    echo "   解决: 清除浏览器 cookie 和缓存"
    echo ""
    echo "5. ${YELLOW}Redis 连接失败${NC}"
    echo "   原因: Redis 服务未启动或端口配置错误"
    echo "   解决: 重启容器，检查 REDISPORT 环境变量"
    echo ""
}

# 主函数
main() {
    print_header

    local install_dir=$(get_install_dir)
    print_info "安装目录: $install_dir"
    echo ""

    check_docker || exit 1
    check_container "$install_dir" || exit 1
    check_redis "$install_dir" || true
    check_config_files "$install_dir" || true
    check_app_logs "$install_dir" || true
    check_network "$install_dir" || true
    check_time_sync || true
    provide_fix_suggestions

    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}                  诊断完成                              ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

main "$@"
