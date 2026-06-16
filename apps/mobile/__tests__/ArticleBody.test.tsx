import { fireEvent, render, screen } from '@testing-library/react-native';

import { ArticleBody } from '@/features/content/blocks/ArticleBody';

// A representative body mirroring the web's serialized markup: lead paragraph
// with an entity, heading, citation superscript, list, blockquote, a callout
// (left-accent + tint), a table, a radix accordion, and an inline svg.
const HTML = `<div>
  <p class="lead">People who experience anxiety often describe a tight chest &amp; a racing heart.</p>
  <h2>What is happening</h2>
  <p>Research shows steady breathing helps<button type="button" id="citation-ref-1" class="align-super">1</button>.</p>
  <ul><li>slow exhale</li><li>name the feeling</li></ul>
  <blockquote class="border-l-4 border-teal-500 italic">Naming it can make it feel less alarming.</blockquote>
  <div class="rounded-xl border-l-4 border-l-teal-400 bg-teal-50"><p>A slow exhale signals safety.</p></div>
  <table><thead><tr><th>Symptom</th><th>Note</th></tr></thead><tbody><tr><td>tight chest</td><td>common pattern</td></tr></tbody></table>
  <div><div data-state="closed"><button>Is this normal?</button><div role="region"><p>Yes, this is common.</p></div></div></div>
  <svg viewBox="0 0 24 24"><path d="M1 1"/></svg>
</div>`;

describe('ArticleBody', () => {
  it('renders prose verbatim with entities decoded', () => {
    render(<ArticleBody html={HTML} />);
    // & decoded, not &amp;
    expect(
      screen.getByText('People who experience anxiety often describe a tight chest & a racing heart.'),
    ).toBeOnTheScreen();
  });

  it('renders headings, lists, quote and a citation marker', () => {
    render(<ArticleBody html={HTML} />);
    expect(screen.getByText('What is happening')).toBeOnTheScreen();
    expect(screen.getByText('slow exhale')).toBeOnTheScreen();
    expect(screen.getByText('name the feeling')).toBeOnTheScreen();
    expect(screen.getByText('Naming it can make it feel less alarming.')).toBeOnTheScreen();
    expect(screen.getByText(/Research shows steady breathing helps/)).toBeOnTheScreen();
    expect(screen.getByLabelText('citation 1')).toBeOnTheScreen();
  });

  it('keeps callout and table prose (no block drops the text)', () => {
    render(<ArticleBody html={HTML} />);
    expect(screen.getByText('A slow exhale signals safety.')).toBeOnTheScreen();
    expect(screen.getByText('Symptom')).toBeOnTheScreen();
    expect(screen.getByText('tight chest')).toBeOnTheScreen();
    expect(screen.getByText('common pattern')).toBeOnTheScreen();
  });

  it('renders an accordion that reveals its answer prose on press', () => {
    render(<ArticleBody html={HTML} />);
    expect(screen.getByText('Is this normal?')).toBeOnTheScreen();
    // Collapsed by default — answer prose is present once expanded.
    expect(screen.queryByText('Yes, this is common.')).toBeNull();
    fireEvent.press(screen.getByText('Is this normal?'));
    expect(screen.getByText('Yes, this is common.')).toBeOnTheScreen();
  });

  it('renders empty body without crashing', () => {
    const tree = render(<ArticleBody html="" />).toJSON();
    expect(tree).toBeTruthy();
  });
});

// Rich PEAF blocks — the web JSX is flattened to class-rich HTML; the native
// renderers recover structure and must always keep the prose.
const RICH = `<div>
  <div class="not-prose rounded-2xl bg-gradient-to-br from-surface to-white border border-border">
    <div class="grid grid-cols-2 divide-x divide-border">
      <div class="flex flex-col items-center text-center p-6"><div class="text-4xl font-bold tabular-nums">30%</div><p class="text-sm">Adults affected</p></div>
    </div>
  </div>
  <div class="not-prose my-8"><div class="relative pl-8"><div class="space-y-8">
    <div class="relative"><div class="rounded-full bg-teal-100"><span class="font-bold text-teal-600">1</span></div><div class="pl-4"><h4>Breathe slowly</h4><div class="text-sm text-text-secondary"><p>Exhale longer than you inhale.</p></div></div></div>
  </div></div></div>
  <div class="not-prose my-8"><div class="grid grid-cols-2 rounded-2xl border border-border">
    <div class="bg-red-50 p-6"><span class="uppercase text-red-700">Before</span><div class="text-sm text-text-secondary"><p>Skipping meals.</p></div></div>
    <div class="bg-emerald-50 p-6"><span class="uppercase text-emerald-700">After</span><div class="text-sm text-text-secondary"><p>Eating regularly.</p></div></div>
  </div></div>
  <div class="not-prose my-8 scroll-mt-32"><div class="grid">
    <div class="bg-red-50 border-2 border-red-200 rounded-2xl p-6"><span class="uppercase text-red-700">Myth</span><p class="text-base">Anxiety is a weakness.</p></div>
    <div class="bg-teal-50 border-2 border-teal-200 rounded-2xl p-6"><span class="uppercase text-teal-700">Fact</span><p class="text-base">Anxiety is a common response.</p></div>
  </div></div>
  <div class="not-prose my-8 py-8 px-8 rounded-2xl bg-gradient-to-br from-teal-50 to-white border border-teal-100 text-center"><div class="space-y-3"><p>You are not alone.</p></div></div>
</div>`;

describe('ArticleBody — rich PEAF blocks', () => {
  it('renders a StatCard value and label', () => {
    render(<ArticleBody html={RICH} />);
    expect(screen.getByText('30%')).toBeOnTheScreen();
    expect(screen.getByText('Adults affected')).toBeOnTheScreen();
  });

  it('renders ProgressSteps title + content', () => {
    render(<ArticleBody html={RICH} />);
    expect(screen.getByText('Breathe slowly')).toBeOnTheScreen();
    expect(screen.getByText('Exhale longer than you inhale.')).toBeOnTheScreen();
  });

  it('renders BeforeAfter labels + both panels', () => {
    render(<ArticleBody html={RICH} />);
    expect(screen.getByText('Before')).toBeOnTheScreen();
    expect(screen.getByText('After')).toBeOnTheScreen();
    expect(screen.getByText('Skipping meals.')).toBeOnTheScreen();
    expect(screen.getByText('Eating regularly.')).toBeOnTheScreen();
  });

  it('renders MythVsFact text', () => {
    render(<ArticleBody html={RICH} />);
    expect(screen.getByText('Anxiety is a weakness.')).toBeOnTheScreen();
    expect(screen.getByText('Anxiety is a common response.')).toBeOnTheScreen();
  });

  it('renders HighlightBox content', () => {
    render(<ArticleBody html={RICH} />);
    expect(screen.getByText('You are not alone.')).toBeOnTheScreen();
  });
});
