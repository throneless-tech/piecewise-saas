import { validate } from '../../common/schemas/oauth.js';
import { BadRequestError } from '../../common/errors.js';

export default class Oauth {
  constructor(db) {
    this._db = db;
  }

  getClient(clientId, clientSecret) {
    console.log('client credentials');
    return {
      id: 'someid',
      clientId,
      clientSecret,
      name: 'Piecewise',
      grants: ['password', 'authorization_code'],
      accessTokenLifeTime: 15 * 60,
      refreshTokenLifeTime: 30 * 24 * 60 * 60,
      redirectUris: ['http://google.com'],
    };
  }

  async getAccessToken(bearerToken) {
    return await this._db
      .table('oauth_tokens')
      .select('*')
      .where({ access_token: bearerToken });
  }

  async getClient(clientId, clientSecret) {
    return this._db
      .table('oauth_clients')
      .select('*')
      .where({ client_id: clientId, client_secret: clientSecret });
  }

  async getRefreshToken(bearerToken) {
    return this._db
      .table('oauth_tokens')
      .select('*')
      .where({ refresh_token: bearerToken });
  }

  async saveAccessToken(token, client, user) {
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
}
