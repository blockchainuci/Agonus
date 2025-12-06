# Agonus Backend - API Server for Railway
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    postgresql-client \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app

# Railway uses PORT environment variable, default to 8000
ENV PORT=8000
# Disable ngrok for production deployment
ENV DISABLE_NGROK=true

# Expose the port (Railway will override this with $PORT)
EXPOSE $PORT

# Run FastAPI server with uvicorn on Railway's PORT
# Railway expects the app to bind to 0.0.0.0:$PORT
CMD ["sh", "-c", "uvicorn app.api.main:app --host 0.0.0.0 --port ${PORT}"]
