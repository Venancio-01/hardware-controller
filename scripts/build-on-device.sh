#!/bin/bash
# scripts/build-on-device.sh
# 在 Orange Pi One 设备上直接构建应用（本脚本直接在设备上运行）
#
# 功能：
# 1. 检查本地环境（Node.js、pnpm、编译工具）
# 2. 安装依赖并编译 TypeScript
# 3. 在真机上构建 serialport 原生模块
# 4. 打包为部署文件
#
# 前置条件：
# - 本脚本在 Orange Pi One 设备上运行
# - 代码已存在于当前目录
# - 已安装 Node.js 20.x
#
# 使用方法:
#   ./scripts/build-on-device.sh                    # 完整构建流程
#   ./scripts/build-on-device.sh --skip-package     # 仅构建，不打包
#   ./scripts/build-on-device.sh --clean            # 清理后构建

set -e

# 版本配置
VERSION="1.0.0"
OUTPUT_DIR="dist/node-switch-v${VERSION}-arm7"
export NODE_ENV=production
# 优化构建配置：跳过类型声明生成
export NO_DTS=true

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# 检查当前目录
check_current_directory() {
    log_step "检查当前目录..."

    if [ ! -f "package.json" ] || [ ! -d "packages" ]; then
        log_error "当前目录不是有效的项目根目录"
        echo ""
        echo "请在项目根目录下运行此脚本"
        exit 1
    fi

    log_success "项目根目录: $(pwd)"
}

# 检查环境
check_environment() {
    log_step "检查本地环境..."

    # 检查架构
    local arch=$(uname -m)
    if [[ "$arch" != "armv7l" ]]; then
        log_warn "设备架构不是 ARM v7 (检测到: $arch)"
    else
        log_success "设备架构: $arch (Orange Pi One)"
    fi

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        echo ""
        echo "请先安装 Node.js 20.x:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        exit 1
    fi

    local node_version=$(node --version)
    log_success "Node.js 版本: $node_version"

    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        log_warn "pnpm 未安装，正在安装..."
        npm install -g pnpm || {
            log_error "pnpm 安装失败"
            exit 1
        }
        log_success "pnpm 安装完成"
    fi

    local pnpm_version=$(pnpm --version)
    log_success "pnpm 版本: $pnpm_version"

    # 检查编译工具
    if ! command -v gcc &> /dev/null; then
        log_warn "缺少编译工具，正在安装..."
        sudo apt-get update && sudo apt-get install -y python3 make g++ || {
            log_error "编译工具安装失败"
            exit 1
        }
        log_success "编译工具安装完成"
    else
        log_success "编译工具已就绪"
    fi
}

# 配置 Swap
setup_swap() {
    log_step "检查 Swap 配置..."

    # 检查是否已有 swap
    if swapon --show | grep -q "partition\|file"; then
        log_success "Swap 已启用"
        return
    fi

    # 检查是否有足够的空间 (需要 sudo)
    if [ "$(id -u)" -eq 0 ]; then
        log_info "正在创建 1GB Swap 文件..."

        # 创建 swap 文件
        fallocate -l 1G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=1024
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile

        # 写入 fstab (可选，暂时仅当前会话生效)
        # echo '/swapfile none swap sw 0 0' >> /etc/fstab

        log_success "Swap 创建并启用成功 (1GB)"
    else
        log_warn "非 root 用户，跳过 Swap 创建。如果内存不足可能导致构建失败。"
    fi
}

