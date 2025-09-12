// tests/utils/hash.test.ts
import { hashPassword, comparePassword } from '../../src/utils/hash';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('Hash Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should hash a password successfully', async () => {
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('mocked_salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('mocked_hashed_password');

    const hashedPassword = await hashPassword('testpassword');

    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('testpassword', 'mocked_salt');
    expect(hashedPassword).toBe('mocked_hashed_password');
  });

  it('should compare a password with a hash successfully', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const isMatch = await comparePassword('testpassword', 'mocked_hash');

    expect(bcrypt.compare).toHaveBeenCalledWith('testpassword', 'mocked_hash');
    expect(isMatch).toBe(true);
  });

  it('should return false for incorrect password comparison', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const isMatch = await comparePassword('wrongpassword', 'mocked_hash');

    expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'mocked_hash');
    expect(isMatch).toBe(false);
  });
});
