import { loginSchema } from '../../src/validators/auth.validator';

describe('Login Schema Validation', () => {
  // Test case for a successful login
  it('should validate successfully with a valid username and password', () => {
    const validLoginData = {
      username: 'johndoe',
      password: 'strongpassword123',
    };
    const result = loginSchema.validate(validLoginData);
    expect(result.error).toBeUndefined();
  });

  // Test case for an invalid username (too short)
  it('should return an error if username is less than 4 characters', () => {
    const invalidData = {
      username: 'abc',
      password: 'password123',
    };
    const result = loginSchema.validate(invalidData);
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toContain(
      '"username" length must be at least 4 characters long',
    );
  });

  // Test case for an invalid password (too short)
  it('should return an error if password is less than 8 characters', () => {
    const invalidData = {
      username: 'johndoe',
      password: 'short',
    };
    const result = loginSchema.validate(invalidData);
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toContain(
      '"password" length must be at least 8 characters long',
    );
  });

  // Test case for a missing username
  it('should return an error if username is missing', () => {
    const invalidData = {
      password: 'password123',
    };
    const result = loginSchema.validate(invalidData);
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toContain('"username" is required');
  });

  // Test case for a missing password
  it('should return an error if password is missing', () => {
    const invalidData = {
      username: 'johndoe',
    };
    const result = loginSchema.validate(invalidData);
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toContain('"password" is required');
  });
});
