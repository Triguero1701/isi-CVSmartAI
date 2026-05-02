FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Arrancar el servidor de desarrollo Vite expuesto en todas las interfaces de red
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
