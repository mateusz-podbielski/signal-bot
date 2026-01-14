FROM ssb-backend:latest AS base
FROM node:14.15-alpine3.10
WORKDIR /app
COPY --from=base /app/package.json .
COPY --from=base /app/package-lock.json .
RUN npm install --production
COPY --from=base /app/dist/apps/auth .
CMD ["node", "./main.js"]
EXPOSE 9003
