import { ChevronDown } from 'lucide-react-native';
import { type ReactNode, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import {
  type NElement,
  type NNode,
  descendantElements,
  isElement,
  isText,
  textOf,
} from '@/features/content/html/ast';
import {
  calloutTone,
  classifyBlock,
  extractAccordion,
  extractTabs,
  isCitation,
} from '@/features/content/html/classify';
import { parseArticleHtml } from '@/features/content/html/parse';
import { isLeadParagraph, resolveTextStyle } from '@/features/content/html/tailwind';
import { CALLOUT_PALETTE, svgAspect, svgFixedSize } from '@/features/content/blocks/theme';
import { colors } from '@/lib/colors';

// Native article-body renderer. Parses the web's verbatim HTML → NNode tree →
// native components (the 13 PEAF blocks + inline elements). The clinician-reviewed
// PROSE is never altered — only re-styled. Unknown wrappers degrade to a generic
// pass-through so no prose is ever dropped. SVG (icons, charts, diagrams) renders
// verbatim via react-native-svg.

const LINK_COLOR = colors.teal[600];

// ---------------------------------------------------------------------------
// Inline rendering — lives inside a <Text>, so it may only emit strings and
// nested <Text>. Non-text inline atoms (decorative svg) are dropped here; the
// prose is unaffected.
// ---------------------------------------------------------------------------

function renderInline(nodes: readonly NNode[]): ReactNode {
  return nodes.map((node, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: inline atoms are positional, parsed once, never reordered
    <InlineAtom key={i} node={node} />
  ));
}

function InlineAtom({ node }: { node: NNode }): ReactNode {
  if (isText(node)) return node.text;
  if (isCitation(node)) {
    const label = textOf(node).trim();
    return (
      <Text
        accessibilityLabel={`citation ${label}`}
        style={{ fontSize: 10, lineHeight: 14, color: LINK_COLOR }}
      >
        {` ${label}`}
      </Text>
    );
  }
  switch (node.tag) {
    case 'br':
      return '\n';
    case 'strong':
    case 'b':
      return <Text className="font-sans-bold">{renderInline(node.children)}</Text>;
    case 'em':
    case 'i':
      return <Text style={{ fontStyle: 'italic' }}>{renderInline(node.children)}</Text>;
    case 'a': {
      const href = node.attrs.href;
      return (
        <Text
          className="text-primary underline dark:text-primary-dark"
          onPress={href ? () => void Linking.openURL(href).catch(() => {}) : undefined}
        >
          {renderInline(node.children)}
        </Text>
      );
    }
    case 'svg':
      return null; // decorative inline icon — prose carries the meaning
    default:
      // span / sup / sub / code / mark / small / u and any other wrapper
      return <Text>{renderInline(node.children)}</Text>;
  }
}

// ---------------------------------------------------------------------------
// Block rendering
// ---------------------------------------------------------------------------

function RenderBlocks({ nodes }: { nodes: readonly NNode[] }) {
  const blocks: ReactNode[] = [];
  nodes.forEach((node, i) => {
    if (isText(node)) {
      if (node.text.trim().length === 0) return; // whitespace between blocks
      blocks.push(
        // biome-ignore lint/suspicious/noArrayIndexKey: blocks are positional, parsed once, never reordered
        <Text key={i} variant="body" className="leading-7">
          {node.text}
        </Text>,
      );
      return;
    }
    // biome-ignore lint/suspicious/noArrayIndexKey: blocks are positional, parsed once, never reordered
    blocks.push(<Block key={i} node={node} />);
  });
  return <>{blocks}</>;
}

function Block({ node }: { node: NElement }): ReactNode {
  switch (classifyBlock(node)) {
    case 'paragraph':
      return <Paragraph node={node} />;
    case 'heading2':
      return <Heading node={node} variant="headingLg" />;
    case 'heading3':
      return <Heading node={node} variant="heading" />;
    case 'heading4':
      return <Heading node={node} variant="bodyBold" />;
    case 'list-unordered':
      return <ListBlock node={node} ordered={false} />;
    case 'list-ordered':
      return <ListBlock node={node} ordered />;
    case 'quote':
      return <QuoteBlock node={node} />;
    case 'table':
      return <TableBlock node={node} />;
    case 'figure':
      return <FigureBlock node={node} />;
    case 'image':
      return <ImageBlock src={node.attrs.src} alt={node.attrs.alt} node={node} />;
    case 'svg':
      return node.svg ? <SvgBlock xml={node.svg} /> : null;
    case 'callout':
      return <CalloutBlock node={node} />;
    case 'card':
      return <CardBlock node={node} />;
    case 'accordion':
      return <AccordionBlock node={node} />;
    case 'tabs':
      return <TabsBlock node={node} />;
    case 'generic':
      return <RenderBlocks nodes={node.children} />;
    default:
      return null;
  }
}

function Paragraph({ node }: { node: NElement }) {
  const lead = isLeadParagraph(node.classes);
  const { align } = resolveTextStyle(node.classes);
  return (
    <Text
      variant={lead ? 'bodyMedium' : 'body'}
      className="leading-7"
      style={align ? { textAlign: align } : undefined}
    >
      {renderInline(node.children)}
    </Text>
  );
}

function Heading({
  node,
  variant,
}: {
  node: NElement;
  variant: 'headingLg' | 'heading' | 'bodyBold';
}) {
  const { align } = resolveTextStyle(node.classes);
  return (
    <Text variant={variant} className="mt-2" style={align ? { textAlign: align } : undefined}>
      {renderInline(node.children)}
    </Text>
  );
}

function ListBlock({ node, ordered }: { node: NElement; ordered: boolean }) {
  const items = node.children.filter((c): c is NElement => isElement(c) && c.tag === 'li');
  return (
    <View className="gap-1.5">
      {items.map((li, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: list items are positional, parsed once, never reordered
        <View key={i} className="flex-row gap-2 pr-1">
          <Text variant="body" className="leading-7 text-text-secondary dark:text-text-secondary-dark">
            {ordered ? `${i + 1}.` : '•'}
          </Text>
          <Text variant="body" className="flex-1 leading-7">
            {renderInline(li.children)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function QuoteBlock({ node }: { node: NElement }) {
  return (
    <View
      className="my-1 rounded-lg bg-surface px-4 py-3 dark:bg-surface-dark"
      style={{ borderLeftWidth: 4, borderLeftColor: colors.teal[500] }}
    >
      <Text variant="body" className="leading-7" style={{ fontStyle: 'italic' }}>
        {renderInline(node.children)}
      </Text>
    </View>
  );
}

function rowsFromTable(node: NElement): { header: string[]; body: string[][] } {
  const trs = descendantElements(node).filter((e) => e.tag === 'tr');
  const rows = trs.map((tr) =>
    descendantElements(tr)
      .filter((e) => e.tag === 'th' || e.tag === 'td')
      .map((cell) => textOf(cell).trim()),
  );
  const headFromThead = descendantElements(node).some((e) => e.tag === 'thead');
  if (headFromThead && rows.length > 0) return { header: rows[0] ?? [], body: rows.slice(1) };
  // No <thead>: treat the first row as a header if it is all <th>.
  const firstTr = trs[0];
  const firstCells = firstTr
    ? descendantElements(firstTr).filter((e) => e.tag === 'th' || e.tag === 'td')
    : [];
  const firstAllTh = firstCells.length > 0 && firstCells.every((e) => e.tag === 'th');
  if (firstAllTh && rows.length > 0) return { header: rows[0] ?? [], body: rows.slice(1) };
  return { header: [], body: rows };
}

function TableBlock({ node }: { node: NElement }) {
  const { header, body } = rowsFromTable(node);
  const colCount = Math.max(header.length, ...body.map((r) => r.length), 1);
  const cellWidth = 140;
  const Cell = ({ text, head }: { text: string; head?: boolean }) => (
    <View
      style={{ width: cellWidth }}
      className="border-b border-border px-3 py-2 dark:border-border-dark"
    >
      <Text variant={head ? 'bodyMedium' : 'bodySm'} className="leading-6">
        {text}
      </Text>
    </View>
  );
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-1">
      <View className="rounded-lg border border-border dark:border-border-dark">
        {header.length > 0 ? (
          <View className="flex-row bg-surface-active dark:bg-surface-active-dark">
            {Array.from({ length: colCount }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: table columns are positional, fixed count, never reordered
              <Cell key={i} text={header[i] ?? ''} head />
            ))}
          </View>
        ) : null}
        {body.map((row, r) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: table rows are positional, parsed once, never reordered
          <View key={r} className="flex-row">
            {Array.from({ length: colCount }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: table columns are positional, fixed count, never reordered
              <Cell key={i} text={row[i] ?? ''} />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function useContentWidth() {
  const { width } = useWindowDimensions();
  return Math.max(0, width - 40); // reader uses px-5 (20 each side)
}

function ImageBlock({
  src,
  alt,
  node,
  caption,
}: {
  src?: string;
  alt?: string;
  node?: NElement;
  caption?: string;
}) {
  const [failed, setFailed] = useState(false);
  const width = useContentWidth();
  if (!src) return null; // no illustration at all → render nothing (never invented)
  const w = node ? Number(node.attrs.width) : Number.NaN;
  const h = node ? Number(node.attrs.height) : Number.NaN;
  const aspect = w > 0 && h > 0 ? w / h : 1.6;
  // Broken source (had a URL, failed to load) → a neutral token-tinted box at the
  // image's own aspect, so the prose rhythm is preserved instead of collapsing.
  if (failed) {
    return (
      <View
        className="my-1 rounded-xl bg-surface-active dark:bg-surface-active-dark"
        style={{ width, height: width / aspect }}
      />
    );
  }
  return (
    <View className="my-1 gap-1">
      <Image
        source={{ uri: src }}
        accessibilityLabel={alt || undefined}
        onError={() => setFailed(true)}
        resizeMode="contain"
        style={{ width, height: width / aspect, borderRadius: 12 }}
      />
      {caption ? (
        <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

function FigureBlock({ node }: { node: NElement }) {
  const img = descendantElements(node).find((e) => e.tag === 'img');
  const fig = descendantElements(node).find((e) => e.tag === 'figcaption');
  const svg = descendantElements(node).find((e) => e.tag === 'svg');
  if (!img && svg?.svg) return <SvgBlock xml={svg.svg} caption={fig ? textOf(fig).trim() : undefined} />;
  return (
    <ImageBlock
      src={img?.attrs.src}
      alt={img?.attrs.alt}
      node={img}
      caption={fig ? textOf(fig).trim() : undefined}
    />
  );
}

function SvgBlock({ xml, caption }: { xml: string; caption?: string }) {
  const contentWidth = useContentWidth();
  const fixed = svgFixedSize(xml);
  const aspect = svgAspect(xml) ?? 1;
  const width = fixed ? fixed.width : contentWidth;
  const height = fixed ? fixed.height : contentWidth / aspect;
  return (
    <View className={fixed ? '' : 'my-1 gap-1'}>
      <SvgXml xml={xml} width={width} height={height} />
      {caption ? (
        <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

function CalloutBlock({ node }: { node: NElement }) {
  const scheme = useColorScheme();
  const tone = calloutTone(node.classes);
  const palette = CALLOUT_PALETTE[tone][scheme === 'dark' ? 'dark' : 'light'];
  return (
    <View
      className="my-1 gap-2 rounded-xl p-4"
      style={{ backgroundColor: palette.bg, borderLeftWidth: 4, borderLeftColor: palette.border }}
    >
      <RenderBlocks nodes={node.children} />
    </View>
  );
}

function CardBlock({ node }: { node: NElement }) {
  return (
    <View className="my-1 gap-2 rounded-xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
      <RenderBlocks nodes={node.children} />
    </View>
  );
}

function AccordionBlock({ node }: { node: NElement }) {
  const items = useMemo(() => extractAccordion(node), [node]);
  const [open, setOpen] = useState<number | null>(null);
  if (items.length === 0) return <RenderBlocks nodes={node.children} />;
  return (
    <View className="my-1 gap-2">
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: accordion items are positional, parsed once, never reordered
            key={i}
            className="overflow-hidden rounded-lg border border-border dark:border-border-dark"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setOpen(expanded ? null : i)}
              className="min-h-[44px] flex-row items-center justify-between gap-2 bg-surface px-4 py-3 dark:bg-surface-dark"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text variant="bodyMedium" className="flex-1">
                {item.heading}
              </Text>
              <ChevronDown
                size={18}
                color={colors.charcoal[500]}
                strokeWidth={2}
                style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
              />
            </Pressable>
            {expanded ? (
              <View className="gap-2 px-4 py-3">
                <RenderBlocks nodes={item.content} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function TabsBlock({ node }: { node: NElement }) {
  const tabs = useMemo(() => extractTabs(node), [node]);
  const [active, setActive] = useState(0);
  if (tabs.length === 0) return <RenderBlocks nodes={node.children} />;
  const current = tabs[Math.min(active, tabs.length - 1)] ?? tabs[0];
  if (!current) return <RenderBlocks nodes={node.children} />;
  return (
    <View className="my-1 gap-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
        <View className="flex-row gap-2">
          {tabs.map((tab, i) => {
            const selected = i === active;
            return (
              <Pressable
                // biome-ignore lint/suspicious/noArrayIndexKey: tabs are positional, parsed once, never reordered
                key={i}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setActive(i)}
                className={`min-h-[36px] justify-center rounded-full px-3 ${selected ? 'bg-surface-active dark:bg-surface-active-dark' : ''}`}
              >
                <Text variant={selected ? 'bodyMedium' : 'bodySm'}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View className="gap-2">
        <RenderBlocks nodes={current.content} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

export function ArticleBody({ html }: { html: string }) {
  const nodes = useMemo(() => parseArticleHtml(html), [html]);
  return (
    <View className="gap-3">
      <RenderBlocks nodes={nodes} />
    </View>
  );
}
