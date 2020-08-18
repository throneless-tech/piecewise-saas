import bcrypt from 'bcryptjs';
import moment from 'moment';
import { validate } from '../../common/schemas/oauth.js';
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
    return {
      id: client[0].domain,
      grants: ['password'],
      accessTokenLifeTime: accessTokenLifeTime,
      refreshTokenLifeTime: refreshTokenLifeTime,
      redirectUris: [client[0].redirect_uri],
    };
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

      const query = {
        access_token: token.accessToken,
        access_token_expires_at: token.accessTokenExpiresAt.toISOString(),
        refresh_token: token.refreshToken,
        refresh_token_expires_at: token.refreshTokenExpiresAt.toISOString(),
        scope: token.scope,
        client_id: client.id,
        user_id: user.id,
      };

      await this._db.table('oauth_tokens').insert(query);
      const tokens = await this._db
        .table('oauth_tokens')
        .select('*')
        .where({
          access_token: token.accessToken,
          refresh_token: token.refreshToken,
          client_id: client.id,
          user_id: user.id,
        });
      return {
        accessToken: tokens[0].access_token,
        accessTokenExpiresAt: moment(
          tokens[0].access_token_expires_at,
        ).toDate(),
        refreshToken: tokens[0].refresh_token,
        refreshTokenExpiresAt: moment(
          tokens[0].refresh_token_expires_at,
        ).toDate(),
        scope: tokens[0].scope,
        client: { id: tokens[0].client_id },
        user: { id: tokens[0].user_id },
      };
    } catch (err) {
      throw new BadRequestError('Failed to save token: ', err);
    }
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

      const query = {
        code: code.authorizationCode,
        expires_at: code.expiresAt.toISOString(),
        redirect_uri: code.redirectUri,
        scope: code.scope,
        client_id: client.id,
        user_id: user.id,
      };

      await this._db.table('oauth_codes').insert(query);
      const codes = await this._db
        .table('oauth_codes')
        .select('*')
        .where({
          auth_code: code.authorizationCode,
          client_id: client.id,
          user_id: user.id,
        });
      return {
        authorizationCode: codes[0].auth_code,
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
          role: 'users.role',
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
        .where({ 'users.username': username })
        .first();
    } else {
      return this._db
        .select({
          id: 'users.id',
          username: 'users.username',
          firstName: 'users.firstName',
          lastName: 'users.lastName',
          location: 'instances.id',
          location_name: 'instances.domain',
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
        .where({ 'users.username': username })
        .first();
    }
  }
}
