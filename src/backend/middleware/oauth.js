// based on https://github.com/cedricode/koa2-oauth2-server
import OAuth2Server, { Request, Response } from 'oauth2-server';
import { BadRequestError, ServerError } from '../../common/errors.js';
import { getLogger } from '../log.js';

const log = getLogger('backend:middleware:oauth');

const oauthWrapper = options => {
  if (!options.model) {
    throw new ServerError('OAuth2 middleware missing data model.');
  }

  const server = new OAuth2Server(options);

  const authenticate = async (ctx, next) => {
    log.debug('Calling authentication middleware');
    const request = new Request(ctx.request);
    const response = new Response(ctx.response);

    try {
      const token = server.authenticate(request, response, options);
      ctx.state.oauth = { token: token };
    } catch (err) {
      throw new BadRequestError('Failed to grant OAuth2 authentication: ', err);
    }

    await next();
  };

  const authorize = async ctx => {
    log.debug('Calling authorization middleware');
    const request = new Request(ctx.request);
    const response = new Response(ctx.response);

    try {
      const code = await server.authorize(request, response, {
        authenticateHandler: {
          handle: () => {
            if (ctx.isAuthenticated()) {
              return ctx.state.user;
            } else {
              return false;
            }
          },
        },
        allowEmptyState: true,
      });
      log.debug('Authorization code: ', code);
      ctx.state.oauth = { code: code };
    } catch (err) {
      throw new BadRequestError('Failed to grant OAuth2 authorization: ', err);
    }

    //await next();
  };

  const token = async (ctx, next) => {
    log.debug('Calling token middleware');
    const request = new Request(ctx.request);
    const response = new Response(ctx.response);

    try {
      const token = await server.token(request, response, options);
      ctx.state.oauth = { token: token };
    } catch (err) {
      throw new BadRequestError('Failed to grant OAuth2 token: ', err);
    }

    await next();
  };

  return { authenticate, authorize, token };
};

export default oauthWrapper;
