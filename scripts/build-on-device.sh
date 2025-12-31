#!/bin/bash
# scripts/build-on-device.sh
# 在 Orange Pi One 设备上直接构建应用
#
# 功能：
# 1. 检查设备环境（Node.js、pnpm、编译工具）
# 2. 在设备上安装依赖并编译 TypeScript
# 3. 在真机上构建 serialport 原生模块（无需 QEMU 模拟）
# 4. 打包为部署文件
#
# 前置条件：
# - 代码已通过 git clone 存在于设备上
# - 可以 SSH 连接到设备
#
# 使用方法:
#   ./scripts/build-on-device.sh                                    # 使用默认配置
#   ./scripts/build-on-device.sh --host 192.168.1.100              # 指定 IP
#   ./scripts/build-on-device.sh --dir ~/projects/node-switch      # 指定代码目录
#   ./scripts/build-on-device.sh --skip-package                    # 仅构建，不打包

set -e

# ============================================
# 配置参数（可通过命令行参数覆盖）
# ============================================
DEVICE_USER="${ORANGEPI_USER:-orangepi}"
DEVICE_HOST="${ORANGEPI_HOST:-192.168.110.220}"
DEVICE_PORT="${ORANGEPI_PORT:-22}"
DEVICE_DIR="${ORANGEPI_DIR:-~/node-switch}"
VERSION="1.0.0"

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

# SSH 命令包装器
ssh_exec() {
    ssh -p "${DEVICE_PORT}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${DEVICE_USER}@${DEVICE_HOST}" "$@"
}

# 检查本地依赖
check_local_dependencies() {
    log_step "检查本地依赖..."

    if ! command -v ssh &> /dev/null; then
        log_error "ssh 客户端未安装"
        exit 1
    fi

    log_success "本地依赖检查通过"
}

# 测试设备连接
test_device_connection() {
    log_step "测试设备连接..."

    if ! ssh_exec "echo 'Connection test'" &> /dev/null; then
        log_error "无法连接到 Orange Pi One (${DEVICE_USER}@${DEVICE_HOST}:${DEVICE_PORT})"
        echo ""
        echo "请检查:"
        echo "  1. 设备 IP 地址是否正确: ${DEVICE_HOST}"
        echo "  2. 设备是否开机并连接网络"
        echo "  3. SSH 服务是否运行"
        echo "  4. 用户名是否正确: ${DEVICE_USER}"
        echo ""
        echo "可以通过设置环境变量覆盖配置:"
        echo "  export ORANGEPI_USER=your-user"
        echo "  export ORANGEPI_HOST=192.168.1.100"
        echo "  export ORANGEPI_PORT=22"
        exit 1
    fi

    log_success "设备连接正常"
}

# 检查代码目录是否存在
check_code_directory() {
    log_step "检查设备上的代码目录..."

    local dir_exists=$(ssh_exec "test -d ${DEVICE_DIR} && echo 'exists' || echo 'not found'")

    if [[ "$dir_exists" == "not found" ]]; then
        log_error "代码目录不存在: ${DEVICE_DIR}"
        echo ""
        echo "请先在设备上克隆代码:"
        echo "  ssh ${DEVICE_USER}@${DEVICE_HOST}"
        echo "  git clone <repository-url> ${DEVICE_DIR}"
        echo ""
        echo "或使用 --dir 参数指定正确的目录"
        exit 1
    fi

    log_success "代码目录存在: ${DEVICE_DIR}"
}

