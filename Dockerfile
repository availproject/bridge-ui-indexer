FROM node:18.19.1
WORKDIR /app
COPY package*.json /app/
RUN npm ci
COPY . /app/
RUN npm run build
ENTRYPOINT [ "npm" ]
CMD ["run", "start"]