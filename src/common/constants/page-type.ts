/*
 * @Description: 网页类型枚举
 */
export enum PageType {
  /** 管理页面 */
  Admin = 'admin',
  /** 物料互换 */
  Exchange = 'exchange',
  /** 物料定制 */
  Custom = 'custom',
}

export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  [PageType.Admin]: '管理页面',
  [PageType.Exchange]: '物料互换',
  [PageType.Custom]: '物料定制',
};

export const SUPPORTED_PAGE_TYPES = Object.values(PageType);
