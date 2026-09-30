import { Device } from '@capacitor/device'

/** Real device info via Capacitor's Device plugin — works both in the
 * wrapped native app and in a plain browser (Capacitor ships a web
 * implementation backed by navigator.userAgent), so "Register this device"
 * genuinely reflects whatever it's actually running on either way. */
export async function getThisDeviceInfo() {
  const info = await Device.getInfo()
  const name = info.platform === 'web' ? `${info.operatingSystem} browser` : `${info.manufacturer ?? ''} ${info.model ?? ''}`.trim()
  return {
    name: name || 'This device',
    type: info.platform, // 'android' | 'ios' | 'web'
    platform: info.operatingSystem,
    os_version: info.osVersion ?? '',
  }
}
