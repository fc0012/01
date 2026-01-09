FROM lswl/vertex-base:latest
LABEL maintainer="fc0012"
LABEL build_from="https://github.com/fc0012/vertex"

ENV TZ=Asia/Shanghai
RUN \
  apk add --no-cache gcc g++ python3 py3-pip python3-dev libffi-dev openssl-dev git cmake make npm libc-dev && \
  git clone https://github.com/fc0012/vertex.git /app/vertex && \
  cd /app/vertex && \
  git checkout COMMIT_ID && \
  rm .git webui -rf && \
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm i --save && \
  mkdir /vertex && \
  ln -s /vertex/data /app/vertex/app/data && \
  ln -s /vertex/db /app/vertex/app/db && \
  ln -s /vertex/logs /app/vertex/logs && \
  ln -s /vertex/torrents /app/vertex/torrents && \
  mv /app/vertex/app/config /app/vertex/app/config_backup && \
  ln -s /vertex/config /app/vertex/app/config && \
  ln -s /app/localtime /etc/localtime && \
  ln -s /usr/bin/chromium-browser /usr/bin/chromium && \
  chmod +x /usr/bin/chromium && \
  pip3 install --no-cache-dir --break-system-packages \
    requests beautifulsoup4 lxml loguru pytz bencodepy \
    aiohttp httpx pyyaml toml \
    pymongo redis sqlalchemy \
    schedule apscheduler \
    pillow qbittorrent-api deluge-client transmission-rpc && \
  apk del gcc g++ git cmake make npm libc-dev python3-dev libffi-dev openssl-dev && \
  echo 'bind 127.0.0.1' >> /app/redis.conf && \
  echo 'daemonize yes' >> /app/redis.conf
COPY src/static /app/vertex/app/static
RUN \
  useradd -d /app/vertex -s /bin/sh vt && \
  chown -R vt /vertex && \
  chmod +x /vertex
EXPOSE 3000
CMD \
  bash /app/vertex/docker/start.sh