import Joi from 'joi';

export const signUpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+8801[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid phone number.',
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
    'any.required': 'Confirm password is required',
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
  oldPassword: Joi.string().required().messages({
    'string.min': 'Old password must be at least {#limit} characters long',
    'string.max': 'Old password cannot exceed {#limit} characters',
    'any.required': 'Old password is required',
  }),
  newPassword: Joi.string().min(6).max(16).required().messages({
    'string.min': 'New password must be at least {#limit} characters long',
    'string.max': 'New password cannot exceed {#limit} characters',
    'any.required': 'New password is required',
  }),
  confirmPassword: Joi.string().min(6).max(16).required().messages({
    'string.min': 'Confirm password must be at least {#limit} characters long',
    'string.max': 'Confirm password cannot exceed {#limit} characters',
    'any.required': 'Confirm password is required',
  }),
});
