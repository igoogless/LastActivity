FROM oven/bun:1.4.4
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY agent ./agent
COPY reto-03 ./reto-03
COPY src ./src
COPY web ./web
EXPOSE 3000
ENV PORT=3000
CMD ["bun", "run", "start"]
