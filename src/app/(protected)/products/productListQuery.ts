import {
  type ProductListParams,
  type ProductSort,
  isProductSort,
} from '@/lib/services/productService';

import { DEFAULT_CATEGORY_ID, findCategory } from './productCategories';
import { normalizeProductKeyword } from './productListPaging';

/*
@ 상품 목록 조회 조건
- 서버(page.tsx)가 첫 페이지를 미리 받을 때와 화면(ProductListView)이 받을 때
  쿼리 키가 한 글자라도 다르면 미리 받은 데이터를 쓰지 못하고 다시 요청한다.
  그래서 URL → 조회 조건 변환을 이 파일 한 곳에서만 한다.
- 서버·브라우저 양쪽에서 불리므로 'use client'나 next/headers를 두지 않는다.
*/

export const PRODUCT_LIST_PAGE_SIZE = 12;

type ProductListFilter = Pick<
  ProductListParams,
  'categoryId' | 'parentCategoryId' | 'keyword'
>;

export function resolveProductListQuery(
  categoryIdParam: string | null | undefined,
  sortParam: string | null | undefined,
  keywordParam?: string | null,
) {
  const normalizedSort = sortParam ?? null;
  const sort: ProductSort = isProductSort(normalizedSort)
    ? normalizedSort
    : 'latest';
  const selected =
    findCategory(Number(categoryIdParam)) ?? findCategory(DEFAULT_CATEGORY_ID);

  const keyword = normalizeProductKeyword(keywordParam);

  // 검색어가 있으면 카테고리와 상관없이 전체 상품에서 찾는다.
  // 서버의 오타 추천(suggestions)도 전체 상품 기준이라, 카테고리를 걸면 추천을 눌러도 0건일 수 있다.
  // 검색어가 없으면 소분류를 고르면 그 소분류만, 대분류만 고르면 그 아래 전체를 불러온다.
  const filter: ProductListFilter = keyword
    ? { keyword }
    : selected?.child
      ? { categoryId: selected.child.id }
      : { parentCategoryId: selected?.parent.id };

  return { sort, selected, filter, keyword };
}

export function productListQueryKey(
  filter: ProductListFilter,
  sort: ProductSort,
) {
  return ['products', { ...filter, sort }] as const;
}
