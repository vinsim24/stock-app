# Custom Nginx Image with embedded configuration
FROM nginx:1.29-alpine

# Copy our custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create a simple health check endpoint
RUN echo '<!DOCTYPE html><html><head><title>Stock App Proxy</title></head><body><h1>Stock App Nginx Proxy</h1><p>Status: Running</p><p>Version: 1.0.0</p></body></html>' > /usr/share/nginx/html/health.html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
