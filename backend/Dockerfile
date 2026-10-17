# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-install-project --frozen

COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

EXPOSE 8010

CMD ["uv", "run", "uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8010"]
