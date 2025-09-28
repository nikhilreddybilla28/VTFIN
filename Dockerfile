FROM python:3.11-slim

WORKDIR /app

# Copy simple server
COPY backend/simple_server.py .
COPY backend/.env .env

# Expose port
EXPOSE 8000

# Run simple server
CMD ["python", "simple_server.py"]