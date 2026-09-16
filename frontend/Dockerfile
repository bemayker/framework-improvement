# syntax=docker/dockerfile:1
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

EXPOSE 5183

CMD ["npm", "run", "dev", "--", "--host"]
