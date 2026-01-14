
FROM node:14.16-alpine3.10
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
RUN npx nx run-many --target=build --projects=api,auth,bthub,socket-io,swagger --parallel
