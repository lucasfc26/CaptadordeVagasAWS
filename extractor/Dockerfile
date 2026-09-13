FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgtk-3-0 \
    libdbus-glib-1-2 \
    libxt6 \
    libx11-xcb1 \
    libxcb-shm0 \
    libpangocairo-1.0-0 \
    libasound2 \
    libnss3 \
    libxrandr2 \
    libxcomposite1 \
    libxdamage1 \
    libgbm1 \
    fonts-liberation \
    fonts-freefont-ttf \
    curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
  && python -m camoufox fetch

COPY . ./

ENV HEADLESS=true
ENV PYTHONUNBUFFERED=1
EXPOSE 8100

HEALTHCHECK --interval=20s --timeout=5s --retries=10 --start-period=30s \
  CMD curl -fsS http://localhost:8100/health || exit 1

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8100"]
