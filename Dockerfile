# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /transparencia ./cmd/transparencia

# Runtime
FROM alpine:3.20

RUN adduser -D -u 1000 crawler
USER crawler
WORKDIR /data

COPY --from=builder /transparencia /usr/local/bin/transparencia

ENTRYPOINT ["transparencia"]
CMD ["--help"]
