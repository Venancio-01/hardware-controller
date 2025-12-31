#!/bin/bash
# scripts/build-arm7-plain.sh
# 一键构建 ARM v7 部署包（包含 Node.js runtime）- 无加密版本
#
# 功能：
# 1. 使用 Docker + QEMU 交叉编译 ARM v7 应用
# 2. 编译 TypeScript 为普通 JavaScript
# 3. 打包为解压即用的部署包
#
# 与 build-arm7.sh 的区别：
# - 不使用 bytenode 编译 V8 字节码
# - 不使用 javascript-obfuscator 混淆代码
# - 代码为明文 JavaScript，便于调试和开发
#
# 使用方法:
#   ./scripts/build-arm7-plain.sh          # 本地构建（使用 QEMU 模拟）
#   ./scripts/build-arm7-plain.sh --clean  # 清理并构建
#   ./scripts/build-arm7-plain.sh --remote # 使用 Docker Context 远程构建
#   ./scripts/build-arm7-plain.sh --setup-context # 配置 Docker Context

set -e

# 版本配置
VERSION="1.0.0"
OUTPUT_DIR="dist/node-switch-v${VERSION}-arm7-plain"
DOCKER_IMAGE="node-switch:arm7-build-plain"

# Docker Context 配置
REMOTE_CONTEXT_NAME="orangepi-builder"
REMOTE_HOST="orangepi@192.168.110.248"

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

# 配置 Docker Context
setup_docker_context() {
    log_info "配置 Docker Context: ${REMOTE_CONTEXT_NAME} -> ${REMOTE_HOST}"

    # 检查 context 是否已存在
    if docker context ls 2>/dev/null | grep -q "^${REMOTE_CONTEXT_NAME}"; then
        log_warn "Docker Context '${REMOTE_CONTEXT_NAME}' 已存在"
        read -p "是否删除并重新创建? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker context rm "${REMOTE_CONTEXT_NAME}"
        else
            log_info "使用现有的 Docker Context"
            return 0
        fi
    fi

    log_info "创建 Docker Context..."
    log_info "连接信息: ${REMOTE_HOST}"
    log_warn "请确保已配置 SSH 免密登录，或首次连接时输入密码"

    # 创建新的 SSH context
    docker context create "${REMOTE_CONTEXT_NAME}" --docker "host=ssh://${REMOTE_HOST}"

    log_success "Docker Context '${REMOTE_CONTEXT_NAME}' 创建成功"
    echo ""
    log_info "使用以下命令切换到此 context:"
    echo "  docker context use ${REMOTE_CONTEXT_NAME}"
    log_info "使用以下命令切换回默认 context:"
    echo "  docker context use default"
    echo ""
}

# 检查 Docker Context
check_docker_context() {
    if ! docker context ls 2>/dev/null | grep -q "^${REMOTE_CONTEXT_NAME}"; then
        log_error "Docker Context '${REMOTE_CONTEXT_NAME}' 不存在"
        log_info "请先运行: $0 --setup-context"
        exit 1
    fi
    log_success "Docker Context '${REMOTE_CONTEXT_NAME}' 已就绪"
}

# 构建 Docker 镜像
build_docker_image() {
    log_info "构建 ARM v7 Docker 镜像（无加密版本）..."
    log_info "这可能需要几分钟时间（QEMU 模拟 ARM 环境较慢）"

    docker buildx build \
        --platform linux/arm/v7 \
        -f Dockerfile.build-plain \
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

    # 创建临时容器并提取文件
    docker rm -f temp-extract-plain 2>/dev/null || true
    docker create --name temp-extract-plain "${DOCKER_IMAGE}" /bin/true

    # 提取应用代码
    docker cp temp-extract-plain:/app/backend "${OUTPUT_DIR}/app/"
    docker cp temp-extract-plain:/app/core "${OUTPUT_DIR}/app/"
    docker cp temp-extract-plain:/app/shared "${OUTPUT_DIR}/app/"
    docker cp temp-extract-plain:/app/public/. "${OUTPUT_DIR}/public/"
    docker cp temp-extract-plain:/app/node_modules "${OUTPUT_DIR}/app/"

    docker rm temp-extract-plain

    log_success "构建产物提取完成"
}

