import { User } from '../models/user.model';
import { hashPassword } from '../utils/hash';
import { createAudit } from './audit.service';

export const createUserService = async (data: any, actorId: number) => {
  const password_hash = await hashPassword(data.password);
  const user = await User.create({
    ...data,
    password_hash,
    created_by: actorId,
    updated_by: actorId,
  });
  await createAudit(actorId, 'User', user.id, 'CREATE', null, user);
  return user;
};

// Tambah service lain: getUsers, getUserById, updateUser, deleteUser, updatePassword
