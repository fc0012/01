# 支持的基础镜像:
# - node:18-bookworm-slim (Debian 12, 默认)
# - node:18-bullseye-slim (Debian 11)
# - node:18-buster-slim (Debian 10)
# - ubuntu:24.04
# - ubuntu:22.04
# - ubuntu:20.04
ARG BASE_IMAGE=node:18-bookworm-slim
FROM ${BASE_IMAGE}

LABEL maintainer="fc0012"
LABEL build_from="https://github.com/fc0012/vertex02"

ENV TZ=Asia/Shanghai
ENV DEBIAN_FRONTEND=noninteractive

# 检测是否需要安装 Node.js (Ubuntu 镜像需要)
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg && \
  # 如果没有 node 命令，安装 Node.js 18
  if ! command -v node > /dev/null 2>&1; then \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs; \
  fi && \
  # 安装其他依赖
  apt-get install -y --no-install-recommends \
    git \
    redis-server \
    tzdata \
    bash \
    procps && \
  # Clone vertex
  git clone https://github.com/fc0012/vertex02.git /app/vertex && \
  cd /app/vertex && \
  git checkout COMMIT_ID && \
  rm -rf .git webui && \
  npm i --save && \
  # 创建目录和符号链接
  mkdir -p /vertex && \
  ln -s /vertex/data /app/vertex/app/data && \
  ln -s /vertex/db /app/vertex/app/db && \
  ln -s /vertex/logs /app/vertex/logs && \
  ln -s /vertex/torrents /app/vertex/torrents && \
  mv /app/vertex/app/config /app/vertex/app/config_backup && \
  ln -s /vertex/config /app/vertex/app/config && \
  # 清理
  apt-get remove -y git gnupg && \
  apt-get autoremove -y && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* && \
  # Redis 配置
  mkdir -p /app && \
  echo 'bind 127.0.0.1' > /app/redis.conf && \
  echo 'daemonize yes' >> /app/redis.conf && \
  touch /app/localtime

COPY src/static /app/vertex/app/static

RUN useradd -d /app/vertex -s /bin/sh vt; \
  chown -R vt:vt /vertex /app/vertex; \
  chmod 755 /vertex; \
  exit 0

EXPOSE 3000

CMD ["bash", "/app/vertex/docker/start.sh"]
