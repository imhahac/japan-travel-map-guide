FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

# 啟用 corepack (支援 pnpm / yarn) 並安裝 Cloudflare Wrangler CLI
RUN corepack enable && \
    npm install -g wrangler@latest

# 切換至非 root 使用者 (node)
USER node
