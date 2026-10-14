import type { ProductListResponse } from '@/lib/services/productService';

/*
@ 상품 목록 다음 묶음 계산
- 백엔드가 커서를 주면(nextCursor) 커서로 이어서 받는다.
  커서는 "마지막으로 본 상품 다음부터" 읽어서, 스크롤 중 상품이 추가돼도 이미 본 상품이 다시 나오지 않는다.
- 커서를 주지 않는 서버(이전 버전 API)에서는 기존처럼 page를 1씩 올린다.
- 첫 묶음은 항상 page=1로 받는다. 서버(page.tsx)가 미리 받는 첫 페이지와 맞추기 위해서다.
- 서버·브라우저·테스트에서 함께 쓰므로 런타임 import 없이 순수 함수로 둔다.
*/

export type ProductListPageParam = { page: number } | { cursor: string };

export const FIRST_PRODUCT_PAGE_PARAM: ProductListPageParam = { page: 1 };

export function getNextProductPageParam(
  lastPage: ProductListResponse,
): ProductListPageParam | undefined {
  if (!lastPage.hasNext) {
    return undefined;
  }

  if (lastPage.nextCursor) {
    return { cursor: lastPage.nextCursor };
  }

  return lastPage.page === undefined ? undefined : { page: lastPage.page + 1 };
}

// 앞뒤 공백만 있는 검색어는 검색하지 않은 것으로 본다.
export function normalizeProductKeyword(
  keyword: string | null | undefined,
): string {
  return keyword?.trim() ?? '';
}
