# Build layer
FROM node:14-buster-slim AS build

RUN apt-get -qq update && \
    apt-get install -y --no-install-recommends build-essential \
                                               python

WORKDIR /src
COPY ./package* ./

RUN npm ci

COPY . .

RUN npm run lint
RUN npm run test

ENV NODE_ENV=production

RUN npm run build

RUN npm prune --production

# Main layer
FROM node:14-buster-slim

RUN apt-get -qq update && \
    apt-get install -y --no-install-recommends curl \
                                               netcat-openbsd \
                                               docker.io \
                                               docker-compose

EXPOSE 3000

WORKDIR /app

COPY --from=build /src .

HEALTHCHECK --interval=5s \
            --timeout=5s \
            --retries=6 \
            CMD curl -fs http://localhost:3000/ || exit 1

ENV NODE_ENV=production

USER root

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["start"]
