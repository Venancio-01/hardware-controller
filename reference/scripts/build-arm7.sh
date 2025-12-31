#!/bin/bash
# scripts/build-arm7.sh
# 一键构建 ARM v7 部署包（包含 Node.js runtime）
#
# 功能：
# 1. 使用 Docker + QEMU 交叉编译 ARM v7 应用
# 2. 将后端代码编译为 V8 字节码 (.jsc)
# 3. 混淆前端 JavaScript 代码
# 4. 打包为解压即用的部署包
#
# 使用方法:
#   ./scripts/build-arm7.sh          # 构建
#   ./scripts/build-arm7.sh --clean  # 清理并构建

set -e

# 版本配置
VERSION="1.0.0"
OUTPUT_DIR="dist/feed-control-system-v${VERSION}-arm7"
DOCKER_IMAGE="feed-control-system:arm7-build"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! docker buildx version &> /dev/null; then
        log_error "Docker Buildx 未安装，请升级 Docker 或安装 buildx"
        exit 1
    fi

    log_success "依赖检查通过"
}

# 配置 QEMU 支持
setup_qemu() {
    log_info "检查 QEMU ARM 支持..."

    # 只要支持 linux/arm 即可，不强制检查 v7 字符串
    if ! docker buildx ls 2>/dev/null | grep -q "linux/arm"; then
        log_warn "正在配置 QEMU ARM v7 支持..."
        # 尝试运行，但如果失败不阻断，因为可能已经支持
        docker run --privileged --rm tonistiigi/binfmt --install arm || log_warn "QEMU 配置命令失败（可能是权限问题），尝试继续..."
        log_success "QEMU 配置尝试完成"
    else
        log_success "QEMU ARM 平台支持已检测到 (linux/arm)"
    fi
}

# 构建 Docker 镜像
build_docker_image() {
    log_info "构建 ARM v7 Docker 镜像..."
    log_info "这可能需要几分钟时间（QEMU 模拟 ARM 环境较慢）"

    docker buildx build \
        --platform linux/arm/v7 \
        -f Dockerfile.build \
        -t "${DOCKER_IMAGE}" \
        --load \
        .

    log_success "Docker 镜像构建完成"
}

# 提取构建产物
extract_artifacts() {
    log_info "提取构建产物..."

    rm -rf "${OUTPUT_DIR}"
    mkdir -p "${OUTPUT_DIR}/app"
    mkdir -p "${OUTPUT_DIR}/public"
    mkdir -p "${OUTPUT_DIR}/node/bin"

    # 创建临时容器并提取文件
    docker rm -f temp-extract 2>/dev/null || true
    docker create --name temp-extract "${DOCKER_IMAGE}" /bin/true

    # 提取应用代码
    docker cp temp-extract:/app/backend "${OUTPUT_DIR}/app/"
    docker cp temp-extract:/app/core "${OUTPUT_DIR}/app/"
    docker cp temp-extract:/app/shared "${OUTPUT_DIR}/app/"
    docker cp temp-extract:/app/public/. "${OUTPUT_DIR}/public/"
    docker cp temp-extract:/app/node_modules "${OUTPUT_DIR}/app/"

    # [FIX F1] 提取 Node.js runtime，确保与构建使用的版本完全一致
    log_info "从容器中提取 Node.js runtime (确保 bytenode 兼容性)..."
    docker cp temp-extract:/usr/local/bin/node "${OUTPUT_DIR}/node/bin/"

    docker rm temp-extract

    log_success "构建产物提取完成"
}

# 创建启动脚本
create_startup_script() {
    log_info "创建启动脚本..."

    cat > "${OUTPUT_DIR}/start.sh" << 'EOF'
#!/bin/bash
# Feed Control System 启动脚本
# 使用方法: ./start.sh {start|stop|restart|status}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN="$SCRIPT_DIR/node/bin/node"
APP_DIR="$SCRIPT_DIR/app"
PID_FILE="$SCRIPT_DIR/.feed-control-system.pid"
LOG_FILE="$SCRIPT_DIR/feed-control-system.log"

# 设置环境变量
# 默认生产环境，但允许外部覆盖
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

start() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Feed Control System 已在运行 (PID: $(cat $PID_FILE))"
        return 0
    fi

    # [FIX F2] 简单的日志轮转
    if [ -f "$LOG_FILE" ]; then
        mv "$LOG_FILE" "$LOG_FILE.old"
    fi

    echo "启动 Feed Control System..."
    cd "$APP_DIR"
    nohup "$NODE_BIN" loader.cjs > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 2

    if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Feed Control System 已启动 (PID: $(cat $PID_FILE))"
        echo "日志文件: $LOG_FILE"
    else
        echo "启动失败，查看日志: $LOG_FILE"
        rm -f "$PID_FILE"
        return 1
    fi
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Feed Control System 未运行"
        return 0
    fi

    local pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
        echo "停止 Feed Control System (PID: $pid)..."
        kill "$pid"

        # 等待进程退出
        local count=0
        while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
            sleep 1
            ((count++))
        done

        if kill -0 "$pid" 2>/dev/null; then
            echo "进程未响应，强制终止..."
            kill -9 "$pid"
        fi
    fi

    rm -f "$PID_FILE"
    echo "Feed Control System 已停止"
}

