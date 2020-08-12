// based on https://github.com/cedricode/koa2-oauth2-server
import OAuth2Server, { Request, Response } from 'oauth2-server';
import { BadRequestError, ServerError } from '../../common/errors.js';

const oauthWrapper = options => {
  if (!options.model) {
    throw new ServerError('OAuth2 middleware missing data model.');
  }

  const server = new OAuth2Server(options);

  const authenticate = async (ctx, next) => {
    const request = new Request(ctx.request);
    const response = new Response(ctx.response);

    try {
      const token = server.authenticate(request, response, options);
      ctx.state.oauth = { token: token };
    } catch (err) {
      throw new BadRequestError('Failed to grant OAuth2 token: ', err);
    }

    await next();
  };

  const authorization = async (ctx, next) => {
    const request = new Request(ctx.request);
    const response = new Response(ctx.response);

    try {
      const code = server.authorize(request, response, options);
      ctx.state.oauth = { code: code };
    } catch (err) {
      throw new BadRequestError('Failed to grant OAuth2 token: ', err);
    }

    await next();
  };

  const token = async (ctx, next) => {
    const request = new Request(ctx.request);
    const response = new Response(ctx.response);

    try {
      const token = server.token(request, response, options);
      ctx.state.oauth = { token: token };
    } catch (err) {
      throw new BadRequestError('Failed to grant OAuth2 token: ', err);
    }

    await next();
  };

  return { authenticate, authorization, token };
};

export default oauthWrapper;
