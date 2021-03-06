import { UnprocessableError } from '../../common/errors.js';
import Joi from '@hapi/joi';

const schema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30),
  password: Joi.string(),
  id: Joi.number(),
  firstName: Joi.string(),
  lastName: Joi.string(),
  instance: Joi.number(),
  email: Joi.string().email(),
  phone: Joi.string(),
  extension: Joi.number(),
  role: Joi.number(),
});

// schema for users editing their own account
const userSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30),
  oldPassword: Joi.string().allow(''),
  newPassword: Joi.string().allow(''),
  id: Joi.number(),
  firstName: Joi.string(),
  lastName: Joi.string(),
  instance: Joi.number(),
  email: Joi.string().email(),
  phone: Joi.string(),
  extension: Joi.number(),
  role: Joi.number(),
});

export async function validate(data, user = false) {
  try {
    let value;
    if (user) {
      value = await userSchema.validateAsync(data);
    } else {
      value = await schema.validateAsync(data);
    }
    return value;
  } catch (err) {
    throw new UnprocessableError('Unable to validate test JSON: ', err);
  }
}
