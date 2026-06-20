# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
# --omit=dev evita instalar dependencias de desarrollo en producción
# --ci instala exactamente lo que dice el package-lock (más seguro y rápido)
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
# Usa el PID 1 correctamente en Alpine para manejar señales Docker
CMD ["node", "src/index.js"]