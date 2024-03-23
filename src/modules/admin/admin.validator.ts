import Joi from 'joi';
export const categorySchema = Joi.object({
  category: Joi.string().required().messages({
    'string.pattern.base': 'Invalid Category',
    'any.required': 'Category is required',
  }),
});
export const quizSchema = Joi.object({
  question: Joi.string().required().messages({
    'string.pattern.base': 'Invalid Question',
    'any.required': 'Question is required',
  }),
  questionType: Joi.string().valid('single', 'multiple').required().messages({
    'string.pattern.base': 'Invalid Question type',
    'any.required': 'Question type is required',
  }),
  answer: Joi.array()
    .min(1)
    .max(3)
    .items(
      Joi.string().required().messages({
        'array.base': 'At least one answer is required',
        'array.includes': 'Answer must be strings',
        'any.required': 'Answer is required',
      })
    )
    .required(),
  options: Joi.array()
    .min(3)
    .max(10)
    .items(
      Joi.string().required().messages({
        'array.base': 'At least three options are required',
        'array.includes': 'Options must be strings',
        'any.required': 'Options are required',
      })
    )
    .required(),
});
