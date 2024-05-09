ARG ALPINE_VERSION=3.19

FROM node:18-alpine${ALPINE_VERSION} AS builder
WORKDIR /build-stage
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run prisma:generate && \
    npm run build

FROM alpine:${ALPINE_VERSION}
WORKDIR /usr/src/app
RUN apk add --no-cache libstdc++ dumb-init \
  && addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node \
  && chown node:node ./
COPY --from=builder /usr/local/bin/node /usr/local/bin/
USER node
COPY --from=builder /build-stage/node_modules ./node_modules
COPY --from=builder /build-stage/dist ./dist
COPY --from=builder /build-stage/package.json ./

ENTRYPOINT ["dumb-init", "node", "--experimental-import-meta-resolve", "dist/index.js"]
