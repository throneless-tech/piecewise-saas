import Router from '@koa/router';
import oauthWrapper from '../middleware/oauth.js';
import { getLogger } from '../log.js';

const log = getLogger('backend:controllers:oauth');

export default function controller(oauth) {
  const router = new Router();
  const { authorize, token } = oauthWrapper({
    model: oauth,
  });

  // Post authorization.
  router.get('/authorize', async (ctx, next) => {
    log.debug(
      'User seeking authorization is authenticated: ',
      ctx.isAuthenticated(),
    );
    // Redirect anonymous users to login page.
    if (
      !ctx.isAuthenticated() &&
      ctx.query.redirect_uri &&
      ctx.query.client_id &&
      ctx.query.response_type === 'code'
    ) {
      return ctx.redirect(
        '/login' +
          '?response_type=code' +
          '&redirect_uri=' +
          ctx.query.redirect_uri +
          '&client_id=' +
          ctx.query.client_id,
      );
    }

    await authorize(ctx, next);

    if (ctx.state.oauth && ctx.state.oauth.code) {
      return ctx.redirect(
        ctx.query.redirect_uri +
          '?code=' +
          ctx.state.oauth.code.authorizationCode,
      );
    } else {
      ctx.throw(403, 'Code denied.');
    }
  });

  // Post token.
  router.post('/token', token, async ctx => {
    if (ctx.state.oauth && ctx.state.oauth.token) {
      ctx.response.body = {
        statusCode: 200,
        status: 'ok',
        accessToken: ctx.state.oauth.token.accessToken,
        refreshToken: ctx.state.oauth.token.refreshToken,
        data: [ctx.state.oauth.token],
      };
      ctx.response.status = 200;
    } else {
      ctx.throw(403, 'Token denied.');
    }
  });

  return router;
}
