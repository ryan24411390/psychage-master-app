import type { MomentDraft } from '@psychage/shared/engagement';
import { fireEvent, screen } from '@testing-library/react-native';

import { MomentCaptureSheet } from '@/components/moments/MomentCaptureSheet';

import { renderWithProviders } from './_helpers';

// The Moments capture sheet. Pins: 2-tap minimal capture, the expanded path, the
// acute-handoff stamp (lowest valence + a crisis word), the accurate privacy copy
// ("Private to your account" — NOT "Stays on your phone"), and momentary copy.

describe('MomentCaptureSheet', () => {
  it('momentary copy + accurate privacy line (no day framing, no "stays on your phone")', () => {
    renderWithProviders(<MomentCaptureSheet onSave={() => {}} onClose={() => {}} />, { haptics: true });
    expect(screen.getByText('How are you right now?')).toBeTruthy();
    expect(screen.getByText('Private to your account.')).toBeTruthy();
    expect(screen.queryByText(/today’s entry/i)).toBeNull();
    expect(screen.queryByText(/stays on your phone/i)).toBeNull();
  });

  it('2-tap minimal capture: pick a valence, save — no labels required', () => {
    const onSave = jest.fn<void, [MomentDraft]>();
    renderWithProviders(<MomentCaptureSheet onSave={onSave} onClose={() => {}} />, { haptics: true });

    fireEvent.press(screen.getByLabelText('Level 3 of 5'));
    fireEvent.press(screen.getByRole('button', { name: 'Save this moment' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const draft = onSave.mock.calls[0]?.[0];
    expect(draft?.valence).toBe(3);
    expect(draft?.labels).toEqual([]);
    expect(draft?.routedToSupport).toBe(false);
  });

  it('save is disabled until a valence is chosen', () => {
    const onSave = jest.fn();
    renderWithProviders(<MomentCaptureSheet onSave={onSave} onClose={() => {}} />, { haptics: true });
    // The label prompt only appears once a valence is selected.
    expect(screen.queryByText('One word, if you want.')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Save this moment' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('expanded capture carries labels + context; lowest valence + crisis word stamps routedToSupport', () => {
    const onSave = jest.fn<void, [MomentDraft]>();
    renderWithProviders(<MomentCaptureSheet onSave={onSave} onClose={() => {}} />, { haptics: true });

    fireEvent.press(screen.getByLabelText('Level 1 of 5'));
    fireEvent.press(screen.getByRole('button', { name: 'Hopeless' })); // crisis-adjacent word
    fireEvent.press(screen.getByRole('button', { name: 'Work' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save this moment' }));

    const draft = onSave.mock.calls[0]?.[0];
    expect(draft?.valence).toBe(1);
    expect(draft?.labels).toContain('hopeless');
    expect(draft?.context).toContain('work');
    // SR-2 acute handoff: lowest valence + crisis word → routed.
    expect(draft?.routedToSupport).toBe(true);
  });
});
