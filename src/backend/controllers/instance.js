import path from 'path';
import Router from '@koa/router';
import Joi from '@hapi/joi';
import * as compose from 'docker-compose';
import moment from 'moment';
import { dir } from 'tmp-promise';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { BadRequestError } from '../../common/errors.js';
import {
  validateCreation,
  //  validateUpdate,
} from '../../common/schemas/instance.js';
import { getLogger } from '../log.js';

const log = getLogger('backend:controllers:instance');

const __dirname = path.resolve();

const query_schema = Joi.object({
  start: Joi.number()
    .integer()
    .greater(-1),
  end: Joi.number()
    .integer()
    .positive(),
  asc: Joi.boolean(),
  sort_by: Joi.string(),
  from: Joi.string(),
  to: Joi.string(),
  of_user: Joi.number()
    .integer()
    .positive(),
});

async function validate_query(query) {
  try {
    const value = await query_schema.validateAsync(query);
    return value;
  } catch (err) {
    throw new BadRequestError('Unable to validate query: ', err);
  }
}

const upgrade_schema = Joi.object({
  pull: Joi.boolean(),
});

async function validate_upgrade(query) {
  try {
    const value = await upgrade_schema.validateAsync(query);
    return value;
  } catch (err) {
    throw new BadRequestError('Unable to validate query: ', err);
  }
}