restart() {
    stop
    sleep 1
    start
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Feed Control System 正在运行 (PID: $(cat $PID_FILE))"
        echo "监听端口: $PORT"
    else
        echo "Feed Control System 未运行"
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
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
EOF

    chmod +x "${OUTPUT_DIR}/start.sh"

    log_success "启动脚本创建完成"
}

# 创建 loader.js
create_loader() {
    log_info "创建 loader.cjs..."

    # 从源码复制 backend/loader.js 到 app 根目录作为主入口，重命名为 .cjs 以支持 require
    cp packages/backend/src/loader.js "${OUTPUT_DIR}/app/loader.cjs"

    # 修改引用路径：./index.jsc -> ./backend/index.jsc
    sed -i 's|require('\''./index.jsc'\'');|require('\''./backend/index.jsc'\'');|g' "${OUTPUT_DIR}/app/loader.cjs"

    # 复制 core/loader.js 到 app/core/app.cjs (伪装成 app.cjs 以供 backend 调用)
    cp packages/core/src/loader.js "${OUTPUT_DIR}/app/core/app.cjs"
    # core loader 引用 ./app.jsc 是正确的，无需修改

    log_success "loader.cjs 配置完成"
}

# 复制配置文件
copy_config() {
    log_info "复制配置文件..."

    if [ -f "config.json5" ]; then
        cp config.json5 "${OUTPUT_DIR}/"
        log_success "config.json5 已复制"
    else
        log_warn "config.json5 不存在，跳过"
    fi

    # 复制 .env.example 作为参考
    if [ -f ".env.example" ]; then
        cp .env.example "${OUTPUT_DIR}/.env.example"
    fi
}

# 创建打包文件
create_archive() {
    log_info "创建打包文件..."

    cd dist
    tar -czf "feed-control-system-v${VERSION}-arm7.tar.gz" "feed-control-system-v${VERSION}-arm7"
    cd ..

    # 计算文件大小
    local size=$(du -h "dist/feed-control-system-v${VERSION}-arm7.tar.gz" | cut -f1)

    log_success "打包完成: dist/feed-control-system-v${VERSION}-arm7.tar.gz (${size})"
}

# 清理
clean() {
    log_info "清理构建产物..."
    rm -rf dist/feed-control-system-*
    docker rm -f temp-extract 2>/dev/null || true
    log_success "清理完成"
}

# 主函数
main() {
    echo ""
    echo "================================================"
    echo "  Feed Control System ARM v7 构建脚本"
    echo "  版本: ${VERSION}"
    echo "================================================"
    echo ""

    if [ "$1" == "--clean" ]; then
        clean
        shift
    fi

    check_dependencies
    setup_qemu
    build_docker_image
    extract_artifacts
    # download_nodejs  <-- Removed
    create_startup_script
    create_loader
    copy_config
    create_archive

    echo ""
    echo "================================================"
    log_success "构建完成！"
    echo "================================================"
    echo ""
    echo "输出文件: dist/feed-control-system-v${VERSION}-arm7.tar.gz"
    echo ""
    echo "部署步骤:"
    echo "  1. 复制到 OrangePi:"
    echo "     scp dist/feed-control-system-v${VERSION}-arm7.tar.gz user@orangepi:~/"
    echo ""
    echo "  2. 在 OrangePi 上解压并启动:"
    echo "     tar -xzf feed-control-system-v${VERSION}-arm7.tar.gz"
    echo "     cd feed-control-system-v${VERSION}-arm7"
    echo "     ./start.sh"
    echo ""
    echo "  3. 查看状态/日志:"
    echo "     ./start.sh status"
    echo "     ./start.sh logs"
    echo ""
}

main "$@"
