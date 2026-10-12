import type { ProductListResponse } from '@/lib/services/productService';

import {
  getNextProductPageParam,
  normalizeProductKeyword,
} from './productListPaging';

function response(
  overrides: Partial<ProductListResponse>,
): ProductListResponse {
  return {
    products: [],
    limit: 12,
    totalCount: 30,
    hasNext: true,
    ...overrides,
  };
}

describe('getNextProductPageParam', () => {
  it('서버가 커서를 주면 커서로 이어서 받는다', () => {
    const lastPage = response({ page: 1, nextCursor: 'abc' });

    expect(getNextProductPageParam(lastPage)).toEqual({ cursor: 'abc' });
  });

  it('커서 방식 응답(page 없음)도 커서로 이어서 받는다', () => {
    const lastPage = response({ nextCursor: 'def' });

    expect(getNextProductPageParam(lastPage)).toEqual({ cursor: 'def' });
  });

  it('커서를 주지 않는 서버에서는 다음 page로 받는다', () => {
    const lastPage = response({ page: 2 });

    expect(getNextProductPageParam(lastPage)).toEqual({ page: 3 });
  });

  it('다음 묶음이 없으면 멈춘다', () => {
    const lastPage = response({ page: 3, hasNext: false, nextCursor: null });

    expect(getNextProductPageParam(lastPage)).toBeUndefined();
  });

  it('다음 묶음이 있다는데 커서도 page도 없으면 멈춘다', () => {
    const lastPage = response({ nextCursor: null });

    expect(getNextProductPageParam(lastPage)).toBeUndefined();
  });
});

describe('normalizeProductKeyword', () => {
  it('앞뒤 공백을 지운다', () => {
    expect(normalizeProductKeyword('  새우깡 ')).toBe('새우깡');
  });

  it.each([null, undefined, '', '   '])(
    '비어 있으면(%p) 빈 문자열이다',
    (keyword) => {
      expect(normalizeProductKeyword(keyword)).toBe('');
    },
  );
});
