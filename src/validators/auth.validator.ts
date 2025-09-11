import Joi from "joi";

export const loginSchema = Joi.object({
  username: Joi.string().min(4).max(100).required(),
  password: Joi.string().min(8).max(100).required(),
});
