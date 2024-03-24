import Joi from 'joi';
export const addressSchema = Joi.object({
  address: Joi.string().required().messages({
    'string.pattern.base': 'Invalid Address',
    'any.required': 'Address is required',
  }),
});
export const updateAddressSchema = Joi.object({
  address: Joi.string().required().messages({
    'string.pattern.base': 'Invalid Address',
    'any.required': 'Address is required',
  }),
  id: Joi.number().required().messages({
    'string.pattern.base': 'Invalid id',
    'any.required': 'Id is required',
  }),
});
