FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

#  nginx html 
RUN rm -rf /usr/share/nginx/html/*

# dist(admin/)  nginx HTML root 
COPY --from=build /app/dist /usr/share/nginx/html/admin
# nginx   ( )
COPY /proxy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]