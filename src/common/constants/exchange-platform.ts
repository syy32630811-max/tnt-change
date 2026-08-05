/*
 * @Description: 互换平台
 */
export enum ExchangePlatform {
  SweetPotato = '🍠',
  Bean = '🫘',
}

export const EXCHANGE_PLATFORM_LABELS: Record<ExchangePlatform, string> = {
  [ExchangePlatform.SweetPotato]: '🍠',
  [ExchangePlatform.Bean]: '🫘',
};

export const SUPPORTED_EXCHANGE_PLATFORMS = Object.values(ExchangePlatform);
