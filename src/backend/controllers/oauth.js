import Router from '@koa/router';
import oauthWrapper from '../middleware/oauth.js';
//import { getLogger } from '../log.js';

//const log = getLogger('backend:controllers:oauth');

export default function controller(oauth) {
  const router = new Router();
  const { authorization, token } = oauthWrapper({ model: oauth });

  // Post authorization.
  router.get('/authorize', authorization, async ctx => {
    // Redirect anonymous users to login page.
    if (!ctx.isAuthenticated()) {
      return ctx.redirect('/login');
    }

    if (ctx.state.oauth && ctx.state.oauth.code) {
      ctx.response.body = {
        statusCode: 200,
        status: 'ok',
        data: ctx.state.oauth.code,
      };
      ctx.response.status = 200;
    } else {
      ctx.throw(403, 'Code denied.');
    }
  });

  // Post token.
  router.post('/token', token, async ctx => {
    // Redirect anonymous users to login page.
    if (!ctx.isAuthenticated()) {
      return ctx.redirect('/login');
    }

    if (ctx.state.oauth && ctx.state.oauth.token) {
      ctx.response.body = {
        statusCode: 200,
        status: 'ok',
        data: ctx.state.oauth.code,
      };
      ctx.response.status = 200;
    } else {
      ctx.throw(403, 'Token denied.');
    }
  });

  return router;
}
