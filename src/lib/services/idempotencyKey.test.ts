import { ApiError } from './fetchClient';
import {
  createIdempotencyKey,
  isIdempotencyInProgressError,
  isRetryableOrderError,
} from './idempotencyKey';

// 서버가 받는 키 형식
const SERVER_KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

describe('createIdempotencyKey', () => {
  test('서버가 받는 형식의 키를 매번 새로 만든다', () => {
    const first = createIdempotencyKey();
    const second = createIdempotencyKey();

    expect(first).toMatch(SERVER_KEY_PATTERN);
    expect(second).toMatch(SERVER_KEY_PATTERN);
    expect(first).not.toBe(second);
  });

  test('randomUUID를 쓸 수 없는 환경에서도 키를 만든다', () => {
    const descriptor = Object.getOwnPropertyDescriptor(crypto, 'randomUUID');
    Object.defineProperty(crypto, 'randomUUID', {
      value: undefined,
      configurable: true,
    });

    try {
      const key = createIdempotencyKey();

      expect(key).toMatch(SERVER_KEY_PATTERN);
      expect(key).toHaveLength(32);
    } finally {
      if (descriptor) {
        Object.defineProperty(crypto, 'randomUUID', descriptor);
      }
    }
  });
});

describe('isRetryableOrderError', () => {
  test.each([
    ['응답을 받지 못한 네트워크 오류', new TypeError('Failed to fetch')],
    [
      '처음 요청이 아직 처리 중(409)',
      new ApiError('처리 중', 409, 'IDEMPOTENCY_IN_PROGRESS'),
    ],
    ['서버 오류(500)', new ApiError('서버 오류', 500)],
    ['게이트웨이 오류(502)', new ApiError('게이트웨이 오류', 502)],
  ])('%s는 같은 키로 다시 보낸다', (_, error) => {
    expect(isRetryableOrderError(error)).toBe(true);
  });

  test.each([
    ['잘못된 요청(400)', new ApiError('잘못된 요청', 400, 'VALIDATION_ERROR')],
    ['예산 초과(409)', new ApiError('예산 초과', 409, 'BUDGET_EXCEEDED')],
    [
      '다른 내용에 쓴 키(422)',
      new ApiError('키 재사용', 422, 'IDEMPOTENCY_KEY_REUSED'),
    ],
    ['인증 만료(401)', new ApiError('만료', 401, 'TOKEN_EXPIRED')],
    ['알 수 없는 오류', new Error('unknown')],
  ])('%s는 다시 보내지 않는다', (_, error) => {
    expect(isRetryableOrderError(error)).toBe(false);
  });
});

describe('isIdempotencyInProgressError', () => {
  test('처리 중 코드가 붙은 409만 처리 중으로 본다', () => {
    expect(
      isIdempotencyInProgressError(
        new ApiError('처리 중', 409, 'IDEMPOTENCY_IN_PROGRESS'),
      ),
    ).toBe(true);
    expect(
      isIdempotencyInProgressError(
        new ApiError('예산 초과', 409, 'BUDGET_EXCEEDED'),
      ),
    ).toBe(false);
  });
});
