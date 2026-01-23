# 支持的基础镜像:
# - node:18-bookworm-slim (Debian 12, 默认, 最稳定)
# - node:18-bullseye-slim (Debian 11)
# - node:18-alpine (Alpine Linux, 体积最小但可能有兼容性问题)
ARG BASE_IMAGE=node:18-bookworm-slim
FROM ${BASE_IMAGE}

LABEL maintainer="fc0012"
LABEL build_from="https://github.com/fc0012/vertex02"

ENV TZ=Asia/Shanghai

# 根据基础镜像类型安装依赖
RUN if command -v apk > /dev/null 2>&1; then \
    # Alpine 镜像
    apk add --no-cache \
      git \
      redis \
      tzdata \
      bash \
      python3 \
      make \
      g++ && \
    git clone https://github.com/fc0012/01.git /app/vertex && \
    cd /app/vertex && \
    git checkout COMMIT_ID && \
    rm -rf .git webui && \
    npm i --save --omit=dev && \
    apk del git python3 make g++ && \
    rm -rf /var/cache/apk/* /root/.npm /tmp/*; \
  else \
    # Debian/Ubuntu 镜像
    export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      gnupg \
      git \
      redis-server \
      tzdata \
      bash \
      python3 \
      make \
      g++ && \
    if ! command -v node > /dev/null 2>&1; then \
      mkdir -p /etc/apt/keyrings && \
      curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
      echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
      apt-get update && \
      apt-get install -y nodejs; \
    fi && \
    git clone https://github.com/fc0012/01.git /app/vertex && \
    cd /app/vertex && \
    git checkout COMMIT_ID && \
    rm -rf .git webui && \
    npm i --save --omit=dev && \
    apt-get remove -y git gnupg python3 make g++ && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /root/.npm /tmp/*; \
  fi && \
  # 创建目录和符号链接
  mkdir -p /vertex /app && \
  ln -s /vertex/data /app/vertex/app/data && \
  ln -s /vertex/db /app/vertex/app/db && \
  ln -s /vertex/logs /app/vertex/logs && \
  ln -s /vertex/torrents /app/vertex/torrents && \
  mv /app/vertex/app/config /app/vertex/app/config_backup && \
  ln -s /vertex/config /app/vertex/app/config && \
  # Redis 配置
  echo 'bind 127.0.0.1' > /app/redis.conf && \
  echo 'daemonize yes' >> /app/redis.conf && \
  touch /app/localtime

COPY src/static /app/vertex/app/static

# 创建用户 (Alpine 和 Debian 兼容)
RUN if command -v adduser > /dev/null 2>&1 && ! command -v useradd > /dev/null 2>&1; then \
    addgroup -g 1000 vt && \
    adduser -D -u 1000 -G vt -h /app/vertex -s /bin/sh vt; \
  else \
    useradd -d /app/vertex -s /bin/sh vt; \
  fi && \
  chown -R vt:vt /vertex /app/vertex && \
  chmod 755 /vertex

EXPOSE 3000

CMD ["bash", "/app/vertex/docker/start.sh"]
