# The bare template's Metro, for the hidden tests' check that they fail on an empty app: built
# with its dependencies, run with the test hooks on. The judged app is built by the engine's own
# images/expo/Dockerfile instead.
FROM node:26-slim
WORKDIR /app
RUN npm install -g pnpm@10.22.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV CI=1 EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1
EXPOSE 8081
CMD ["node_modules/.bin/expo", "start", "--port", "8081", "--host", "lan"]