# 检查设备环境
check_device_environment() {
    log_step "检查设备环境..."

    local arch=$(ssh_exec "uname -m")
    if [[ "$arch" != "armv7l" ]]; then
        log_warn "设备架构不是 ARM v7 (检测到: $arch)"
    else
        log_success "设备架构: $arch (Orange Pi One)"
    fi

    local node_version=$(ssh_exec "node --version 2>/dev/null || echo 'not installed'")
    if [[ "$node_version" == "not installed" ]]; then
        log_error "设备上未安装 Node.js"
        echo ""
        echo "请在 Orange Pi One 上安装 Node.js 20.x:"
        echo "  ssh ${DEVICE_USER}@${DEVICE_HOST}"
        echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        exit 1
    fi

    log_success "Node.js 版本: $node_version"

    local pnpm_version=$(ssh_exec "pnpm --version 2>/dev/null || echo 'not installed'")
    if [[ "$pnpm_version" == "not installed" ]]; then
        log_warn "pnpm 未安装，将自动安装"
        ssh_exec "npm install -g pnpm" || {
            log_error "pnpm 安装失败"
            exit 1
        }
        log_success "pnpm 安装完成"
    else
        log_success "pnpm 版本: $pnpm_version"
    fi

    # 检查编译工具
    local has_gcc=$(ssh_exec "which gcc &> /dev/null && echo 'yes' || echo 'no'")
    if [[ "$has_gcc" == "no" ]]; then
        log_warn "缺少编译工具，正在安装..."
        ssh_exec "sudo apt-get update && sudo apt-get install -y python3 make g++" || {
            log_error "编译工具安装失败"
            exit 1
        }
        log_success "编译工具安装完成"
    else
        log_success "编译工具已就绪"
    fi
}

