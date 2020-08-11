// based on https://github.com/cedricode/koa2-oauth2-server
import OAuth2Server from 'oauth2-server';

export default class KoaOAuth2Server {
  constructor(options) {
    this.OAuth2Server = new OAuth2Server(options);
  }

  authenticateMiddleware() {
    const self = this;
    return function authenticate(ctx) {
      const request = new OAuth2Server.Request(ctx.request);
      const response = new OAuth2Server.Response(ctx.response);
      return self.OAuth2Server.authenticate(request, response);
    };
  }

  authorizeMiddleware(options) {
    const self = this;
    return async function authorize(ctx, next) {
      const request = new OAuth2Server.Request(ctx.request);
      const response = new OAuth2Server.Response(ctx.response);
      const code = await self.OAuth2Server.authorize(
        request,
        response,
        options,
      );
      ctx.code = code;
      next();
    };
  }

  token() {
    const self = this;
    return async function token(ctx, next) {
      const request = new OAuth2Server.Request(ctx.request);
      const response = new OAuth2Server.Response(ctx.response);
      const newToken = await self.OAuth2Server.token(request, response);
      ctx.token = newToken;
      next();
    };
  }
}
