FROM lswl/vertex-base:latest
LABEL maintainer="fc0012"
LABEL build_from="https://github.com/fc0012/vertex"

ENV TZ=Asia/Shanghai
RUN \
  apt-get update && \
  apt-get install -y --no-install-recommends python3 python3-pip git npm && \
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
    aiohttp httpx pyyaml \
    qbittorrent-api deluge-client transmission-rpc && \
  apt-get remove -y git npm && \
  apt-get autoremove -y && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* && \
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