# 在设备上构建
build_on_device() {
    log_step "在设备上构建应用..."

    ssh_exec "cd ${DEVICE_DIR} && bash -s" << 'ENDBUILD'
set -e

echo "[INFO] 清理旧的构建产物..."
rm -rf packages/*/dist

echo "[INFO] 安装依赖..."
pnpm install --frozen-lockfile

echo "[INFO] 编译 TypeScript (shared)..."
pnpm --filter shared build

echo "[INFO] 编译 TypeScript (core)..."
pnpm --filter core build

echo "[INFO] 编译 TypeScript (backend)..."
pnpm --filter backend build

echo "[INFO] 编译 TypeScript (frontend)..."
pnpm --filter frontend build

echo "[SUCCESS] TypeScript 编译完成"
ENDBUILD

    log_success "应用构建完成"
}

# 在设备上创建部署包
create_deployment_package() {
    log_step "创建部署包..."

    ssh_exec "cd ${DEVICE_DIR} && bash -s" << 'ENDPACKAGE'
set -e

VERSION="1.0.0"
OUTPUT_DIR="${DEVICE_DIR}/dist/node-switch-v${VERSION}-arm7"

echo "[INFO] 创建部署目录..."
rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}/app"
mkdir -p "${OUTPUT_DIR}/public"

echo "[INFO] 复制构建产物..."
cp -r packages/backend/dist "${OUTPUT_DIR}/app/backend"
cp -r packages/core/dist "${OUTPUT_DIR}/app/core"
cp -r packages/shared/dist "${OUTPUT_DIR}/app/shared"
cp -r packages/frontend/dist "${OUTPUT_DIR}/public"

echo "[INFO] 复制生产依赖..."
mkdir -p "${OUTPUT_DIR}/app/node_modules"
# 使用 rsync 只复制生产依赖
rsync -a --delete \
  --exclude='*/node_modules/.bin/*' \
  --exclude='*/node_modules/.cache/*' \
  --exclude='*/node_modules/*/*.test.js' \
  --exclude='*/node_modules/*/*.spec.js' \
  node_modules/ "${OUTPUT_DIR}/app/node_modules/"

# 重新安装确保只有生产依赖
cd "${OUTPUT_DIR}/app"
CI=true pnpm prune --prod || true
pnpm install --prod --frozen-lockfile

echo "[INFO] 创建启动脚本..."
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
    nohup "$NODE_BIN" loader.js > "$LOG_FILE" 2>&1 &
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

echo "[INFO] 创建 loader.js..."
cat > "${OUTPUT_DIR}/app/loader.js" << 'EOF'
try {
  require('./backend/index.cjs');
} catch (error) {
  console.error('[FATAL] Failed to load backend application');
  console.error('Error details:', error);
  process.exit(1);
}
EOF

echo "[INFO] 复制配置文件..."
[ -f "config.json5" ] && cp config.json5 "${OUTPUT_DIR}/"
[ -f ".env.example" ] && cp .env.example "${OUTPUT_DIR}/.env.example"

echo "[INFO] 打包部署文件..."
cd "${OUTPUT_DIR}"
tar -czf "../node-switch-v${VERSION}-arm7.tar.gz" .

local size=$(du -h "../node-switch-v${VERSION}-arm7.tar.gz" | cut -f1)
echo "[SUCCESS] 部署包创建完成: ${DEVICE_DIR}/dist/node-switch-v${VERSION}-arm7.tar.gz (${size})"
ENDPACKAGE

    log_success "部署包创建完成"
}

# 显示使用帮助
show_help() {
    cat << EOF
用法: $0 [选项]

选项:
  -h, --help              显示此帮助信息
  --host HOST             设备 IP 地址 (默认: 192.168.110.220)
  --user USER             SSH 用户名 (默认: orangepi)
  --port PORT             SSH 端口 (默认: 22)
  --dir DIR               设备上的代码目录 (默认: ~/node-switch)
  --skip-build            跳过构建，仅打包
  --skip-package          跳过打包，仅构建

环境变量:
  ORANGEPI_HOST           设备 IP 地址
  ORANGEPI_USER           SSH 用户名
  ORANGEPI_PORT           SSH 端口
  ORANGEPI_DIR            设备上的代码目录

前置条件:
  1. 代码已存在于设备上（通过 git clone 或其他方式）
  2. 设备已安装 Node.js 20.x
  3. 可以 SSH 连接到设备

示例:
  # 使用默认配置构建
  $0

  # 指定设备 IP 和代码目录
  $0 --host 192.168.1.100 --dir ~/projects/node-switch

  # 仅构建（不打包）
  $0 --skip-package

配置文件:
  创建 ~/.node-switch-config 来覆盖默认配置:
    export ORANGEPI_USER="orangepi"
    export ORANGEPI_HOST="192.168.110.220"
    export ORANGEPI_PORT="22"
    export ORANGEPI_DIR="~/node-switch"
EOF
}

# ============================================
# 主函数
# ============================================
main() {
    local SKIP_BUILD=false
    local SKIP_PACKAGE=false

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --host)
                DEVICE_HOST="$2"
                shift 2
                ;;
            --user)
                DEVICE_USER="$2"
                shift 2
                ;;
            --port)
                DEVICE_PORT="$2"
                shift 2
                ;;
            --dir)
                DEVICE_DIR="$2"
                shift 2
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-package)
                SKIP_PACKAGE=true
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
    echo "  Orange Pi One 真机构建脚本"
    echo "  版本: ${VERSION}"
    echo "================================================"
    echo ""
    echo "配置:"
    echo "  设备: ${DEVICE_USER}@${DEVICE_HOST}:${DEVICE_PORT}"
    echo "  目录: ${DEVICE_DIR}"
    echo ""

    # 执行流程
    check_local_dependencies
    test_device_connection
    check_code_directory
    check_device_environment

    if [ "$SKIP_BUILD" = false ]; then
        build_on_device
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
    log_success "真机构建完成！"
    echo "================================================"
    echo ""
    echo "部署包位置:"
    echo "  ${DEVICE_DIR}/dist/node-switch-v${VERSION}-arm7.tar.gz"
    echo ""
    echo "在设备上解压并启动:"
    echo "  ssh ${DEVICE_USER}@${DEVICE_HOST}"
    echo "  cd ${DEVICE_DIR}/dist"
    echo "  tar -xzf node-switch-v${VERSION}-arm7.tar.gz -C node-switch-v${VERSION}-arm7"
    echo "  cd node-switch-v${VERSION}-arm7"
    echo "  ./start.sh start"
    echo ""
}

main "$@"
