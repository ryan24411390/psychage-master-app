// Bounded Tailwind-class → style-flag resolver. The web body carries its visual
// intent in utility classes; we honour the layout/emphasis subset that actually
// appears on block wrappers (alignment, italic, weight) and let the calm app
// palette own colour (callout tone is derived separately in classify.ts). This
// keeps the reader on-brand (no new design language) while respecting the source.

export type TextStyleFlags = {
  align?: 'left' | 'center' | 'right';
  italic?: boolean;
  bold?: boolean;
};

export function resolveTextStyle(classes: readonly string[]): TextStyleFlags {
  const flags: TextStyleFlags = {};
  for (const c of classes) {
    if (c === 'text-center') flags.align = 'center';
    else if (c === 'text-right') flags.align = 'right';
    else if (c === 'text-left') flags.align = 'left';
    else if (c === 'italic') flags.italic = true;
    else if (c === 'font-bold' || c === 'font-semibold' || c === 'font-extrabold') flags.bold = true;
  }
  return flags;
}

/** A paragraph styled as an intro lead (web marks it `class="lead"`). */
export function isLeadParagraph(classes: readonly string[]): boolean {
  return classes.includes('lead');
}
