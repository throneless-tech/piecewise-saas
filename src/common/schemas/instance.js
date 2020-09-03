import { UnprocessableError } from '../../common/errors.js';
import Joi from '@hapi/joi';

const creationSchema = Joi.array()
  .items(
    Joi.object({
      domain: Joi.string()
        .domain()
        .required(),
      name: Joi.string().required(),
      secret: Joi.string(),
      redirect_uri: Joi.string().uri(),
    }),
  )
  .min(1);

const updateSchema = Joi.array()
  .items(
    Joi.object({
      domain: Joi.string()
        .domain()
        .required(),
      name: Joi.string().required(),
      secret: Joi.string(),
      redirect_uri: Joi.string().uri(),
    }).min(1),
  )
  .min(1);

export async function validateCreation(data) {
  try {
    data = Array.isArray(data) ? data : [data];
    const value = await creationSchema.validateAsync(data);
    return value;
  } catch (err) {
    throw new UnprocessableError('Unable to validate JSON: ', err);
  }
}

export async function validateUpdate(data) {
  try {
    data = Array.isArray(data) ? data : [data];
    const value = await updateSchema.validateAsync(data);
    return value;
  } catch (err) {
    throw new UnprocessableError('Unable to validate JSON: ', err);
  }
}
