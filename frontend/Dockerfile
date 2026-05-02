# Estágio 1: Build da aplicação Node/Vite
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Servidor Nginx para produção
FROM nginx:alpine
# Copia os arquivos compilados do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html
# Substitui a configuração padrão do Nginx pela nossa que contém o proxy e fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
