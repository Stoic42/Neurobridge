#!/bin/bash

# NeuroBridge 自动部署脚本
# 用法: ./deploy.sh [server_ip]

set -e  # 遇到错误立即退出

# 配置变量
SERVER_IP="${1:-82.157.123.207}"
SERVER_USER="root"
DOMAIN="neurobridge.ton-ton.fun"
DEPLOY_DIR="/opt/neurobridge"
PROJECT_NAME="neurobridge"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的命令
check_requirements() {
    log_info "检查本地环境..."
    
    if ! command -v ssh &> /dev/null; then
        log_error "SSH 未安装"
        exit 1
    fi
    
    if ! command -v scp &> /dev/null; then
        log_error "SCP 未安装"
        exit 1
    fi
    
    log_info "本地环境检查通过"
}

# 创建部署包
create_deployment_package() {
    log_info "创建部署包..."
    
    # 检查必要文件
    if [ ! -f "docker-compose.prod.yml" ]; then
        log_error "docker-compose.prod.yml 不存在"
        exit 1
    fi
    
    if [ ! -f "nginx-server.conf" ]; then
        log_error "nginx-server.conf 不存在"
        exit 1
    fi
    
    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    log_info "临时目录: $TEMP_DIR"
    
    # 复制文件
    cp -r backend "$TEMP_DIR/"
    cp -r frontend "$TEMP_DIR/"
    cp docker-compose.prod.yml "$TEMP_DIR/"
    cp nginx-server.conf "$TEMP_DIR/"
    
    # 清理不必要的文件
    find "$TEMP_DIR" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$TEMP_DIR" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$TEMP_DIR" -name "venv" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$TEMP_DIR" -name "*.pyc" -type f -delete 2>/dev/null || true
    find "$TEMP_DIR" -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 创建压缩包
    PACKAGE_NAME="${PROJECT_NAME}-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$PACKAGE_NAME" -C "$TEMP_DIR" .
    
    # 清理临时目录
    rm -rf "$TEMP_DIR"
    
    log_info "部署包创建完成: $PACKAGE_NAME"
    echo "$PACKAGE_NAME"
}

# 上传部署包
upload_package() {
    local package=$1
    log_info "上传部署包到服务器..."
    
    scp "$package" "${SERVER_USER}@${SERVER_IP}:/tmp/"
    
    if [ $? -eq 0 ]; then
        log_info "上传成功"
    else
        log_error "上传失败"
        exit 1
    fi
}

# 在服务器上执行部署
deploy_on_server() {
    local package=$1
    log_info "在服务器上执行部署..."
    
    ssh "${SERVER_USER}@${SERVER_IP}" bash << EOF
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "\${GREEN}[INFO]\${NC} \$1"
}

log_warn() {
    echo -e "\${YELLOW}[WARN]\${NC} \$1"
}

log_error() {
    echo -e "\${RED}[ERROR]\${NC} \$1"
}

# 检查 Docker
if ! command -v docker &> /dev/null; then
    log_warn "Docker 未安装，正在安装..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_warn "Docker Compose 未安装，正在安装..."
    apt update
    apt install -y docker-compose
fi

# 检查 Nginx
if ! command -v nginx &> /dev/null; then
    log_warn "Nginx 未安装，正在安装..."
    apt update
    apt install -y nginx
fi

# 创建部署目录
log_info "创建部署目录..."
mkdir -p ${DEPLOY_DIR}
cd ${DEPLOY_DIR}

# 备份旧版本
if [ -d "${DEPLOY_DIR}/backend" ]; then
    log_info "备份旧版本..."
    BACKUP_DIR="${DEPLOY_DIR}_backup_\$(date +%Y%m%d-%H%M%S)"
    mkdir -p "\$BACKUP_DIR"
    cp -r ${DEPLOY_DIR}/* "\$BACKUP_DIR/" 2>/dev/null || true
    log_info "备份保存在: \$BACKUP_DIR"
fi

# 解压新版本
log_info "解压部署包..."
tar -xzf /tmp/$package -C ${DEPLOY_DIR}/

# 检查环境变量文件
if [ ! -f "${DEPLOY_DIR}/backend/.env" ]; then
    log_warn "未找到 .env 文件，请手动创建并配置 API 密钥"
    log_warn "位置: ${DEPLOY_DIR}/backend/.env"
    log_warn "参考: ${DEPLOY_DIR}/backend/.env.example"
fi

# 配置 Nginx
log_info "配置 Nginx..."
cp ${DEPLOY_DIR}/nginx-server.conf /etc/nginx/sites-available/${PROJECT_NAME}
ln -sf /etc/nginx/sites-available/${PROJECT_NAME} /etc/nginx/sites-enabled/

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx
log_info "Nginx 配置完成"

# 停止旧容器
log_info "停止旧容器..."
cd ${DEPLOY_DIR}
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 构建并启动新容器
log_info "构建并启动容器..."
docker-compose -f docker-compose.prod.yml up -d --build

# 等待服务启动
log_info "等待服务启动..."
sleep 10

# 检查容器状态
log_info "检查容器状态..."
docker-compose -f docker-compose.prod.yml ps

# 健康检查
log_info "执行健康检查..."
if curl -f http://localhost:8000/api/v1/health &> /dev/null; then
    log_info "后端健康检查通过"
else
    log_error "后端健康检查失败"
fi

if curl -f http://localhost:3000/health &> /dev/null; then
    log_info "前端健康检查通过"
else
    log_error "前端健康检查失败"
fi

# 清理临时文件
rm /tmp/$package

log_info "部署完成！"
log_info "访问地址: https://${DOMAIN}"
log_info ""
log_info "查看日志: docker-compose -f ${DEPLOY_DIR}/docker-compose.prod.yml logs -f"
log_info "重启服务: docker-compose -f ${DEPLOY_DIR}/docker-compose.prod.yml restart"
log_info "停止服务: docker-compose -f ${DEPLOY_DIR}/docker-compose.prod.yml down"

EOF
}

# 清理本地临时文件
cleanup() {
    local package=$1
    log_info "清理本地临时文件..."
    rm -f "$package"
}

# 主函数
main() {
    log_info "开始部署 NeuroBridge 到 ${SERVER_IP}"
    log_info "域名: ${DOMAIN}"
    log_info ""
    
    # 检查环境
    check_requirements
    
    # 创建部署包
    PACKAGE=$(create_deployment_package)
    
    # 上传
    upload_package "$PACKAGE"
    
    # 部署
    deploy_on_server "$PACKAGE"
    
    # 清理
    cleanup "$PACKAGE"
    
    log_info ""
    log_info "=========================================="
    log_info "部署完成！"
    log_info "=========================================="
    log_info "访问地址: https://${DOMAIN}"
    log_info ""
    log_info "后续步骤："
    log_info "1. 配置 API 密钥: ssh ${SERVER_USER}@${SERVER_IP} 'nano ${DEPLOY_DIR}/backend/.env'"
    log_info "2. 重启服务: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${DEPLOY_DIR} && docker-compose -f docker-compose.prod.yml restart'"
    log_info "3. 配置 SSL: ssh ${SERVER_USER}@${SERVER_IP} 'certbot --nginx -d ${DOMAIN}'"
    log_info ""
}

# 运行主函数
main
