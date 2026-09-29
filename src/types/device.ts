export type DevicePlatform = 'ios' | 'android' | 'web';

export interface DeviceToken {
  userId: string;
  token: string;
  platform: DevicePlatform;
  updatedAt: Date;
}
