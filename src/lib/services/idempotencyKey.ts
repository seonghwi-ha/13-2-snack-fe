import { ApiError } from './fetchClient';

/*
@ 멱등성 키 (Idempotency-Key 헤더)
- 서버는 같은 키로 다시 온 요청에 처음 성공 응답을 그대로 돌려준다.
  응답을 못 받고 다시 보내도 주문이 두 번 생기지 않는다.
- 같은 내용을 다시 보낼 때는 같은 키를, 내용이 바뀌면 새 키를 쓴다.
*/

const IDEMPOTENCY_IN_PROGRESS = 'IDEMPOTENCY_IN_PROGRESS';

export function createIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // randomUUID는 https·localhost에서만 쓸 수 있어 그 밖에서는 직접 만든다.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

export function isIdempotencyInProgressError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    error.code === IDEMPOTENCY_IN_PROGRESS
  );
}

// 같은 키로 다시 보내도 안전하고, 다시 보내면 결과가 달라질 수 있는 실패만 재시도한다.
export function isRetryableOrderError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    // 응답을 받지 못한 네트워크 오류
    return error instanceof TypeError;
  }

  return isIdempotencyInProgressError(error) || error.status >= 500;
}
