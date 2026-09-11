# --- Build stage ---
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Backend origin baked into the bundle at build time. Empty (the default) means
# same-origin, which is what the nginx reverse proxy below provides.
ARG VITE_API_ORIGIN=""
ENV VITE_API_ORIGIN=${VITE_API_ORIGIN}

RUN npm run build

# --- Serve stage ---
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
