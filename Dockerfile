# ---------- DEV ----------
FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "run", "dev"]


# # ---------- PROD BUILD ----------
# FROM node:20-alpine AS builder

# WORKDIR /app

# COPY package*.json ./
# RUN npm ci

# COPY . .
# RUN npm run build


# # ---------- PROD RUNTIME ----------
# FROM node:20-alpine AS prod

# WORKDIR /app

# COPY --from=builder /app/dist ./dist
# COPY package*.json ./

# RUN npm ci --only=production

# EXPOSE 8000

# CMD ["node", "dist/index.js"]
