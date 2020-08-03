import { UnprocessableError } from '../../common/errors.js';
import Joi from '@hapi/joi';

const tokenSchema = Joi.object({
  id: Joi.number(),
  access_token: Joi.string(),
  access_token_expires_on: Joi.date().timestamp(),
  client_id: Joi.string(),
  refresh_token: Joi.string(),
  refresh_token_expires_on: Joi.date().timestamp(),
  user_id: Joi.string().guid({
    version: ['uuidv4', 'uuidv5'],
  }),
});

const clientSchema = Joi.object({
  id: Joi.number(),
  client_id: Joi.string(),
  client_secret: Joi.string(),
  redirect_uri: Joi.string(),
});

export async function validate(token, client) {
  try {
    let tokenValue, clientValue;
    if (token) {
      tokenValue = await tokenSchema.validateAsync(token);
    }
    if (client) {
      clientValue = await clientSchema.validateAsync(client);
    }
    return [tokenValue, clientValue];
  } catch (err) {
    throw new UnprocessableError('Unable to validate test JSON: ', err);
  }
}
