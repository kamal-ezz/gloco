import { withTimeout } from '../withTimeout';

describe('withTimeout', () => {
  it('resolves when promise settles before timeout', async () => {
    const result = await withTimeout(
      Promise.resolve('hello'),
      1000,
      'timed out'
    );
    expect(result).toBe('hello');
  });

  it('rejects when promise times out', async () => {
    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve('late'), 5000);
    });

    await expect(
      withTimeout(slow, 50, 'Operation timed out')
    ).rejects.toThrow('Operation timed out');
  });

  it('rejects with original error if promise rejects before timeout', async () => {
    const failing = Promise.reject(new Error('original error'));

    await expect(
      withTimeout(failing, 1000, 'timed out')
    ).rejects.toThrow('original error');
  });
});