# 创建启动脚本
create_startup_script() {
    log_info "创建启动脚本..."

    cat > "${OUTPUT_DIR}/start.sh" << 'EOF'
#!/bin/bash
# Node Switch 启动脚本（无加密版本）
# 使用方法: ./start.sh {start|stop|restart|status}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN=${NODE_BIN:-node}
APP_DIR="$SCRIPT_DIR/app"
PID_FILE="$SCRIPT_DIR/.node-switch.pid"
LOG_FILE="$SCRIPT_DIR/node-switch.log"

# 设置环境变量
# 默认生产环境，但允许外部覆盖
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

start() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Node Switch 已在运行 (PID: $(cat $PID_FILE))"
        return 0
    fi

    # 简单的日志轮转
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
    log_info "创建 loader.js..."

    # 创建主 loader.js（不使用加密）
    cat > "${OUTPUT_DIR}/app/loader.js" << 'EOF'
/**
 * 应用加载器（无加密版本）
 *
 * 这是生产环境的入口文件，用于加载编译后的 CommonJS 模块
 */

try {
  // 加载主入口点
  require('./backend/index.cjs');
} catch (error) {
  console.error('[FATAL] Failed to load backend application');
  console.error('Error details:', error);
  console.error('Possible causes:');
  console.error('1. Missing dependencies');
  console.error('2. Corrupted build');
  process.exit(1);
}
EOF

    # 创建 core/app.js（不使用加密）
    cat > "${OUTPUT_DIR}/app/core/app.js" << 'EOF'
/**
 * Core 应用加载器（无加密版本）
 */

try {
  // 加载 app.cjs
  require('./app.cjs');
} catch (error) {
  console.error('[FATAL] Failed to load core application');
  console.error('Error details:', error);
  process.exit(1);
}
EOF

    log_success "loader.js 配置完成"
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
    tar -czf "node-switch-v${VERSION}-arm7-plain.tar.gz" "node-switch-v${VERSION}-arm7-plain"
    cd ..

    # 计算文件大小
    local size=$(du -h "dist/node-switch-v${VERSION}-arm7-plain.tar.gz" | cut -f1)

    log_success "打包完成: dist/node-switch-v${VERSION}-arm7-plain.tar.gz (${size})"
}

# 清理
clean() {
    log_info "清理构建产物..."
    rm -rf dist/node-switch-*-plain
    docker rm -f temp-extract-plain 2>/dev/null || true
    log_success "清理完成"
}

# 主函数
main() {
    local BUILD_MODE="local"
    local DO_CLEAN=false

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                DO_CLEAN=true
                shift
                ;;
            --remote)
                BUILD_MODE="remote"
                shift
                ;;
            --setup-context)
                check_dependencies
                setup_docker_context
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                echo "用法: $0 [--clean] [--remote] [--setup-context]"
                exit 1
                ;;
        esac
    done

    echo ""
    echo "================================================"
    echo "  Node Switch ARM v7 构建脚本（无加密版本）"
    echo "  版本: ${VERSION}"
    if [ "$BUILD_MODE" == "remote" ]; then
        echo "  模式: 远程构建 (${REMOTE_CONTEXT_NAME})"
    else
        echo "  模式: 本地构建 (QEMU)"
    fi
    echo "================================================"
    echo ""

    if [ "$DO_CLEAN" = true ]; then
        clean
    fi

    if [ "$BUILD_MODE" == "remote" ]; then
        # 远程构建模式
        check_dependencies
        check_docker_context

        # 保存当前 context
        local CURRENT_CONTEXT=$(docker context inspect --format='{{.Name}}' 2>/dev/null || echo "default")

        log_info "切换到 Docker Context: ${REMOTE_CONTEXT_NAME}"
        docker context use "${REMOTE_CONTEXT_NAME}"

        # 远程构建（不需要 QEMU 和 platform 参数）
        log_info "在远程设备上构建 Docker 镜像..."
        docker build -f Dockerfile.build-plain -t "${DOCKER_IMAGE}" .

        log_success "Docker 镜像构建完成（远程）"
        extract_artifacts
        create_startup_script
        create_loader
        copy_config
        create_archive

        # 恢复原始 context
        log_info "恢复 Docker Context: ${CURRENT_CONTEXT}"
        docker context use "${CURRENT_CONTEXT}"

    else
        # 本地构建模式
        check_dependencies
        setup_qemu
        build_docker_image
        extract_artifacts
        create_startup_script
        create_loader
        copy_config
        create_archive
    fi

    echo ""
    echo "================================================"
    log_success "构建完成！"
    echo "================================================"
    echo ""
    echo "输出文件: dist/node-switch-v${VERSION}-arm7-plain.tar.gz"
    echo ""
    echo "部署步骤:"
    echo "  1. 复制到 OrangePi:"
    echo "     scp dist/node-switch-v${VERSION}-arm7-plain.tar.gz orangepi@192.168.110.248:~/"
    echo ""
    echo "  2. 在 OrangePi 上解压并启动:"
    echo "     tar -xzf node-switch-v${VERSION}-arm7-plain.tar.gz"
    echo "     cd node-switch-v${VERSION}-arm7-plain"
    echo "     ./start.sh"
    echo ""
    echo "  3. 查看状态/日志:"
    echo "     ./start.sh status"
    echo "     ./start.sh logs"
    echo ""
    echo "  注意：此版本使用明文 JavaScript 代码，便于调试"
    echo ""
    if [ "$BUILD_MODE" == "remote" ]; then
        echo "  远程构建说明:"
        echo "  - 镜像直接在 ${REMOTE_HOST} 上构建"
        echo "  - 构建速度更快（利用原生 ARM 硬件）"
        echo "  - 需要配置 SSH 连接"
        echo ""
    fi
}

main "$@"
