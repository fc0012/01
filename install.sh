#!/bin/bash
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
INSTALL_DIR="/opt/vertex"
PORT="3000"
IMAGE="lswl/vertex:stable"

echo ""
echo "=============================================="
echo "       VERTEX One-Click Install Script       "
echo "=============================================="
echo ""

# Check Docker
echo -e "${BLUE}[INFO]${NC} Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Docker is not installed."
    echo "Please install Docker first: curl -fsSL https://get.docker.com | bash"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Docker is installed"

# Check Docker Compose
echo -e "${BLUE}[INFO]${NC} Checking Docker Compose..."
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR]${NC} Docker Compose is not installed."
    echo "Please install: sudo apt-get install docker-compose-plugin"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Docker Compose is installed"

# Create directory
echo -e "${BLUE}[INFO]${NC} Creating installation directory..."
mkdir -p "$INSTALL_DIR/data"
chmod 755 "$INSTALL_DIR" "$INSTALL_DIR/data"
echo -e "${GREEN}[OK]${NC} Directory created: $INSTALL_DIR"

# Generate docker-compose.yml
echo -e "${BLUE}[INFO]${NC} Generating docker-compose.yml..."
cat > "$INSTALL_DIR/docker-compose.yml" << 'EOF'
version: '3'
services:
  vertex:
    image: lswl/vertex:stable
    container_name: vertex
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - ./data:/vertex
    environment:
      - TZ=Asia/Shanghai
EOF
echo -e "${GREEN}[OK]${NC} docker-compose.yml created"

# Start services
echo -e "${BLUE}[INFO]${NC} Starting VERTEX..."
cd "$INSTALL_DIR"
$COMPOSE_CMD pull
$COMPOSE_CMD up -d

# Wait for container
sleep 3

# Show result
echo ""
echo "=============================================="
echo -e "${GREEN}[SUCCESS]${NC} VERTEX installation completed!"
echo "=============================================="
echo ""
echo "Access URL: http://localhost:${PORT}"
echo "           http://$(hostname -I | awk '{print $1}'):${PORT}"
echo ""
echo "Commands:"
echo "  Start:  cd $INSTALL_DIR && $COMPOSE_CMD up -d"
echo "  Stop:   cd $INSTALL_DIR && $COMPOSE_CMD down"
echo "  Logs:   cd $INSTALL_DIR && $COMPOSE_CMD logs -f"
echo ""
