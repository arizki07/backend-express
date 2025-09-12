import {
  createUserSchema,
  updateUserSchema,
  updatePasswordSchema,
} from '../../src/validators/user.validator';

describe('User Schema Validations', () => {
  // Test suite for createUserSchema
  describe('createUserSchema', () => {
    it('should validate successfully with valid data', () => {
      const validData = {
        name: 'Jane Doe',
        username: 'janedoe',
        password: 'securepassword123',
        confirm_password: 'securepassword123',
        role: 'user',
      };
      const result = createUserSchema.validate(validData);
      expect(result.error).toBeUndefined();
    });

    it('should fail if password and confirm_password do not match', () => {
      const invalidData = {
        name: 'Jane Doe',
        username: 'janedoe',
        password: 'securepassword123',
        confirm_password: 'differentpassword',
        role: 'user',
      };
      const result = createUserSchema.validate(invalidData);
      expect(result.error).toBeDefined();
      // Perbaikan di sini: Tambahkan tanda kutip ganda
      expect(result.error?.details[0].message).toContain(
        '"confirm_password" must be [ref:password]',
      );
    });

    it('should fail if role is not "admin" or "user"', () => {
      const invalidData = {
        name: 'Jane Doe',
        username: 'janedoe',
        password: 'securepassword123',
        confirm_password: 'securepassword123',
        role: 'editor',
      };
      const result = createUserSchema.validate(invalidData);
      expect(result.error).toBeDefined();
      // Perbaikan di sini: Tambahkan tanda kutip ganda
      expect(result.error?.details[0].message).toContain('"role" must be one of [admin, user]');
    });
  });

  // Test suite for updateUserSchema
  describe('updateUserSchema', () => {
    it('should validate successfully with a valid update', () => {
      const validData = {
        name: 'Updated Name',
        role: 'admin',
      };
      const result = updateUserSchema.validate(validData);
      expect(result.error).toBeUndefined();
    });

    it('should validate successfully with only one field', () => {
      const validData = {
        username: 'newusername',
      };
      const result = updateUserSchema.validate(validData);
      expect(result.error).toBeUndefined();
    });

    it('should fail with an invalid role', () => {
      const invalidData = {
        role: 'invalid_role',
      };
      const result = updateUserSchema.validate(invalidData);
      expect(result.error).toBeDefined();
      // Perbaikan di sini: Tambahkan tanda kutip ganda
      expect(result.error?.details[0].message).toContain('"role" must be one of [admin, user]');
    });
  });

  // Test suite for updatePasswordSchema
  describe('updatePasswordSchema', () => {
    it('should validate successfully with valid data', () => {
      const validData = {
        password: 'new_strong_password',
        confirm_password: 'new_strong_password',
      };
      const result = updatePasswordSchema.validate(validData);
      expect(result.error).toBeUndefined();
    });

    it('should fail if passwords do not match', () => {
      const invalidData = {
        password: 'new_password',
        confirm_password: 'wrong_password',
      };
      const result = updatePasswordSchema.validate(invalidData);
      expect(result.error).toBeDefined();
      // Perbaikan di sini: Tambahkan tanda kutip ganda
      expect(result.error?.details[0].message).toContain(
        '"confirm_password" must be [ref:password]',
      );
    });

    it('should fail if password is too short', () => {
      const invalidData = {
        password: 'short',
        confirm_password: 'short',
      };
      const result = updatePasswordSchema.validate(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain(
        '"password" length must be at least 8 characters long',
      );
    });
  });
});
