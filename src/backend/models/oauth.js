import bcrypt from 'bcryptjs';
import moment from 'moment';
//import { validate } from '../../common/schemas/oauth.js';
import { BadRequestError } from '../../common/errors.js';
import { getLogger } from '../log.js';

const log = getLogger('backend:models:oauth');

const accessTokenLifeTime = 15 * 60;
const refreshTokenLifeTime = 30 * 24 * 60 * 60;

function comparePass(userPassword, databasePassword) {
  return bcrypt.compareSync(userPassword, databasePassword);
}

export default class Oauth {
  constructor(db) {
    this._db = db;
  }

  async getAuthorizationCode(code) {
    log.debug('OAuth2: getAuthorizationCode() for code', code);
    let ret = {};
    const auth = await this._db
      .select({
        code: 'oauth_codes.code',
        expiresAt: 'oauth_codes.expires_at',
        redirectUri: 'oauth_codes.redirect_uri',
        scope: 'oauth_codes.scope',
        client_id: 'instances.domain',
        client_redirect_uri: 'instances.redirect_uri',
        user_id: 'users.id',
        user_username: 'users.username',
        user_firstName: 'users.firstName',
        user_lastName: 'users.lastName',
        user_instance: 'instances.id',
        user_instanceDomain: 'instances.domain',
        user_email: 'users.email',
        user_phone: 'users.phone',
        user_extension: 'users.extension',
        user_isActive: 'users.isActive',
      })
      .from('oauth_codes')
      .leftJoin('instances', 'instances.id', 'oauth_codes.client_id')
      .leftJoin('users', 'users.id', 'oauth_codes.user_id')
      .where({ 'oauth_codes.code': code });
    if (auth && auth.length > 0) {
      ret.code = auth[0].code;
      ret.expiresAt = moment(auth[0].expiresAt).toDate();
      ret.redirectUri = auth[0].redirectUri;
      ret.scope = auth[0].scope;
      ret.client = {
        id: auth[0].client_id,
        grants: ['authorization_code'],
        accessTokenLifeTime: accessTokenLifeTime,
        refreshTokenLifeTime: refreshTokenLifeTime,
        redirectUris: [auth[0].client_redirect_uri],
      };
      ret.user = {
        id: auth[0].user_id,
        username: auth[0].user_username,
        firstName: auth[0].user_firstName,
        lastName: auth[0].user_lastName,
        instance: auth[0].user_instance,
        instanceDomain: auth[0].user_instanceDomain,
        email: auth[0].user_email,
        phone: auth[0].user_phone,
        extension: auth[0].user_extension,
        isActive: auth[0].user_isActive,
      };
    }
    log.debug('Fetched auth code object: ', ret);
    return ret;
  }

  async getAccessToken(bearerToken) {
    log.debug('OAuth2: getAccessToken() for bearerToken ', bearerToken);
    return await this._db
      .table('oauth_tokens')
      .select('*')
      .where({ access_token: bearerToken });
  }

  async getClient(clientId, clientSecret) {
    log.debug(
      'OAuth2: getClient() for clientId : clientSecret ',
      clientId,
      ':',
      clientSecret,
    );
    const client = await this._db
      .table('instances')
      .select('domain', 'secret', 'redirect_uri')
      .where({ domain: clientId });
    if (Array.isArray(client) && client.length > 0) {
      return {
        id: client[0].domain,
        grants: ['authorization_code'],
        accessTokenLifeTime: accessTokenLifeTime,
        refreshTokenLifeTime: refreshTokenLifeTime,
        redirectUris: [client[0].redirect_uri],
      };
    } else {
      return null;
    }
  }

  async getUser(username, password) {
    log.debug(
      'OAuth2: getUser() for username : password ',
      username,
      ':',
      password,
    );
    try {
      const user = await this.findByUsername(username, true);
      if (user && comparePass(password, user.password)) {
        return user;
      } else {
        return false;
      }
    } catch (err) {
      throw new BadRequestError('Error fetching user: ', err);
    }
  }

  async getRefreshToken(bearerToken) {
    log.debug('OAuth2: getRefreshToken() for bearerToken ', bearerToken);
    return this._db
      .table('oauth_tokens')
      .select('*')
      .where({ refresh_token: bearerToken });
  }

