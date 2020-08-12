import bcrypt from 'bcryptjs';
import { validate } from '../../common/schemas/oauth.js';
import { BadRequestError, ForbiddenError } from '../../common/errors.js';

const accessTokenLifeTime = 15 * 60;
const refreshTokenLifeTime = 30 * 24 * 60 * 60;

function comparePass(userPassword, databasePassword) {
  return bcrypt.compareSync(userPassword, databasePassword);
}

export default class Oauth {
  constructor(db) {
    this._db = db;
  }

  //getClient(clientId, clientSecret) {
  //  console.log('client credentials');
  //  return {
  //    id: 'someid',
  //    clientId,
  //    clientSecret,
  //    name: 'Piecewise',
  //    grants: ['password', 'authorization_code'],
  //    accessTokenLifeTime: 15 * 60,
  //    refreshTokenLifeTime: 30 * 24 * 60 * 60,
  //    redirectUris: ['http://google.com'],
  //  };
  //}

  async getAccessToken(bearerToken) {
    return await this._db
      .table('oauth_tokens')
      .select('*')
      .where({ access_token: bearerToken });
  }

  async getClient(clientId, clientSecret) {
    const client = await this._db
      .table('instances')
      .select('*')
      .where({ domain: clientId, secret: clientSecret });
    return {
      id: client.domain,
      grants: ['password'],
      accessTokenLifeTime: accessTokenLifeTime,
      refreshTokenLifeTime: refreshTokenLifeTime,
      redirectUris: [client.redirect_uri],
    };
  }

  async getUser(username, password) {
    try {
      const user = await this.findByUsername(username, true);
      if (!comparePass(password, user.password)) {
        return user;
      } else {
        throw new ForbiddenError('Authentication failed');
      }
    } catch (err) {
      throw new BadRequestError('Error fetching user: ', err);
    }
  }

  async getRefreshToken(bearerToken) {
    return this._db
      .table('oauth_tokens')
      .select('*')
      .where({ refresh_token: bearerToken });
  }

  async saveToken(token, client, user) {
    try {
      await validate(token);

      const query = {
        access_token: token.accessToken,
        access_token_expires_on: token.accessTokenExpiresOn,
        client_id: client.id,
        refresh_token: token.refreshToken,
        refresh_token_expires_on: token.refreshTokenExpiresOn,
        user_id: user.id,
      };

      return this._db
        .table('oauth_tokens')
        .insert(query)
        .returning('*');
    } catch (err) {
      throw new BadRequestError('Failed to create user: ', err);
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
