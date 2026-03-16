FROM nginx:1.25-alpine

COPY index.html /usr/share/nginx/html/index.html
COPY logs.html /usr/share/nginx/html/logs.html
COPY config.js /usr/share/nginx/html/config.js

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]