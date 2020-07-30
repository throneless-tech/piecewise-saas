/**
 * Middleware shim to get current instance and add it to context.
 *
 * @param {Object} ctx - the koa context object
 * @param {function} next - continue to next middleware
 */

const currentInstance = () => {
  return async (ctx, next) => {
    const path = ctx.request.path.replace(/^\/+|\/+$/g, '').split('/');
    if (path[0] === 'api' && path[2] === 'instances') {
      ctx.state.instance = path[3];
    } else {
      ctx.state.instance = null;
    }
    await next();
  };
};

export default currentInstance;
