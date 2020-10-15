import path from 'path';
import Koa from 'koa';
import compose from 'koa-compose';
import cors from '@koa/cors';
import log4js from 'koa-log4';
import bodyParser from 'koa-body';
import flash from 'koa-better-flash';
import mount from 'koa-mount';
import serveStatic from 'koa-static';
import passport from 'koa-passport';
import koa404handler from 'koa-404-handler';
import errorHandler from 'koa-better-error-handler';
import db from './db.js';
import authHandler from './middleware/auth.js';
import cloudflareAccess from './middleware/cloudflare.js';
import currentInstance from './middleware/instance.js';
import sessionWrapper from './middleware/session.js';
//import ssr from './middleware/ssr.js';
import UserController from './controllers/user.js';
import GroupController from './controllers/group.js';
import InstanceController from './controllers/instance.js';
import SettingController from './controllers/setting.js';
import OauthController from './controllers/oauth.js';
import Instances from './models/instance.js';
import Settings from './models/setting.js';
import Users from './models/user.js';
import Groups from './models/group.js';
import Oauth from './models/oauth.js';

const __dirname = path.resolve();
const STATIC_DIR = path.resolve(__dirname, 'dist', 'frontend');
//const ENTRYPOINT = path.resolve(STATIC_DIR, 'index.html');

export default function configServer(config) {
  // Initialize our application server
  const server = new Koa();

  // Configure logging
  log4js.configure({
    appenders: { console: { type: 'stdout', layout: { type: 'colored' } } },
    categories: {
      default: { appenders: ['console'], level: config.log_level },
    },
  });
  server.use(log4js.koaLogger(log4js.getLogger('http'), { level: 'auto' }));

  const log = log4js.getLogger('backend:server');

  // Setup our authentication middleware
  const groupModel = new Groups(db);
  const instanceModel = new Instances(db);
  server.use(currentInstance());
  const auth = authHandler(groupModel, instanceModel);
  server.use(auth.middleware());

  // Setup our API handlers
  const userModel = new Users(db);
  const users = UserController(userModel, auth);
  const groups = GroupController(groupModel, auth);
  const settingModel = new Settings(db);
  const settings = SettingController(settingModel, auth);
  const instances = InstanceController(
    config.domain,
    instanceModel,
    auth,
    config.mapboxKey,
  );
  instances.use('/instances/:iid', users.routes(), users.allowedMethods());
  const apiV1Router = compose([
    users.routes(),
    users.allowedMethods(),
    groups.routes(),
    groups.allowedMethods(),
    instances.routes(),
    instances.allowedMethods(),
    settings.routes(),
    settings.allowedMethods(),
    ctx => ctx.throw(404, 'Not a valid API method.'), //fallthrough
  ]);

  // Set up oauth server
  const oauthModel = new Oauth(db);
  const oauth = OauthController(oauthModel);
  const oauthRouter = compose([
    oauth.routes(),
    oauth.allowedMethods(),
    ctx => ctx.throw(404, 'Not a valid API method.'), //fallthrough
  ]);

  // Set custom error handler
  server.context.onerror = errorHandler;

  // Specify that this is our backend API (for better-errror-handler)
  server.context.api = true;

  // Setup session middleware
  server.use(async (ctx, next) => {
    let session = await sessionWrapper(server, db);
    await session(ctx, next);
  });

  // If we're running behind Cloudflare, set the access parameters.
  if (config.cfaccessUrl && config.cfaccessAudience) {
    server.use(async (ctx, next) => {
      let cfa = await cloudflareAccess();
      await cfa(ctx, next);
    });
    server.use(async (ctx, next) => {
      let email = ctx.request.header['cf-access-authenticated-user-email'];
      if (!email) {
        if (!config.isDev && !config.isTest) {
          ctx.throw(401, 'Missing header cf-access-authenticated-user-email');
        } else {
          email = 'foo@example.com';
        }
      }
      ctx.state.email = email;
      await next();
    });
  }

  if (config.proxy) {
    server.proxy = true;
  } else {
    log.warn('Disable proxy header support.');
  }

  server
    .use(bodyParser({ multipart: true, json: true }))
    .use(passport.initialize())
    .use(passport.session())
    .use(cors())
    .use(mount('/api/v1', apiV1Router))
    .use(mount('/oauth2', oauthRouter));

  server.context.api = false;
  server
    .use(koa404handler)
    .use(flash())
    .use(mount('/static', serveStatic(STATIC_DIR)))
    .use(
      mount('/admin', async (ctx, next) => {
        if (ctx.isAuthenticated()) {
          log.debug('Admin is authenticated.');
          await next();
        } else {
          log.debug('Admin is NOT authenticated.');
          ctx.throw(401, 'Authentication failed.');
        }
      }),
    )
    .use(async (ctx, next) => {
      ctx.api = false;
      await serveStatic(STATIC_DIR)(
        Object.assign(ctx, { path: 'index.html' }),
        next,
      );
    });

  return server.callback();
}
