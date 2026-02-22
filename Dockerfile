FROM node:20-slim
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
COPY frontend/ ./frontend/
RUN mkdir -p /tmp
EXPOSE 3001
CMD ["node", "server.js"]
