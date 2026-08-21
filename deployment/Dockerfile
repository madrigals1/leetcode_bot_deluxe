FROM node:22-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

COPY deployment/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
