# Dev-container voor het prototype. Draait de Vite dev-server en (los) het
# scraperscript, zonder dat er iets op het host-systeem geïnstalleerd hoeft
# te worden buiten Docker zelf.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
