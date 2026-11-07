FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /code

# Install curl for container health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Layer caching: install requirements first
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Non-root user for security hardening
RUN useradd -u 1001 -m appuser
USER appuser

# Copy application code
COPY --chown=appuser:appuser . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
