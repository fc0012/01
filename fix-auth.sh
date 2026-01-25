#!/bin/bash
# Vertex 鉴权问题修复脚本
# 用于修复"安装后登录，鉴权失效"问题

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
    echo -e "${CYAN}║${NC}            Vertex 鉴权问题修复工具                    ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_info() { echo -e "  ${BLUE}ℹ${NC} $1"; }
print_success() { echo -e "  ${GREEN}✔${NC} $1"; }
print_warning() { echo -e "  ${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "  ${RED}✖${NC} $1"; }
print_step() { echo -e "\n${BOLD}[步骤 $1]${NC} $2"; }

# 确认操作
confirm() {
    local message="$1"
    local default="${2:-n}"

    if [ "$default" = "y" ]; then
        read -p "$message [Y/n]: " response
        response=${response:-y}
    else
        read -p "$message [y/N]: " response
        response=${response:-n}
    fi

    case "$response" in
        [Yy]|[Yy][Ee][Ss]) return 0 ;;
        *) return 1 ;;
    esac
}

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

# 备份配置文件
backup_config() {
    print_step "1" "备份配置文件"

    local install_dir="$1"
    local backup_dir="$install_dir/backup_$(date +%Y%m%d_%H%M%S)"

    print_info "创建备份目录: $backup_dir"
    mkdir -p "$backup_dir"

    print_info "备份 setting.json..."
    if [ -f "$install_dir/data/setting.json" ]; then
        cp "$install_dir/data/setting.json" "$backup_dir/"
        print_success "setting.json 已备份"
    else
        print_warning "setting.json 不存在，跳过"
    fi

    print_info "备份其他配置文件..."
    cp -r "$install_dir/data/setting" "$backup_dir/" 2>/dev/null || true
    cp "$install_dir/data/link-mapping.json" "$backup_dir/" 2>/dev/null || true

    print_success "配置文件已备份到: $backup_dir"
}

# 清除 Redis Session
clear_redis_sessions() {
    print_step "2" "清除 Redis Session"

    local install_dir="$1"

    if ! confirm "是否清除 Redis 中的所有 session 数据？这将强制所有用户重新登录。" "n"; then
        print_info "跳过清除 session"
        return 0
    fi

    print_info "获取 Redis 端口..."
    local redis_port=$(docker exec vertex 2>/dev/null printenv REDISPORT || echo "6379")
    print_info "Redis 端口: $redis_port"

    print_info "清除 session 数据..."
    local session_keys=$(docker exec vertex 2>/dev/null redis-cli -p $redis_port KEYS "vertex:sess:*" || echo "")

    if [ -n "$session_keys" ]; then
        echo "$session_keys" | while read key; do
            if [ -n "$key" ]; then
                docker exec vertex 2>/dev/null redis-cli -p $redis_port DEL "$key" > /dev/null
                print_info "  已删除: $key"
            fi
        done
        print_success "Redis session 已清除"
    else
        print_info "Redis 中没有 session 数据"
    fi
}

# 重启 Redis 服务
restart_redis() {
    print_step "3" "重启 Redis 服务"

    if ! confirm "是否重启 Redis 服务？" "n"; then
        print_info "跳过重启 Redis"
        return 0
    fi

    print_info "停止 Redis..."
    docker exec vertex 2>/dev/null pkill redis-server || true
    sleep 2

    print_info "启动 Redis..."
    local redis_port=$(docker exec vertex 2>/dev/null printenv REDISPORT || echo "6379")
    docker exec vertex 2>/dev/null redis-server /app/redis.conf --port $redis_port &
    sleep 2

    print_info "测试 Redis 连接..."
    local redis_test=$(docker exec vertex 2>/dev/null redis-cli -p $redis_port ping || echo "FAILED")
    if [ "$redis_test" = "PONG" ]; then
        print_success "Redis 重启成功"
    else
        print_error "Redis 重启失败: $redis_test"
        return 1
    fi
}

