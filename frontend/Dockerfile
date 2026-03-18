FROM nginx:1.25-alpine

COPY index.html /usr/share/nginx/html/index.html
COPY logs.html /usr/share/nginx/html/logs.html
COPY config.js /usr/share/nginx/html/config.js
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY profile.html /usr/share/nginx/html/profile.html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
