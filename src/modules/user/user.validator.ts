import Joi from 'joi';

export const orderSchema = Joi.object({
  deliveryDate: Joi.date().required().messages({
    'string.pattern.base': 'Invalid Date',
    'any.required': 'Delivery date is required',
  }),
});
