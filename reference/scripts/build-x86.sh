#!/bin/bash
# scripts/build-x86.sh
# 一键构建 X86 Linux 部署包（本地构建）
#
# 功能：
# 1. 编译 TypeScript
# 2. 将后端代码编译为 V8 字节码 (.jsc)
# 3. 混淆前端 JavaScript 代码
# 4. 打包为解压即用的部署包
#
# 使用方法:
#   ./scripts/build-x86.sh          # 构建
#   ./scripts/build-x86.sh --clean  # 清理并构建

set -e

# 版本配置
VERSION="1.0.0"
OUTPUT_DIR="dist/feed-control-system-v${VERSION}-x86"

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

    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装，请先安装 pnpm: npm install -g pnpm"
        exit 1
    fi

    # 检查 bytenode
    if ! command -v bytenode &> /dev/null; then
        log_warn "bytenode 未安装，正在安装..."
        npm install -g bytenode
    fi

    # 检查 javascript-obfuscator
    if ! command -v javascript-obfuscator &> /dev/null; then
        log_warn "javascript-obfuscator 未安装，正在安装..."
        npm install -g javascript-obfuscator
    fi

    log_success "依赖检查通过"
}

# 安装项目依赖
install_dependencies() {
    log_info "安装项目依赖..."
    pnpm install --frozen-lockfile
    log_success "项目依赖安装完成"
}

# 编译 TypeScript
build_typescript() {
    log_info "编译 TypeScript..."

    # 构建 shared
    log_info "  - 构建 shared..."
    cd packages/shared && pnpm build && cd ../..

    # 构建 core
    log_info "  - 构建 core..."
    cd packages/core && pnpm build && cd ../..

    # 构建 backend
    log_info "  - 构建 backend..."
    cd packages/backend && pnpm build && cd ../..

    # 构建 frontend
    log_info "  - 构建 frontend..."
    cd packages/frontend && pnpm build && cd ../..

    log_success "TypeScript 编译完成"
}

# 编译为 V8 字节码
compile_bytecode() {
    log_info "编译 V8 字节码..."

    # 编译 core 为 V8 字节码
    log_info "  - 编译 core..."
    for file in $(find packages/core/dist -name "*.cjs" ! -name "*.d.cjs"); do
        echo "    Compiling $file..."
        bytenode -c "$file" || exit 1
    done
    find packages/core/dist -name "*.cjs" ! -name "*.d.cjs" -delete

    # 编译 backend 为 V8 字节码
    log_info "  - 编译 backend..."
    for file in $(find packages/backend/dist -name "*.cjs" ! -name "*.d.cjs"); do
        echo "    Compiling $file..."
        bytenode -c "$file" || exit 1
    done
    find packages/backend/dist -name "*.cjs" ! -name "*.d.cjs" -delete

    log_success "V8 字节码编译完成"
}

# 混淆前端代码
obfuscate_frontend() {
    log_info "混淆前端 JavaScript..."

    if [ -f "obfuscator.config.cjs" ]; then
        for file in $(find packages/frontend/dist/assets -name "*.js"); do
            echo "    Obfuscating $file..."
            javascript-obfuscator "$file" --output "$file" --config obfuscator.config.cjs
        done
    else
        for file in $(find packages/frontend/dist/assets -name "*.js"); do
            echo "    Obfuscating $file..."
            javascript-obfuscator "$file" --output "$file"
        done
    fi

    log_success "前端混淆完成"
}

