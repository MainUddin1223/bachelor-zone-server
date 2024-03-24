import Joi from 'joi';

export const signUpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^(\+)?(88)?01[0-9]{9}\b/)
    .required()
    .messages({
      'string.pattern.base':
        'Invalid phone number. Must be a valid Bangladeshi phone number.',
      'any.required': 'Phone number is required',
    }),
  password: Joi.string().min(6).max(16).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 16 characters',
    'any.required': 'Password is required',
  }),
  confirmPassword: Joi.string().min(6).max(16).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 16 characters',
    'any.required': 'Password is required',
  }),
  name: Joi.string().required().messages({
    'string.pattern.base': 'Invalid Name',
    'any.required': 'Name is required',
  }),
});

export const loginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^(\+)?(88)?01[0-9]{9}\b/)
    .required()
    .messages({
      'string.pattern.base':
        'Invalid phone number. Must be a valid Bangladeshi phone number.',
      'any.required': 'Phone number is required',
    }),
  password: Joi.string().required().messages({
    'string.min': 'Password must be at least {#limit} characters long',
    'string.max': 'Password cannot exceed {#limit} characters',
    'any.required': 'Password is required',
  }),
});

export const changePasswordSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^(\+)?(88)?01[0-9]{9}\b/)
    .required()
    .messages({
      'string.pattern.base':
        'Invalid phone number. Must be a valid Bangladeshi phone number.',
      'any.required': 'Phone number is required',
    }),
  oldPassword: Joi.string().required().messages({
    'string.min': 'Password must be at least {#limit} characters long',
    'string.max': 'Password cannot exceed {#limit} characters',
    'any.required': 'Password is required',
  }),
  newPassword: Joi.string().required().messages({
    'string.min': 'Password must be at least {#limit} characters long',
    'string.max': 'Password cannot exceed {#limit} characters',
    'any.required': 'Password is required',
  }),
  confirmPassword: Joi.string().required().messages({
    'string.min': 'Password must be at least {#limit} characters long',
    'string.max': 'Password cannot exceed {#limit} characters',
    'any.required': 'Password is required',
  }),
});