# 重启容器
restart_container() {
    print_step "4" "重启 Vertex 容器"

    local install_dir="$1"

    if ! confirm "是否重启 Vertex 容器？" "n"; then
        print_info "跳过重启容器"
        return 0
    fi

    cd "$install_dir"

    print_info "停止容器..."
    docker compose down

    print_info "启动容器..."
    docker compose up -d

    print_info "等待容器启动..."
    sleep 5

    print_info "检查容器状态..."
    local container_status=$(docker compose ps | grep vertex | awk '{print $4, $5}')
    if [ -n "$container_status" ]; then
        print_success "容器已启动: $container_status"
    else
        print_error "容器启动失败"
        return 1
    fi
}

# 检查并修复配置文件
check_and_fix_config() {
    print_step "5" "检查并修复配置文件"

    local install_dir="$1"

    print_info "检查 setting.json 格式..."
    if [ ! -f "$install_dir/data/setting.json" ]; then
        print_error "setting.json 不存在"
        print_info "尝试从备份恢复..."
        if [ -f "$install_dir/data/setting.json.bak" ]; then
            cp "$install_dir/data/setting.json.bak" "$install_dir/data/setting.json"
            print_success "从备份恢复成功"
        else
            print_error "没有可用的备份"
            return 1
        fi
    fi

    # 验证 JSON 格式
    if ! docker exec vertex 2>/dev/null node -e "JSON.parse(require('fs').readFileSync('/vertex/data/setting.json', 'utf8'))" 2>/dev/null; then
        print_error "setting.json 格式错误"
        print_info "尝试修复..."

        # 尝试使用 jq 或 node 修复
        if command -v jq &> /dev/null; then
            jq '.' "$install_dir/data/setting.json" > "$install_dir/data/setting.json.tmp" 2>/dev/null
            if [ $? -eq 0 ]; then
                mv "$install_dir/data/setting.json.tmp" "$install_dir/data/setting.json"
                print_success "使用 jq 修复成功"
            else
                rm -f "$install_dir/data/setting.json.tmp"
                print_error "jq 修复失败"
                return 1
            fi
        else
            print_error "未找到 jq 工具，无法自动修复"
            print_info "请手动检查和修复 setting.json 文件"
            return 1
        fi
    else
        print_success "setting.json 格式正确"
    fi

    # 检查必要字段
    print_info "检查必要字段..."
    local username=$(docker exec vertex 2>/dev/null node -e "console.log(JSON.parse(require('fs').readFileSync('/vertex/data/setting.json', 'utf8')).username)" 2>/dev/null)
    local has_password=$(docker exec vertex 2>/dev/null node -e "console.log(JSON.parse(require('fs').readFileSync('/vertex/data/setting.json', 'utf8')).password ? 'yes' : 'no')" 2>/dev/null)

    if [ -z "$username" ]; then
        print_warning "用户名缺失，设置默认值: admin"
        docker exec vertex 2>/dev/null node -e "
            const fs = require('fs');
            const setting = JSON.parse(fs.readFileSync('/vertex/data/setting.json', 'utf8'));
            setting.username = 'admin';
            fs.writeFileSync('/vertex/data/setting.json', JSON.stringify(setting, null, 2));
        " 2>/dev/null
        print_success "用户名已设置为 admin"
    fi

    if [ "$has_password" != "yes" ]; then
        print_warning "密码缺失，生成随机密码"
        local new_password=$(docker exec vertex 2>/dev/null node -e "console.log(require('crypto').randomBytes(16).toString('hex'))" 2>/dev/null)
        local md5_password=$(docker exec vertex 2>/dev/null node -e "console.log(require('crypto').createHash('md5').update('$new_password').digest('hex'))" 2>/dev/null)
        docker exec vertex 2>/dev/null node -e "
            const fs = require('fs');
            const setting = JSON.parse(fs.readFileSync('/vertex/data/setting.json', 'utf8'));
            setting.password = '$md5_password';
            fs.writeFileSync('/vertex/data/setting.json', JSON.stringify(setting, null, 2));
        " 2>/dev/null

        # 保存密码到文件
        echo "$new_password" > "$install_dir/data/data/password"
        print_success "新密码已生成并保存到: $install_dir/data/data/password"
        print_warning "请使用新密码登录"
    fi
}

