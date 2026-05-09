import { logger } from '@/lib/logger';

describe('Logger', () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs info messages as JSON', () => {
    logger.info('test message', { user_id: '123' });
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('test message');
    expect(parsed.user_id).toBe('123');
    expect(parsed.timestamp).toBeDefined();
  });

  it('logs errors via console.error', () => {
    logger.error('error happened', { code: 500 });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('logs warnings via console.warn', () => {
    logger.warn('something fishy');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('redacts sensitive keys', () => {
    logger.info('login', { password: 'secret123', api_key: 'abc' });
    const output = logSpy.mock.calls[0]?.[0] as string;
    expect(output).not.toContain('secret123');
    expect(output).not.toContain('abc');
    expect(output).toContain('[REDACTED]');
  });

  it('truncates very long strings', () => {
    const longText = 'A'.repeat(1000);
    logger.info('long', { data: longText });
    const output = logSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain('...');
    expect(output.length).toBeLessThan(longText.length);
  });
});
