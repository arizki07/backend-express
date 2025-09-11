import Joi from "joi";

export const createUserSchema = Joi.object({
  name: Joi.string().min(4).max(100).required(),
  username: Joi.string().min(4).max(100).required(),
  password: Joi.string().min(8).max(100).required(),
  confirm_password: Joi.any().valid(Joi.ref("password")).required(),
  role: Joi.string().valid("admin", "user").required(),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(4).max(100),
  username: Joi.string().min(4).max(100),
  role: Joi.string().valid("admin", "user"),
});

export const updatePasswordSchema = Joi.object({
  password: Joi.string().min(8).max(100).required(),
  confirm_password: Joi.any().valid(Joi.ref("password")).required(),
});
