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

export const ClaimUserSchema = Joi.object({
  id: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid user Id',
      'any.required': 'User Id is required',
    })
    .strict(),
  balance: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid balance',
      'any.required': 'Balance is required',
    })
    .strict(),
  addressId: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid Address id',
      'any.required': 'Address Id is required',
    })
    .strict(),
  teamId: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid leader id',
      'any.required': 'Leader Id is required',
    })
    .strict(),
});

export const ChangeTeamSchema = Joi.object({
  userId: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid user Id',
      'any.required': 'User Id is required',
    })
    .strict(),
  teamId: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid team id',
      'any.required': 'Team id is required',
    })
    .strict(),
});

export const RechargeSchema = Joi.object({
  userId: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid user Id',
      'any.required': 'User Id is required',
    })
    .strict(),
  balance: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid balance',
      'any.required': 'Balance is required',
    })
    .strict(),
});

export const expensesSchema = Joi.object({
  product_name: Joi.string().required().messages({
    'string.pattern.base': 'Invalid product name',
    'any.required': 'Product name is required',
  }),
  quantity: Joi.string().required().messages({
    'string.pattern.base': 'Invalid product quantity',
    'any.required': 'Product quantity is required',
  }),
  amount: Joi.number()
    .required()
    .messages({
      'number.base': 'Invalid amount',
      'any.required': 'Amount is required',
    })
    .strict(),
  date: Joi.date().optional().messages({
    'date.base': 'Invalid amount',
  }),
});
