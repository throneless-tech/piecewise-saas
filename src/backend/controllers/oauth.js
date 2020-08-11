import Router from '@koa/router';
// import { getLogger } from '../log.js';

// const log = getLogger('backend:controllers:oauth');

export default function controller(model, server, thisUser) {
  const router = new Router();

  // Post token.
  router.post('/token', server.token(), ctx => {
    if (!ctx.token) {
      ctx.status = 400;
      ctx.body = 'Now Allowed';
    } else {
      ctx.body = ctx.token;
      ctx.status = 200;
    }
  });

  // Get authorization.
  router.get('/authorize', async ctx => {
    // Redirect anonymous users to login page.
    if (!thisUser) {
      return ctx.redirect('/');
    } else {
      ctx.state.client_id = this.request.query.client_id;
      ctx.state.redirect_uri = this.request.query.redirect_uri;
    }
  });

  // Post authorization.
  router.post('/authorize', async ctx => {
    // Redirect anonymous users to login page.
    if (!thisUser) {
      return ctx.redirect('/');
    }
    await server.oauth.authorise();
  });

  router.post(
    '/authorize',
    server.authorizeMiddleware({
      authenticateHandler: {
        handle(request, response) {
          return {
            username: 3,
            password: 4,
          };
        },
      },
    }),
    ctx => {
      ctx.body = ctx.code;
    },
  );

  return router;
}
