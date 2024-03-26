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

export const CreateTeamSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.pattern.base': 'Invalid Address',
    'any.required': 'Address is required',
  }),
  address_id: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid Address id',
      'any.required': 'Address Id is required',
    })
    .strict(),
  leader_id: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid leader id',
      'any.required': 'Leader Id is required',
    })
    .strict(),
});
