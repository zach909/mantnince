/**
 * Small hand-authored icon set (our own geometry, not a copy of any icon
 * library's path data) in a shared stroke style: 24x24 viewBox, currentColor
 * stroke, no fill, rounded caps/joins — matches the look the popup used to
 * get from lucide-react.
 */
import { svgEl } from './dom'

export interface IconOptions {
  size?: number
  className?: string
}

function icon(className: string | undefined, size: number, children: SVGElement[]): SVGElement {
  return svgEl(
    'svg',
    {
      viewBox: '0 0 24 24',
      width: String(size),
      height: String(size),
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: className || '',
    },
    ...children,
  )
}

const path = (d: string) => svgEl('path', { d })
const line = (x1: number, y1: number, x2: number, y2: number) =>
  svgEl('line', { x1: String(x1), y1: String(y1), x2: String(x2), y2: String(y2) })
const circle = (cx: number, cy: number, r: number) =>
  svgEl('circle', { cx: String(cx), cy: String(cy), r: String(r) })
const rect = (x: number, y: number, w: number, h: number, rx = 2) =>
  svgEl('rect', { x: String(x), y: String(y), width: String(w), height: String(h), rx: String(rx) })
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  svgEl('ellipse', { cx: String(cx), cy: String(cy), rx: String(rx), ry: String(ry) })

export function hardDriveIcon({ size = 16, className }: IconOptions = {}) {
  return icon(className, size, [rect(3, 7, 18, 10, 3), line(3, 13, 21, 13), circle(7, 16.5, 0.6), circle(11, 16.5, 0.6)])
}

export function databaseIcon({ size = 16, className }: IconOptions = {}) {
  return icon(className, size, [
    ellipse(12, 5, 8, 3),
    path('M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5'),
    path('M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3'),
  ])
}

export function shieldIcon({ size = 16, className }: IconOptions = {}) {
  return icon(className, size, [path('M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5z')])
}

export function downloadIcon({ size = 16, className }: IconOptions = {}) {
  return icon(className, size, [path('M12 3v12'), path('M7 10l5 5 5-5'), path('M4 19h16')])
}

export function refreshCwIcon({ size = 16, className }: IconOptions = {}) {
  return icon(className, size, [
    path('M4 12a8 8 0 0 1 14.3-4.9M20 12a8 8 0 0 1-14.3 4.9'),
    path('M18.3 3v4.5h-4.5'),
    path('M5.7 21v-4.5h4.5'),
  ])
}

export function fileTextIcon({ size = 16, className }: IconOptions = {}) {
  return icon(className, size, [
    path('M6 2h9l5 5v15H6z'),
    path('M15 2v5h5'),
    line(8.5, 13, 15.5, 13),
    line(8.5, 17, 15.5, 17),
  ])
}

export function activityIcon({ size = 16, className }: IconOptions = {}) {
  return icon(className, size, [path('M3 12h4l2.5-7L13 19l2.5-7H21')])
}

export function gamepad2Icon({ size = 16, className }: IconOptions = {}) {
  return icon(className, size, [
    path('M7 9v4M5 11h4'),
    circle(15.5, 9.5, 0.6),
    circle(17.5, 11.5, 0.6),
    path('M6 6h12a5 5 0 0 1 5 5v3a4 4 0 0 1-7 2.6L14.5 15h-5L8 16.6A4 4 0 0 1 1 14v-3a5 5 0 0 1 5-5z'),
  ])
}

export function alertTriangleIcon({ size = 16, className }: IconOptions = {}) {
  return icon(className, size, [
    path('M12 3 2 20h20z'),
    line(12, 10, 12, 14.5),
    circle(12, 17, 0.6),
  ])
}

export function rotateCcwIcon({ size = 16, className }: IconOptions = {}) {
  return icon(className, size, [path('M4 4v5h5'), path('M4.6 15A8 8 0 1 0 6 6.3L4 9')])
}
