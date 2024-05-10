#!/bin/sh

npm run prisma:generate
npm run prisma:push
node --experimental-import-meta-resolve dist/index.js
