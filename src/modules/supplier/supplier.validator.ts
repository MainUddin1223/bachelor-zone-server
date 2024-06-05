import Joi from 'joi';

export const rechargeValidatorSchema = Joi.object({
  balance: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid balance',
      'any.required': 'Balance is required',
    })
    .strict(),
  userId: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid user id',
      'any.required': 'User Id is required',
    })
    .strict(),
});
