ARG ALPINE_VERSION=3.19

FROM node:18-alpine${ALPINE_VERSION} AS builder
WORKDIR /build-stage
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM node:18-alpine${ALPINE_VERSION}
WORKDIR /usr/src/app
USER node
COPY --from=builder --chown=node:node /build-stage/node_modules ./node_modules
COPY --from=builder --chown=node:node /build-stage/dist ./dist
COPY --from=builder --chown=node:node /build-stage/package.json ./
COPY --from=builder --chown=node:node /build-stage/prisma ./prisma
COPY --from=builder --chown=node:node /build-stage/scripts/entrypoint.sh ./

ENTRYPOINT ["./entrypoint.sh"]
