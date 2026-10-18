FROM node:24.13.1-alpine3.23
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci 

COPY backend/server.js backend/db.js backend/init-db.js ./backend/
COPY frontend/ ./frontend/
COPY init.sql ./init.sql

USER node

EXPOSE 3000
CMD ["node", "backend/server.js"]