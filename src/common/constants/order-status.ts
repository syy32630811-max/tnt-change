/*
 * @Description: 订单状态
 */
export enum OrderStatus {
  /** 已提交 */
  Submitted = 'submitted',
  /** 已支付 */
  Paid = 'paid',
  /** 定制中 */
  Customizing = 'customizing',
  /** 已发货 */
  Shipped = 'shipped',
  /** 已取消 */
  Cancelled = 'cancelled',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.Submitted]: '已提交',
  [OrderStatus.Paid]: '已支付',
  [OrderStatus.Customizing]: '定制中',
  [OrderStatus.Shipped]: '已发货',
  [OrderStatus.Cancelled]: '已取消',
};

export const SUPPORTED_ORDER_STATUSES = Object.values(OrderStatus);