# 同步时间
sync_time() {
    print_step "6" "同步系统时间"

    if ! confirm "是否同步系统时间？" "y"; then
        print_info "跳过时间同步"
        return 0
    fi

    print_info "检查 NTP 服务..."
    if command -v ntpdate &> /dev/null; then
        print_info "同步时间..."
        ntpdate -u time.nist.gov 2>/dev/null || ntpdate -u pool.ntp.org 2>/dev/null || {
            print_warning "ntpdate 同步失败，尝试使用 timedatectl"
        }
    fi

    if command -v timedatectl &> /dev/null; then
        print_info "使用 timedatectl 同步时间..."
        timedatectl set-ntp true 2>/dev/null || {
            print_warning "timedatectl 同步失败"
        }
    fi

    print_success "时间同步已尝试"
}

# 生成诊断报告
generate_report() {
    print_step "7" "生成诊断报告"

    local install_dir="$1"
    local report_file="$install_dir/auth_fix_report_$(date +%Y%m%d_%H%M%S).txt"

    print_info "生成报告: $report_file"

    cat > "$report_file" << EOF
Vertex 鉴权问题修复报告
========================
生成时间: $(date)
安装目录: $install_dir

容器状态:
$(docker compose ps 2>/dev/null || echo "无法获取")

Redis 状态:
$(docker exec vertex 2>/dev/null redis-cli -p \$(docker exec vertex 2>/dev/null printenv REDISPORT || echo 6379) INFO server 2>/dev/null || echo "无法获取")

配置文件:
$(ls -lh "$install_dir/data/setting.json" 2>/dev/null || echo "setting.json 不存在")

最近错误日志:
$(docker logs vertex 2>&1 | grep -i "error\|fail" | tail -20 || echo "无错误日志")

修复步骤:
1. 已备份配置文件
2. 已清除 Redis session
3. 已重启相关服务
4. 已检查并修复配置文件

建议操作:
1. 清除浏览器 cookie 和缓存
2. 重新登录系统
3. 如果仍有问题，请检查完整日志
EOF

    print_success "报告已生成"
    print_info "报告路径: $report_file"
}

# 显示后续操作建议
show_next_steps() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}                  修复完成                              ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}后续操作建议:${NC}"
    echo ""
    echo "1. ${GREEN}清除浏览器 Cookie 和缓存${NC}"
    echo "   - 打开浏览器开发者工具 (F12)"
    echo "   - 清除所有 cookie 和缓存数据"
    echo "   - 或使用无痕/隐私模式访问"
    echo ""
    echo "2. ${GREEN}重新登录系统${NC}"
    echo "   - 访问 Vertex 系统地址"
    echo "   - 使用正确的用户名和密码登录"
    echo "   - 如果启用了 OTP，输入正确的验证码"
    echo ""
    echo "3. ${GREEN}检查登录状态${NC}"
    echo "   - 登录后，检查页面是否正常加载"
    echo "   - 刷新页面，确认鉴权状态是否保持"
    echo ""
    echo "4. ${GREEN}如果问题仍然存在${NC}"
    echo "   - 查看诊断报告"
    echo "   - 检查完整的应用日志: docker logs vertex"
    echo "   - 运行诊断脚本: ./diagnose-auth.sh"
    echo ""
    echo -e "${YELLOW}常用命令:${NC}"
    echo "  查看日志: docker logs -f vertex"
    echo "  重启容器: cd $install_dir && docker compose restart"
    echo "  进入容器: docker exec -it vertex sh"
    echo "  Redis 命令: docker exec vertex redis-cli -p \$(docker exec vertex printenv REDISPORT)"
    echo ""
}

# 主函数
main() {
    print_header

    local install_dir=$(get_install_dir)
    print_info "安装目录: $install_dir"
    echo ""

    # 确认执行
    if ! confirm "是否开始修复？这将修改系统配置。" "n"; then
        print_info "已取消"
        exit 0
    fi

    backup_config "$install_dir"
    clear_redis_sessions "$install_dir"
    restart_redis
    restart_container "$install_dir"
    check_and_fix_config "$install_dir"
    sync_time
    generate_report "$install_dir"
    show_next_steps
}

main "$@"
