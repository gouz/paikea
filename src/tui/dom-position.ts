import type { DOMElement } from "ink";

// Absolute top/left (0-based screen cells) of an Ink node, by summing each
// ancestor's yoga-computed offset up to the root. Used to translate terminal
// mouse coordinates into a position inside the response content box.
export function absolutePosition(node: DOMElement): {
  top: number;
  left: number;
} {
  let top = 0;
  let left = 0;
  let cur: DOMElement | undefined = node;
  while (cur) {
    const yoga = cur.yogaNode;
    if (yoga) {
      top += yoga.getComputedTop();
      left += yoga.getComputedLeft();
    }
    cur = cur.parentNode;
  }
  return { top, left };
}
