/**
 * Mirrors src/lib/siteRisk.ts from the browser extension (root of this repo)
 * — same algorithm, duplicated here because game/ is an independent
 * npm project with no shared build/package between the two. Used by the
 * Security Beacon zone to run the *real* heuristic live, not a fake
 * animation of it.
 */

export interface SiteRiskResult {
  risky: boolean
  reasons: string[]
}

const IPV4_HOST = /^\d{1,3}(\.\d{1,3}){3}$/
const BRAND_KEYWORDS = ['paypal', 'apple', 'microsoft', 'google', 'amazon', 'netflix', 'bank', 'irs', 'chase', 'wellsfargo']

export function assessSiteRisk(url: string): SiteRiskResult {
  const reasons: string[] = []
  let host: URL
  try {
    host = new URL(url)
  } catch {
    return { risky: false, reasons: [] }
  }

  const hostname = host.hostname.toLowerCase()

  if (host.protocol !== 'https:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    reasons.push('Page is not served over HTTPS')
  }
  if (IPV4_HOST.test(hostname)) {
    reasons.push('Site is a raw IP address rather than a domain name')
  }
  if (hostname.includes('xn--')) {
    reasons.push('Domain uses punycode — possible look-alike character trick')
  }
  const labelCount = hostname.split('.').length
  if (labelCount >= 5) {
    reasons.push('Domain has an unusually large number of subdomains')
  }
  const registrableDomain = hostname.split('.').slice(-2).join('.')
  for (const brand of BRAND_KEYWORDS) {
    if (hostname.includes(brand) && !registrableDomain.startsWith(`${brand}.`)) {
      reasons.push(`Contains "${brand}" but isn't that brand's own domain`)
      break
    }
  }

  return { risky: reasons.length > 0, reasons }
}