// eslint-disable-next-line no-unused-vars
export default function controller(domain, instances, thisUser, mapboxKey) {
  const router = new Router();

  router.post('/instances', thisUser.can('access admin pages'), async ctx => {
    log.debug('Adding new instance.');
    let data, instance, composeOptions, cleanupCb, tmpDir;

    try {
      data = await validateCreation(ctx.request.body.data);
    } catch (err) {
      log.error('HTTP 400 Error: ', err);
      ctx.throw(400, `Failed to parse instance schema: ${err}`);
    }

    try {
      if (!data[0].secret) {
        data[0].secret = uuidv4();
      }
      if (!data[0].redirect_uri) {
        data[0].redirect_uri = `https://${
          data[0].domain
        }/api/v1/oauth2/callback`;
      }

      instance = await instances.create(data[0]);

      // workaround for sqlite
      if (Number.isInteger(instance[0])) {
        instance = await instances.findById(instance[0]);
      }

      // create custom variables for env file
      const contents = `
      PIECEWISE_CONTAINER_NAME=piecewise-${instance[0].name}
      PIECEWISE_DB_CONTAINER_NAME=piecewise-${instance[0].name}-db
      PIECEWISE_DB_HOST=piecewise-${instance[0].name}-db
      PIECEWISE_DB_PASSWORD=${instance[0].secret}
      PIECEWISE_DOMAIN=${instance[0].domain}
      PIECEWISE_OAUTH_CLIENT_SECRET=${instance[0].secret}
      PIECEWISE_OAUTH_AUTH_URL=https://${domain}/oauth2/authorize
      PIECEWISE_OAUTH_TOKEN_URL=https://${domain}/oauth2/token
      PIECEWISE_OAUTH_CALLBACK_URL=https://${
        instance[0].domain
      }/api/v1/oauth2/callback
      PIECEWISE_MAPBOX_KEY=${mapboxKey}
      `;

      // options for docker build
      composeOptions = [['--project-name', `Piecewise_${instance[0].name}`]];

      const { path: tmp, cleanup } = await dir({
        prefix: 'piecewise-',
        unsafeCleanup: true,
      });
      tmpDir = tmp;
      cleanupCb = cleanup;
      log.debug('Creating temporary directory: ', tmpDir);
      // create custom  env vars file
      await fs.writeFile(path.join(tmpDir, '.env'), contents);
      await fs.copyFile(
        path.join(
          __dirname,
          './src/backend/instances',
          'docker-compose-create.yml',
        ),
        path.join(tmpDir, 'docker-compose.yml'),
      );
    } catch (err) {
      log.error('HTTP 500 Error: ', err);
      ctx.throw(500, `Failed to setup docker-compose environment: ${err}`);
    }

    // docker-compose up
    log.info('Creating containers');
    compose
      .upAll({
        cwd: tmpDir,
        log: true,
        composeOptions: composeOptions,
      })
      .then(() => {
        log.debug('Running database migrations');
        return compose.exec(
          'piecewise',
          './docker-entrypoint.sh db:migrations',
          {
            cwd: tmpDir,
            log: true,
            composeOptions: composeOptions,
          },
        );
      })
      .then(() => {
        log.debug('Running database seeds');
        return compose.exec('piecewise', './docker-entrypoint.sh db:seeds', {
          cwd: tmpDir,
          log: true,
          composeOptions: composeOptions,
        });
      })
      .then(() => {
        log.debug('Cleaning up temporary files');
        return cleanupCb();
      })
      .then(() => {
        log.info('Creation complete!');
        return;
      })
      .catch(err => {
        log.error('HTTP 500 Error: ', err);
        ctx.throw(500, `Failed to cleanly run docker-compose: ${err}`);
      });
    ctx.response.body = { statusCode: 201, status: 'created', data: instance };
    ctx.response.status = 201;
  });

  router.put(
    '/instances/:id',
    thisUser.can('access admin pages'),
    async ctx => {
      log.debug('Updating instance.');
      let composeOptions, cleanupCb, tmpDir;

      const instance = await instances.findById(ctx.params.id);
      if (!Array.isArray(instance) || instance.length < 1) {
        ctx.throw(404, 'Instance not found.');
      }

      try {
        // create custom variables for env file
        const contents = `
      PIECEWISE_CONTAINER_NAME=piecewise-${instance[0].name}
      PIECEWISE_DB_CONTAINER_NAME=piecewise-${instance[0].name}-db
      PIECEWISE_DB_HOST=piecewise-${instance[0].name}-db
      PIECEWISE_DB_PASSWORD=${instance[0].secret}
      PIECEWISE_DOMAIN=${instance[0].domain}
      PIECEWISE_OAUTH_CLIENT_SECRET=${instance[0].secret}
      PIECEWISE_OAUTH_AUTH_URL=https://${domain}/oauth2/authorize
      PIECEWISE_OAUTH_TOKEN_URL=https://${domain}/oauth2/token
      PIECEWISE_OAUTH_CALLBACK_URL=https://${
        instance[0].domain
      }/api/v1/oauth2/callback
      PIECEWISE_MAPBOX_KEY=${mapboxKey}
      `;

        // options for docker build
        composeOptions = [['--project-name', `Piecewise_${instance[0].name}`]];

        const { path: tmp, cleanup } = await dir({
          prefix: 'piecewise-',
          unsafeCleanup: true,
        });
        tmpDir = tmp;
        cleanupCb = cleanup;
        log.debug('Creating temporary directory: ', tmpDir);
        // create custom  env vars file
        await fs.writeFile(path.join(tmpDir, '.env'), contents);
        await fs.copyFile(
          path.join(
            __dirname,
            './src/backend/instances',
            'docker-compose-create.yml',
          ),
          path.join(tmpDir, 'docker-compose.yml'),
        );
      } catch (err) {
        log.error('HTTP 500 Error: ', err);
        ctx.throw(500, `Failed to setup docker-compose environment: ${err}`);
      }

      // docker-compose up
      const query = validate_upgrade(ctx.query);
      const run = Promise.resolve();
      if (query.pull) {
        // eslint-disable-next-line promise/catch-or-return
        run.then(() => {
          log.debug('Pulling new images');
          return compose.pullAll({
            cwd: tmpDir,
            log: true,
            composeOptions: composeOptions,
          });
        });
      }
      run
        .then(() => {
          log.debug('Updating containers');
          return compose.upAll({
            cwd: tmpDir,
            log: true,
            composeOptions: composeOptions,
          });
        })
        .then(() => {
          log.debug('Running database migrations');
          return compose.exec(
            'piecewise',
            './docker-entrypoint.sh db:migrations',
            {
              cwd: tmpDir,
              log: true,
              composeOptions: composeOptions,
            },
          );
        })
        .then(() => {
          log.debug('Cleaning up temporary files');
          return cleanupCb();
        })
        .then(() => {
          log.debug('Upgrade complete!');
          return;
        })
        .catch(err => {
          log.error('HTTP 500 Error: ', err);
          ctx.throw(500, `Failed to cleanly run docker-compose: ${err}`);
        });

      ctx.response.body = {
        statusCode: 200,
        status: 'ok',
        data: instance,
      };
      ctx.response.status = 200;
    },
  );

  router.get('/instances', thisUser.can('access private pages'), async ctx => {
    log.debug(`Retrieving instances.`);
    let res;
    try {
      const query = await validate_query(ctx.query);
      let from, to;

      if (query.from) {
        const timestamp = moment(query.from);
        if (timestamp.isValid()) {
          log.error('HTTP 400 Error: Invalid timestamp value.');
          ctx.throw(400, 'Invalid timestamp value.');
        }
        from = timestamp.toISOString();
      }
      if (query.to) {
        const timestamp = moment(query.to);
        if (timestamp.isValid()) {
          log.error('HTTP 400 Error: Invalid timestamp value.');
          ctx.throw(400, 'Invalid timestamp value.');
        }
        to = timestamp.toISOString();
      }
      res = await instances.find({
        start: query.start,
        end: query.end,
        asc: query.asc,
        sort_by: query.sort_by,
        from: from,
        to: to,
        of_user: query.of_user,
      });
      ctx.response.body = {
        statusCode: 200,
        status: 'ok',
        data: res,
      };
      ctx.response.status = 200;
    } catch (err) {
      log.error('HTTP 400 Error: ', err);
      ctx.throw(400, `Failed to parse query: ${err}`);
    }
  });

  router.get(
    '/instances/:id',
    thisUser.can('access private pages'),
    async ctx => {
      log.debug(`Retrieving instance ${ctx.params.id}.`);
      let instance;

      try {
        instance = await instances.findById(ctx.params.id);

        // TODO: Delete docker containers related to instance
        // compose
        //   .stopOne(ctx.params.id)
        //   .then(
        //     res => {
        //       log.debug('Response: ', res);
        //       return;
        //     },
        //     err => {
        //       log.error('An error occurred: ', err.message);
        //     },
        //   )
        //   .catch(err => {
        //     log.error('An error occurred: ', err);
        //   });
      } catch (err) {
        log.error('HTTP 400 Error: ', err);
        ctx.throw(400, `Failed to parse query: ${err}`);
      }

      if (instance.length) {
        ctx.response.body = { statusCode: 200, status: 'ok', data: instance };
        ctx.response.status = 200;
      } else {
        log.error(
          `HTTP 404 Error: That instance with ID ${
            ctx.params.id
          } does not exist.`,
        );
        ctx.throw(
          404,
          `That instance with ID ${ctx.params.id} does not exist.`,
        );
      }
    },
  );

  //  router.put(
  //    '/instances/:id',
  //    thisUser.can('access admin pages'),
  //    async ctx => {
  //      log.debug(`Updating instance ${ctx.params.id}.`);
  //      let updated;
  //
  //      try {
  //        const data = await validateUpdate(ctx.request.body.data);
  //        updated = await instances.update(ctx.params.id, data);
  //      } catch (err) {
  //        log.error('HTTP 400 Error: ', err);
  //        ctx.throw(400, `Failed to parse query: ${err}`);
  //      }
  //      if (updated) {
  //        const instance = await instances.findById(ctx.params.id);
  //        ctx.response.body = {
  //          statusCode: 204,
  //          status: 'update',
  //          data: instance,
  //        };
  //      } else {
  //        ctx.response.body = {
  //          statusCode: 201,
  //          status: 'created',
  //          data: { id: ctx.params.id },
  //        };
  //        ctx.response.status = 201;
  //      }
  //    },
  //  );

  router.delete(
    '/instances/:id',
    thisUser.can('access admin pages'),
    async ctx => {
      log.debug(`Deleting instance ${ctx.params.id}.`);
      let instance, composeOptions, cleanupCb, tmpDir;

      try {
        instance = await instances.findById(ctx.params.id);
      } catch (err) {
        log.error('HTTP 400 Error: ', err);
        ctx.throw(400, `Failed to parse query: ${err}`);
      }

      if (Array.isArray(instance) && instance.length > 0) {
        try {
          // create custom variables for env file
          const contents = `
            PIECEWISE_CONTAINER_NAME=piecewise-${instance[0].name}
            PIECEWISE_DB_CONTAINER_NAME=piecewise-${instance[0].name}-db
            PIECEWISE_DB_HOST=piecewise-${instance[0].name}-db
            PIECEWISE_DB_PASSWORD=${uuidv4()}
            PIECEWISE_DOMAIN=${instance[0].domain}
            PIECEWISE_OAUTH_CLIENT_SECRET=${instance[0].secret}
            PIECEWISE_OAUTH_AUTH_URL=https://${domain}/oauth2/authorize
            PIECEWISE_OAUTH_TOKEN_URL=https://${domain}/oauth2/token
            PIECEWISE_OAUTH_CALLBACK_URL=https://${
              instance[0].domain
            }/api/v1/oauth2/callback
            PIECEWISE_MAPBOX_KEY=${mapboxKey}
            `;

          // options for docker build
          composeOptions = [
            ['--project-name', `Piecewise_${instance[0].name}`],
          ];

          const { path: tmp, cleanup } = await dir({
            prefix: 'piecewise-',
            unsafeCleanup: true,
          });
          tmpDir = tmp;
          cleanupCb = cleanup;
          log.debug('Creating temporary directory: ', tmpDir);
          // create custom  env vars file
          await fs.writeFile(path.join(tmpDir, '.env'), contents);
          await fs.copyFile(
            path.join(
              __dirname,
              './src/backend/instances',
              'docker-compose-delete.yml',
            ),
            path.join(tmpDir, 'docker-compose.yml'),
          );
        } catch (err) {
          log.error('HTTP 500 Error: ', err);
          ctx.throw(500, `Failed to setup docker-compose environment: ${err}`);
        }

        // docker-compose up
        compose
          .down({
            cwd: tmpDir,
            log: true,
            composeOptions: composeOptions,
            commandOptions: ['--volumes'],
          })
          .then(() => cleanupCb())
          .catch(err => {
            log.error('HTTP 500 Error: ', err);
            ctx.throw(500, `Failed to cleanly run docker-compose: ${err}`);
          });

        try {
          instance = await instances.delete(ctx.params.id);
        } catch (err) {
          log.error('HTTP 500 Error: ', err);
          ctx.throw(500, `Failed to remove instance from database: ${err}`);
        }
        ctx.response.body = { statusCode: 200, status: 'ok', data: instance };
        ctx.response.status = 200;
      } else {
        log.error(
          `HTTP 404 Error: That instance with ID ${
            ctx.params.id
          } does not exist.`,
        );
        ctx.throw(
          404,
          `That instance with ID ${ctx.params.id} does not exist.`,
        );
      }
    },
  );

  return router;
}
