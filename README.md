# Piecewise SaaS

Software-as-a-service deployment and authentication portal for M-Lab's
Piecewise.

## Requirements

- [Node.js](https://nodejs.org) of version `>=12`
- `npm`

## Structure

Piecewise SaaS is composed of 2 different parts:

- A [React](https://reactjs.org/)-based **frontend**.
- A [Koa](https://koajs.com)-based **backend** that renders & serves the
  frontend and exposes an API used by the frontend.

These parts are located here in this repository:

```
src/backend  # The backend components
src/common   # Common code and assets
src/frontend # The React frontend
```

## Configuration

Piecewise SaaS is configured via variables either specified in the environment
or defined in a `.env` file (see `env.example` for an example configuration that
may be edited and copied to `.env`).

The backend parses the following configuration variables:

```
PIECEWISE_SAAS_LOG_LEVEL       # Logging level (default: error)
PIECEWISE_SAAS_DOMAIN          # The domain at which Piecewise SaaS is being hosted
PIECEWISE_SAAS_HOST            # The host Piecewise runs on (default: localhost)
PIECEWISE_SAAS_PORT            # The port to bind to (default: 3000)
PIECEWISE_SAAS_DB_HOST         # Postgres database host (default: localhost)
PIECEWISE_SAAS_DB_PORT         # Postgres port (default: 5432)
PIECEWISE_SAAS_DB_DATABASE     # Postgres database name (default: piecewise)
PIECEWISE_SAAS_DB_USERNAME     # Postgres user (default: piecewise)
PIECEWISE_SAAS_DB_PASSWORD     # Postgres password
PIECEWISE_SAAS_DB_POOL_MIN     # Postgres minimum connections (default: 0)
PIECEWISE_SAAS_DB_POOL_MAX     # Postgres max connections (default: 10)
PIECEWISE_SAAS_DB_TIMEOUT      # Postgres connection timeout (default: 0)
PIECEWISE_SAAS_MAPBOX_KEY      # The Mapbox API key to which to default Piecewise instances
```

Additionally, we use the semi-standard `NODE_ENV` variable for defining test,
staging, and production.In development mode Piecewise SaaS uses sqlite3, but
uses Postgres in production.

## Deployment

### Standalone

First, clone this repository and from the root of the resulting directory
install Piecewise SaaS's dependencies:

```
npm install
```

Then, build all components:

```
npm run build
```

Create the database:

```
npm run db:migrations
```

and to optionally populate it with test data:

```
npm run db:seeds
```

And start the running processes (with necessary environment variables if not
defined in `.env`):

```
npm run start
```

(use `npm run start:dev` to run in development mode)

Additionally, components can be built or started individually using for example
`npm run build:backend`, `npm run start:worker`, etc.

### Docker

You can deploy this tool using [Docker](https://docker.io). There is an included
`docker-compose.yml` file that will allow you to run it in a production
configuration. First, clone the repo and from this directory run docker-compose:

```
docker-compose up --build -d
```

This will build the docker container from the current repository, download the
official Postgres docker image, and configure them both (the `-d` flag will
detach from the current shell so that you can leave it running, but you can omit
it in order to leave the log output attached).

If this is the first time you've run it on this system, you'll want to run the
database migrations to initialize the database:

```
docker-compose run piecewise-saas db:migrations
```

and then optionally seed the database with a default admin user:

```
docker-compose run piecewise-saas db:seeds
```

By default, it runs behind [Traefik](https://traefik.io) on ports 80 & 443, and Traefik will take care of issuing certificates via Letsencrypt.

## OAuth2 Support

Piecewise SaaS maintains Piecewise instances with OAuth2 for authentication. **This support was made and tested for use with [Piecewise](https://github.com/m-lab/piecewise), YMMV when using a different backend.**

Piecewise-SaaS takes care of configuring the OAuth2 parameters for the Piecewise instances it manages.

## Backups
To backup an instance of Piecewise running in a Docker container, run the following command:

```
docker exec <name of postgres container> pg_dumpall -c -U <database user, default piecewise> dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
```

To restore:
```
cat <backup file>.sql | docker exec -t <name of postgres container> pg_dumpall -c -U <database user, default piecewise > dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
```


## License

Piecewise SaaS is an open-source software project licensed under the Apache
License v2.0 by [Measurement Lab](https://measurementlab.net) and
[Throneless Tech](https://throneless.tech).
