import Joi from 'joi';
export const addressSchema = Joi.object({
  address: Joi.string().required().messages({
    'string.pattern.base': 'Invalid Address',
    'any.required': 'Address is required',
  }),
});
