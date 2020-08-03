import Router from '@koa/router';
// import { getLogger } from '../log.js';

// const log = getLogger('backend:controllers:oauth');

export default function controller(oauths, thisUser) {
  const router = new Router();

  // Post token.
  router.post('/oauth/token', async () => {
    return router.oauth.grant();
  });

  // Get authorization.
  router.get('/oauth/authorize', async ctx => {
    // Redirect anonymous users to login page.
    if (!thisUser) {
      return ctx.redirect('/');
    } else {
      ctx.state.client_id = this.request.query.client_id;
      ctx.state.redirect_uri = this.request.query.redirect_uri;
    }
  });

  // Post authorization.
  router.post('/oauth/authorize', async ctx => {
    // Redirect anonymous users to login page.
    if (!thisUser) {
      return ctx.redirect('/');
    }
    await router.oauth.authorize();
  });

  return router;
}