  async saveToken(token, client, user) {
    log.debug(
      'OAuth2: saveToken() for token : client : user',
      token,
      ':',
      client,
      ':',
      user,
    );
    try {
      //await validate(token);

      const instances = await this._db
        .table('instances')
        .select('id', 'domain', 'name', 'secret', 'redirect_uri')
        .where({ domain: client.id });
      const users = await this._db
        .select({
          id: 'users.id',
          username: 'users.username',
          firstName: 'users.firstName',
          lastName: 'users.lastName',
          instance: 'instances.id',
          instance_name: 'instances.name',
          role: 'groups.id',
          role_name: 'groups.name',
          email: 'users.email',
          phone: 'users.phone',
          extension: 'users.extension',
          isActive: 'users.isActive',
        })
        .from('users')
        .leftJoin('instance_users', 'users.id', 'instance_users.uid')
        .leftJoin('instances', 'instances.id', 'instance_users.iid')
        .leftJoin('user_groups', 'users.id', 'user_groups.uid')
        .leftJoin('groups', 'groups.id', 'user_groups.gid')
        .where({ 'users.id': parseInt(user.id) });
      const query = {
        access_token: token.accessToken,
        access_token_expires_at: token.accessTokenExpiresAt.toISOString(),
        refresh_token: token.refreshToken,
        refresh_token_expires_at: token.refreshTokenExpiresAt.toISOString(),
        scope: token.scope,
        client_id: instances[0].id,
        user_id: users[0].id,
      };

      await this._db.table('oauth_tokens').insert(query);
      const ret = {
        accessToken: token.accessToken,
        accessTokenExpiresAt: moment(token.accessTokenExpiresAt).toDate(),
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: moment(token.refreshTokenExpiresAt).toDate(),
        scope: token.scope,
        client: {
          id: instances[0].domain,
          grants: ['authorization_code'],
          accessTokenLifeTime: accessTokenLifeTime,
          refreshTokenLifeTime: refreshTokenLifeTime,
          redirectUris: [instances[0].redirect_uri],
        },
        user: users[0],
      };
      log.debug('saveToken() return:', ret);
      return ret;
    } catch (err) {
      throw new BadRequestError('Failed to save token: ', err);
    }
  }

  async validateScope(user, client, scope) {
    log.debug(
      'OAuth2: validateScope() for user : client : scope',
      user,
      ':',
      client,
      ':',
      scope,
    );
    // TODO: These parameters should obviously be handled consistently across flows
    if (
      client.id !== user.instanceDomain &&
      client.id !== user[0].instance_domain &&
      user.roleName !== 'admins' &&
      user[0].role_name !== 'admins'
    ) {
      log.warn('User not authorized for this instance.');
      return false;
    }
    return ['auth'];
  }

  async saveAuthorizationCode(code, client, user) {
    log.debug(
      'OAuth2: saveAuthorizationCode() for code : client : user',
      code,
      ':',
      client,
      ':',
      user,
    );
    try {
      //await validate(code);

      const instance = await this._db
        .table('instances')
        .select('id', 'domain', 'secret', 'redirect_uri')
        .where({ domain: client.id });
      const query = {
        code: code.authorizationCode,
        expires_at: code.expiresAt.toISOString(),
        redirect_uri: code.redirectUri,
        scope: code.scope,
        client_id: instance[0].id,
        user_id: user[0].id,
      };

      await this._db.table('oauth_codes').insert(query);
      const codes = await this._db
        .table('oauth_codes')
        .select('*')
        .where({
          code: code.authorizationCode,
          client_id: instance[0].id,
          user_id: user[0].id,
        });
      return {
        authorizationCode: codes[0].code,
        expiresAt: moment(codes[0].auth_code_expires_at).toDate(),
        redirectUri: codes[0].redirect_uri,
        scope: codes[0].scope,
        client: { id: codes[0].client_id },
        user: { id: codes[0].user_id },
      };
    } catch (err) {
      throw new BadRequestError('Failed to save code: ', err);
    }
  }

  async revokeAuthorizationCode(code) {
    try {
      await this._db
        .table('oauth_codes')
        .del()
        .where({ code: code });
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Find user by Id
   *
   * @param {integer} id - Find user by id
   */
  async findByUsername(username, privileged = false) {
    if (privileged) {
      return this._db
        .select({
          id: 'users.id',
          username: 'users.username',
          password: 'users.password',
          firstName: 'users.firstName',
          lastName: 'users.lastName',
          instance: 'instances.id',
          instanceDomain: 'instances.domain',
          role: 'users.role',
          email: 'users.email',
          phone: 'users.phone',
          extension: 'users.extension',
          isActive: 'users.isActive',
        })
        .from('users')
        .leftJoin('instance_users', 'users.id', 'instance_users.uid')
        .leftJoin('instances', 'instances.id', 'instance_users.iid')
        .where({ 'users.username': username })
        .first();
    } else {
      return this._db
        .select({
          id: 'users.id',
          username: 'users.username',
          firstName: 'users.firstName',
          lastName: 'users.lastName',
          instance: 'instances.id',
          instanceDomain: 'instances.domain',
          role: 'users.role',
          email: 'users.email',
          phone: 'users.phone',
          extension: 'users.extension',
          isActive: 'users.isActive',
        })
        .from('users')
        .leftJoin('instance_users', 'users.id', 'instance_users.uid')
        .leftJoin('instances', 'instances.id', 'instance_users.iid')
        .where({ 'users.username': username })
        .first();
    }
  }
}
