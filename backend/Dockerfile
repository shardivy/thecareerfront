# =========================
# Build Stage
# =========================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies for building mysqlclient
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    pkg-config \
    default-libmysqlclient-dev \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --upgrade pip

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt


# =========================
# Production Stage
# =========================
FROM python:3.11-slim

WORKDIR /app

# Install runtime MySQL client (lighter)
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy project files
COPY . .

# Expose port
EXPOSE 8000

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "backend.wsgi:application"]
