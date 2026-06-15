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
