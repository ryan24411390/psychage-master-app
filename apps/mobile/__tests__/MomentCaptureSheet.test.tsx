import type { MomentDraft } from '@psychage/shared/engagement';
import { fireEvent, screen } from '@testing-library/react-native';

import { MomentCaptureSheet } from '@/components/moments/MomentCaptureSheet';

import { renderWithProviders } from './_helpers';

// The Moments capture sheet — AFFECT-LABELING, word-first. Pins: the NAMING is the act
// (no valence slider, no "rate your mood"/"mood tracker" framing), 2-tap minimal capture,
// the optional second word + intensity, that routedToSupport is NEVER stamped (no
// acute-handoff rule is built), the accurate privacy copy, and the single constant-warmth
// post-capture acknowledgment of the act.

describe('MomentCaptureSheet (affect-labeling, word-first)', () => {
  it('frames the act as naming + accurate privacy line; no rate/mood-tracker/day framing', () => {
    renderWithProviders(<MomentCaptureSheet onSave={() => {}} onClose={() => {}} />, { haptics: true });
    expect(screen.getByText('Name what you feel')).toBeTruthy();
    expect(screen.getByText('Private to your account.')).toBeTruthy();
    expect(screen.queryByText(/rate your mood/i)).toBeNull();
    expect(screen.queryByText(/mood tracker/i)).toBeNull();
    expect(screen.queryByText(/today’s entry/i)).toBeNull();
    expect(screen.queryByText(/stays on your phone/i)).toBeNull();
  });

  it('2-tap minimal capture: pick one word, save — nothing else required', () => {
    const onSave = jest.fn<void, [MomentDraft]>();
    renderWithProviders(<MomentCaptureSheet onSave={onSave} onClose={() => {}} />, { haptics: true });

    fireEvent.press(screen.getByRole('button', { name: 'Steady' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save this moment' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const draft = onSave.mock.calls[0]?.[0];
    expect(draft?.labelPrimary).toBe('steady');
    expect(draft?.labelSecondary).toBeUndefined();
    expect(draft?.intensity).toBeUndefined();
    // No acute-handoff rule is built — the flag is never stamped at capture.
    expect(draft?.routedToSupport).toBeUndefined();
  });

  it('save is disabled until a word is named (the optional steps appear only after)', () => {
    const onSave = jest.fn();
    renderWithProviders(<MomentCaptureSheet onSave={onSave} onClose={() => {}} />, { haptics: true });
    // The optional "how strong" prompt only appears once a word is chosen.
    expect(screen.queryByText('How strong is it?')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Save this moment' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('carries an optional second word + intensity; never stamps routedToSupport', () => {
    const onSave = jest.fn<void, [MomentDraft]>();
    renderWithProviders(<MomentCaptureSheet onSave={onSave} onClose={() => {}} />, { haptics: true });

    fireEvent.press(screen.getByRole('button', { name: 'Hopeless' })); // band-1 word
    fireEvent.press(screen.getByRole('button', { name: 'Alone' })); // optional second word
    fireEvent.press(screen.getByRole('button', { name: 'A lot' })); // intensity = high
    fireEvent.press(screen.getByRole('button', { name: 'Save this moment' }));

    const draft = onSave.mock.calls[0]?.[0];
    expect(draft?.labelPrimary).toBe('hopeless');
    expect(draft?.labelSecondary).toBe('alone');
    expect(draft?.intensity).toBe('high');
    expect(draft?.routedToSupport).toBeUndefined();
  });

  it('shows a single constant-warmth acknowledgment of the act after saving', () => {
    renderWithProviders(<MomentCaptureSheet onSave={() => {}} onClose={() => {}} />, { haptics: true });
    fireEvent.press(screen.getByRole('button', { name: 'Calm' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save this moment' }));
    expect(screen.getByText('You noticed that.')).toBeTruthy();
  });
});
