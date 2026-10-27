FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Unprivileged nginx: runs as a normal user and listens on 8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/security.conf nginx/rate-limit.conf /etc/nginx/snippets/
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
