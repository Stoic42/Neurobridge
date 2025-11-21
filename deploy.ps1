# NeuroBridge 自动部署脚本 (PowerShell)
# 用法: .\deploy.ps1 [-ServerIP "82.157.123.207"]

param(
    [string]$ServerIP = "82.157.123.207",
    [string]$ServerUser = "root",
    [string]$Domain = "neurobridge.ton-ton.fun",
    [string]$DeployDir = "/opt/neurobridge",
    [string]$ProjectName = "neurobridge"
)

# 颜色输出函数
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 检查必要的命令
function Test-Requirements {
    Write-Info "检查本地环境..."
    
    if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "SSH 未安装或不在 PATH 中"
        Write-Info "请安装 OpenSSH 客户端或使用 Git Bash"
        exit 1
    }
    
    if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "SCP 未安装或不在 PATH 中"
        Write-Info "请安装 OpenSSH 客户端或使用 Git Bash"
        exit 1
    }
    
    Write-Info "本地环境检查通过"
}

# 创建部署包
function New-DeploymentPackage {
    Write-Info "创建部署包..."
    
    # 检查必要文件
    if (-not (Test-Path "docker-compose.prod.yml")) {
        Write-Error-Custom "docker-compose.prod.yml 不存在"
        exit 1
    }
    
    if (-not (Test-Path "nginx-server.conf")) {
        Write-Error-Custom "nginx-server.conf 不存在"
        exit 1
    }
    
    # 创建临时目录
    $TempDir = New-Item -ItemType Directory -Path ([System.IO.Path]::GetTempPath()) -Name "neurobridge-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Info "临时目录: $TempDir"
    
    # 复制文件
    Copy-Item -Path "backend" -Destination $TempDir -Recurse -Force
    Copy-Item -Path "frontend" -Destination $TempDir -Recurse -Force
    Copy-Item -Path "docker-compose.prod.yml" -Destination $TempDir -Force
    Copy-Item -Path "nginx-server.conf" -Destination $TempDir -Force
    
    # 清理不必要的文件
    Get-ChildItem -Path $TempDir -Recurse -Directory -Filter "node_modules" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $TempDir -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $TempDir -Recurse -Directory -Filter "venv" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $TempDir -Recurse -File -Filter "*.pyc" | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $TempDir -Recurse -Directory -Filter ".git" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    
    # 创建压缩包
    $PackageName = "$ProjectName-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"
    
    # 使用 tar 命令（Windows 10 1803+ 自带）
    $CurrentDir = Get-Location
    Set-Location $TempDir
    tar -czf "$CurrentDir\$PackageName" *
    Set-Location $CurrentDir
    
    # 清理临时目录
    Remove-Item -Path $TempDir -Recurse -Force
    
    Write-Info "部署包创建完成: $PackageName"
    return $PackageName
}

# 上传部署包
function Send-Package {
    param([string]$Package)
    
    Write-Info "上传部署包到服务器..."
    
    scp $Package "${ServerUser}@${ServerIP}:/tmp/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "上传成功"
    } else {
        Write-Error-Custom "上传失败"
        exit 1
    }
}

# 在服务器上执行部署
function Invoke-DeployOnServer {
    param([string]$Package)
    
    Write-Info "在服务器上执行部署..."
    
    $DeployScript = @"
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "\`${GREEN}[INFO]\`${NC} \`$1"
}

log_warn() {
    echo -e "\`${YELLOW}[WARN]\`${NC} \`$1"
}

log_error() {
    echo -e "\`${RED}[ERROR]\`${NC} \`$1"
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
mkdir -p $DeployDir
cd $DeployDir

# 备份旧版本
if [ -d "$DeployDir/backend" ]; then
    log_info "备份旧版本..."
    BACKUP_DIR="${DeployDir}_backup_\`$(date +%Y%m%d-%H%M%S)"
    mkdir -p "\`$BACKUP_DIR"
    cp -r $DeployDir/* "\`$BACKUP_DIR/" 2>/dev/null || true
    log_info "备份保存在: \`$BACKUP_DIR"
fi

# 解压新版本
log_info "解压部署包..."
tar -xzf /tmp/$Package -C $DeployDir/

# 检查环境变量文件
if [ ! -f "$DeployDir/backend/.env" ]; then
    log_warn "未找到 .env 文件，请手动创建并配置 API 密钥"
    log_warn "位置: $DeployDir/backend/.env"
    log_warn "参考: $DeployDir/backend/.env.example"
fi

# 配置 Nginx
log_info "配置 Nginx..."
cp $DeployDir/nginx-server.conf /etc/nginx/sites-available/$ProjectName
ln -sf /etc/nginx/sites-available/$ProjectName /etc/nginx/sites-enabled/

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx
log_info "Nginx 配置完成"

# 停止旧容器
log_info "停止旧容器..."
cd $DeployDir
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
rm /tmp/$Package

log_info "部署完成！"
log_info "访问地址: https://$Domain"
log_info ""
log_info "查看日志: docker-compose -f $DeployDir/docker-compose.prod.yml logs -f"
log_info "重启服务: docker-compose -f $DeployDir/docker-compose.prod.yml restart"
log_info "停止服务: docker-compose -f $DeployDir/docker-compose.prod.yml down"
"@

    # 执行远程脚本
    $DeployScript | ssh "${ServerUser}@${ServerIP}" "bash -s"
}

# 清理本地临时文件
function Remove-LocalPackage {
    param([string]$Package)
    
    Write-Info "清理本地临时文件..."
    Remove-Item -Path $Package -Force -ErrorAction SilentlyContinue
}

# 主函数
function Main {
    Write-Info "开始部署 NeuroBridge 到 $ServerIP"
    Write-Info "域名: $Domain"
    Write-Info ""
    
    # 检查环境
    Test-Requirements
    
    # 创建部署包
    $Package = New-DeploymentPackage
    
    try {
        # 上传
        Send-Package -Package $Package
        
        # 部署
        Invoke-DeployOnServer -Package $Package
        
        Write-Info ""
        Write-Info "=========================================="
        Write-Info "部署完成！"
        Write-Info "=========================================="
        Write-Info "访问地址: https://$Domain"
        Write-Info ""
        Write-Info "后续步骤："
        Write-Info "1. 配置 API 密钥: ssh ${ServerUser}@${ServerIP} 'nano ${DeployDir}/backend/.env'"
        Write-Info "2. 重启服务: ssh ${ServerUser}@${ServerIP} 'cd ${DeployDir} && docker-compose -f docker-compose.prod.yml restart'"
        Write-Info "3. 配置 SSL: ssh ${ServerUser}@${ServerIP} 'certbot --nginx -d ${Domain}'"
        Write-Info ""
    }
    finally {
        # 清理
        Remove-LocalPackage -Package $Package
    }
}

# 运行主函数
Main