# 清理旧构建
clean_build() {
    log_step "清理旧构建产物..."

    rm -rf packages/*/dist
    rm -rf dist

    log_success "清理完成"
}

# 安装依赖
install_dependencies() {
    log_step "安装依赖..."

    pnpm install --frozen-lockfile

    log_success "依赖安装完成"
}

# 编译 TypeScript
build_typescript() {
    log_step "编译 TypeScript..."

    log_info "编译 shared..."
    pnpm --filter shared build

    log_info "编译 core..."
    pnpm --filter core build

    log_info "编译 backend..."
    pnpm --filter backend build

    # frontend 已在 x86 环境下构建，跳过以避免 ARM v7l 环境下的 TailwindCSS Oxide 问题
    log_info "跳过 frontend 构建（使用已有产物）..."
    # pnpm --filter frontend build

    log_success "TypeScript 编译完成"
}

# 创建部署包
create_deployment_package() {
    log_step "创建部署包..."

    # 创建目录
    rm -rf "${OUTPUT_DIR}"
    mkdir -p "${OUTPUT_DIR}/app"
    mkdir -p "${OUTPUT_DIR}/public"

    # 复制构建产物
    log_info "复制构建产物..."
    cp -r packages/backend/dist "${OUTPUT_DIR}/app/backend"
    cp -r packages/core/dist "${OUTPUT_DIR}/app/core"
    cp -r packages/shared/dist "${OUTPUT_DIR}/app/shared"
    cp -r packages/frontend/dist "${OUTPUT_DIR}/public"

    # 复制生产依赖（优化版：只复制必要的模块）
    log_info "复制生产依赖..."
    mkdir -p "${OUTPUT_DIR}/app/node_modules"

    # 只复制 external 声明的必要模块
    # serialport - 原生二进制模块
    # socket.io - 保持运行时灵活性
    # shared - workspace 依赖
    for module in serialport socket.io shared; do
        if [ -d "node_modules/$module" ]; then
            log_info "  复制 $module..."
            cp -r "node_modules/$module" "${OUTPUT_DIR}/app/node_modules/"
        fi
    done

    # 复制 pnpm store 结构（pnpm 使用符号链接，需要保留 .pnpm 中的实际包）
    log_info "  复制 pnpm store 结构..."
    if [ -d "node_modules/.pnpm" ]; then
        mkdir -p "${OUTPUT_DIR}/app/node_modules/.pnpm"

        # 只复制必要的包从 .pnpm store
        # serialport 及其依赖
        find node_modules/.pnpm -maxdepth 1 -name "serialport@*" -exec cp -r {} "${OUTPUT_DIR}/app/node_modules/.pnpm/" \; 2>/dev/null || true

        # socket.io 及其依赖（socket.io 依赖很多包，包括 engine.io, socket.io-parser 等）
        find node_modules/.pnpm -maxdepth 1 -name "socket.io@*" -exec cp -r {} "${OUTPUT_DIR}/app/node_modules/.pnpm/" \; 2>/dev/null || true
        find node_modules/.pnpm -maxdepth 1 -name "engine.io@*" -exec cp -r {} "${OUTPUT_DIR}/app/node_modules/.pnpm/" \; 2>/dev/null || true
        find node_modules/.pnpm -maxdepth 1 -name "socket.io-parser@*" -exec cp -r {} "${OUTPUT_DIR}/app/node_modules/.pnpm/" \; 2>/dev/null || true

        # shared workspace 包
        find node_modules/.pnpm -maxdepth 1 -name "shared@*" -exec cp -r {} "${OUTPUT_DIR}/app/node_modules/.pnpm/" \; 2>/dev/null || true
    fi

    log_success "依赖复制完成（已优化，仅包含必要模块）"

    # 创建启动脚本
    log_info "创建启动脚本..."
    cat > "${OUTPUT_DIR}/start.sh" << 'EOF'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN=${NODE_BIN:-node}
APP_DIR="$SCRIPT_DIR/app"
PID_FILE="$SCRIPT_DIR/.node-switch.pid"
LOG_FILE="$SCRIPT_DIR/node-switch.log"

export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

start() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Node Switch 已在运行 (PID: $(cat $PID_FILE))"
        return 0
    fi

    if [ -f "$LOG_FILE" ]; then
        mv "$LOG_FILE" "$LOG_FILE.old"
    fi

    echo "启动 Node Switch..."
    cd "$APP_DIR"
    nohup "$NODE_BIN" loader.cjs > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 2

    if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Node Switch 已启动 (PID: $(cat $PID_FILE))"
        echo "日志文件: $LOG_FILE"
    else
        echo "启动失败，查看日志: $LOG_FILE"
        rm -f "$PID_FILE"
        return 1
    fi
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Node Switch 未运行"
        return 0
    fi

    local pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
        echo "停止 Node Switch (PID: $pid)..."
        kill "$pid"
        local count=0
        while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
            sleep 1
            ((count++))
        done
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid"
        fi
    fi
    rm -f "$PID_FILE"
    echo "Node Switch 已停止"
}

restart() {
    stop
    sleep 1
    start
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Node Switch 正在运行 (PID: $(cat $PID_FILE))"
        echo "监听端口: $PORT"
    else
        echo "Node Switch 未运行"
        [ -f "$PID_FILE" ] && rm -f "$PID_FILE"
    fi
}

logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo "日志文件不存在: $LOG_FILE"
    fi
}

case "${1:-start}" in
    start) start ;;
    stop) stop ;;
    restart) restart ;;
    status) status ;;
    logs) logs ;;
    *) echo "用法: $0 {start|stop|restart|status|logs}" ; exit 1 ;;
esac
EOF

    chmod +x "${OUTPUT_DIR}/start.sh"

    # 创建 loader.cjs
    log_info "创建 loader.cjs..."
    cat > "${OUTPUT_DIR}/app/loader.cjs" << 'EOF'
try {
  require('./backend/index.cjs');
} catch (error) {
  console.error('[FATAL] Failed to load backend application');
  console.error('Error details:', error);
  process.exit(1);
}
EOF

    # 复制配置文件
    log_info "复制配置文件..."
    [ -f "config.json5" ] && cp config.json5 "${OUTPUT_DIR}/"
    [ -f ".env.example" ] && cp .env.example "${OUTPUT_DIR}/.env.example"

    # 打包
    log_info "打包部署文件..."
    cd "${OUTPUT_DIR}"
    tar -czf "../node-switch-v${VERSION}-arm7.tar.gz" .
    cd - > /dev/null

    local size=$(du -h "dist/node-switch-v${VERSION}-arm7.tar.gz" | cut -f1)

    log_success "部署包创建完成"
    echo ""
    echo "  部署包: dist/node-switch-v${VERSION}-arm7.tar.gz (${size})"
    echo "  目录: ${OUTPUT_DIR}/"
}

# 显示使用帮助
show_help() {
    cat << EOF
用法: $0 [选项]

选项:
  -h, --help              显示此帮助信息
  --clean                 构建前清理旧产物
  --skip-build            跳过构建，仅打包
  --skip-package          跳过打包，仅构建
  --only-clean            仅清理，不构建

环境要求:
  - Orange Pi One (ARM v7)
  - Node.js 20.x
  - pnpm (会自动安装)
  - python3, make, g++ (会自动安装)

示例:
  # 完整构建流程
  $0

  # 清理后构建
  $0 --clean

  # 仅构建（不打包）
  $0 --skip-package

  # 仅清理
  $0 --only-clean

部署步骤:
  1. 构建完成后，部署包位于: dist/node-switch-v${VERSION}-arm7.tar.gz
  2. 解压到目标目录:
     tar -xzf dist/node-switch-v${VERSION}-arm7.tar.gz -C /opt/node-switch
  3. 启动应用:
     cd /opt/node-switch
     ./start.sh start
EOF
}

# ============================================
# 主函数
# ============================================
main() {
    local DO_CLEAN=false
    local SKIP_BUILD=false
    local SKIP_PACKAGE=false
    local ONLY_CLEAN=false

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --clean)
                DO_CLEAN=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-package)
                SKIP_PACKAGE=true
                shift
                ;;
            --only-clean)
                ONLY_CLEAN=true
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    echo ""
    echo "================================================"
    echo "  Orange Pi One 本地构建脚本"
    echo "  版本: ${VERSION}"
    echo "================================================"
    echo ""

    # 仅清理
    if [ "$ONLY_CLEAN" = true ]; then
        clean_build
        echo ""
        log_success "清理完成"
        exit 0
    fi

    # 执行流程
    check_current_directory
    check_environment
    setup_swap

    if [ "$DO_CLEAN" = true ]; then
        clean_build
    fi

    if [ "$SKIP_BUILD" = false ]; then
        install_dependencies
        build_typescript
    else
        log_info "跳过构建 (--skip-build)"
    fi

    if [ "$SKIP_PACKAGE" = false ]; then
        create_deployment_package
    else
        log_info "跳过打包 (--skip-package)"
    fi

    echo ""
    echo "================================================"
    log_success "构建完成！"
    echo "================================================"
    echo ""
}

main "$@"