# 组装输出目录
assemble_output() {
    log_info "组装输出目录..."

    rm -rf "${OUTPUT_DIR}"
    mkdir -p "${OUTPUT_DIR}/app"
    mkdir -p "${OUTPUT_DIR}/public"

    # 复制构建产物
    cp -r packages/backend/dist "${OUTPUT_DIR}/app/backend"
    cp -r packages/core/dist "${OUTPUT_DIR}/app/core"
    cp -r packages/shared/dist "${OUTPUT_DIR}/app/shared"
    cp -r packages/frontend/dist/* "${OUTPUT_DIR}/public/"

    # 创建 package.json 用于安装生产依赖
    log_info "创建 package.json..."
    cat > "${OUTPUT_DIR}/app/package.json" << 'PKGJSON'
{
  "name": "feed-control-system",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "dependencies": {
    "bytenode": "^1.5.6",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "express-rate-limit": "^7.4.1",
    "cors": "^2.8.5",
    "iconv-lite": "^0.6.3",
    "json5": "^2.2.3",
    "jsonwebtoken": "^9.0.3",
    "pino": "^10.1.0",
    "pino-http": "^10.3.0",
    "pino-pretty": "^13.1.3",
    "serialport": "^12.0.0",
    "socket.io": "^4.8.3",
    "xstate": "^5.19.2",
    "zod": "^4.2.1"
  }
}
PKGJSON

    # 使用 npm 安装生产依赖（不使用 pnpm，因为复制符号链接会失效）
    log_info "安装生产依赖（这可能需要一段时间）..."
    pushd "${OUTPUT_DIR}/app" > /dev/null
    npm install --omit=dev --legacy-peer-deps 2>/dev/null || npm install --omit=dev
    popd > /dev/null

    # 创建 shared 模块符号链接（解决 workspace:* 依赖）
    log_info "创建 shared 模块链接..."
    ln -sf ../shared "${OUTPUT_DIR}/app/node_modules/shared"

    # 创建 shared/package.json 指定 CommonJS 入口（bytenode 使用 CJS）
    cat > "${OUTPUT_DIR}/app/shared/package.json" << 'SHAREDPKG'
{
  "name": "shared",
  "version": "1.0.0",
  "main": "./index.cjs",
  "types": "./index.d.cts"
}
SHAREDPKG

    log_success "输出目录组装完成"
}

# 创建启动脚本
create_startup_script() {
    log_info "创建启动脚本..."

    cat > "${OUTPUT_DIR}/start.sh" << 'EOF'
#!/bin/bash
# Feed Control System 启动脚本
# 使用方法: ./start.sh {start|stop|restart|status}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
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

    # 简单的日志轮转
    if [ -f "$LOG_FILE" ]; then
        mv "$LOG_FILE" "$LOG_FILE.old"
    fi

    echo "启动 Feed Control System..."
    cd "$APP_DIR"
    nohup node loader.cjs > "$LOG_FILE" 2>&1 &
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

# 创建 loader.cjs
create_loader() {
    log_info "创建 loader.cjs..."

    # 从源码复制 backend/loader.js 到 app 根目录作为主入口，重命名为 .cjs 以支持 require
    cp packages/backend/src/loader.js "${OUTPUT_DIR}/app/loader.cjs"

    # 修改引用路径：./index.jsc -> ./backend/index.jsc
    sed -i "s|require('./index.jsc');|require('./backend/index.jsc');|g" "${OUTPUT_DIR}/app/loader.cjs"

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
    tar -czf "feed-control-system-v${VERSION}-x86.tar.gz" "feed-control-system-v${VERSION}-x86"
    cd ..

    # 计算文件大小
    local size=$(du -h "dist/feed-control-system-v${VERSION}-x86.tar.gz" | cut -f1)

    log_success "打包完成: dist/feed-control-system-v${VERSION}-x86.tar.gz (${size})"
}

# 验证构建产物
verify_build() {
    log_info "验证构建产物..."

    echo "=== 字节码编译验证 ==="
    echo "Backend .jsc 文件数量: $(find ${OUTPUT_DIR}/app/backend -name '*.jsc' 2>/dev/null | wc -l)"
    echo "Core .jsc 文件数量: $(find ${OUTPUT_DIR}/app/core -name '*.jsc' 2>/dev/null | wc -l)"
    echo "Backend 剩余 .cjs 文件: $(find ${OUTPUT_DIR}/app/backend -name '*.cjs' 2>/dev/null | wc -l)"
    echo "Core 剩余 .cjs 文件: $(find ${OUTPUT_DIR}/app/core -name '*.cjs' 2>/dev/null | wc -l)"

    log_success "验证完成"
}

# 清理
clean() {
    log_info "清理构建产物..."
    rm -rf dist/feed-control-system-*
    rm -rf packages/*/dist
    log_success "清理完成"
}

# 主函数
main() {
    echo ""
    echo "================================================"
    echo "  Feed Control System X86 Linux 构建脚本"
    echo "  版本: ${VERSION}"
    echo "================================================"
    echo ""

    if [ "$1" == "--clean" ]; then
        clean
        shift
    fi

    check_dependencies
    install_dependencies
    build_typescript
    compile_bytecode
    obfuscate_frontend
    assemble_output
    create_startup_script
    create_loader
    copy_config
    verify_build
    create_archive

    echo ""
    echo "================================================"
    log_success "构建完成！"
    echo "================================================"
    echo ""
    echo "输出文件: dist/feed-control-system-v${VERSION}-x86.tar.gz"
    echo ""
    echo "部署步骤:"
    echo "  1. 复制到目标服务器:"
    echo "     scp dist/feed-control-system-v${VERSION}-x86.tar.gz user@server:~/"
    echo ""
    echo "  2. 在服务器上解压并启动:"
    echo "     tar -xzf feed-control-system-v${VERSION}-x86.tar.gz"
    echo "     cd feed-control-system-v${VERSION}-x86"
    echo "     ./start.sh"
    echo ""
    echo "  3. 查看状态/日志:"
    echo "     ./start.sh status"
    echo "     ./start.sh logs"
    echo ""
}

main "$@"
