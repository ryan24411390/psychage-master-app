import { fireEvent, screen } from '@testing-library/react-native';

import { ConsentIntro } from '@/components/therapist/ConsentIntro';
import { PdfPreview } from '@/components/therapist/PdfPreview';
import { ProviderForm } from '@/components/therapist/ProviderForm';
import { RangePicker } from '@/components/therapist/RangePicker';
import type { RangeOption } from '@/components/therapist/RangeRadio';
import { THERAPIST_COPY } from '@/features/therapist';

import { renderWithProviders } from './_helpers';

const OPTIONS: readonly RangeOption[] = [
  { key: '7', label: THERAPIST_COPY.rangeOption7, days: 7 },
  { key: '14', label: THERAPIST_COPY.rangeOption14, days: 14 },
  { key: '30', label: THERAPIST_COPY.rangeOption30, days: 30 },
];

describe('ConsentIntro (S38)', () => {
  it('renders consent framing and fires the primary', () => {
    const onPrimary = jest.fn();
    renderWithProviders(<ConsentIntro onPrimary={onPrimary} />, { haptics: true });

    expect(screen.getByText(THERAPIST_COPY.consentTitle)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: THERAPIST_COPY.consentPrimary }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });
});

describe('ProviderForm (S39)', () => {
  it('requires a name; submits name + optional contact (trimmed)', () => {
    const onSubmit = jest.fn();
    renderWithProviders(<ProviderForm onSubmit={onSubmit} />, { haptics: true });

    // Empty name → blocked.
    fireEvent.press(screen.getByRole('button', { name: THERAPIST_COPY.addProviderPrimary }));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText(THERAPIST_COPY.providerNameLabel), '  Dr. Lee  ');
    fireEvent.changeText(
      screen.getByLabelText(THERAPIST_COPY.providerContactLabel),
      'lee@example.com',
    );
    fireEvent.press(screen.getByRole('button', { name: THERAPIST_COPY.addProviderPrimary }));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Dr. Lee', contact: 'lee@example.com' });
  });
});

describe('RangePicker (S40)', () => {
  it('renders three radios, keeps preview disabled until a range is chosen', () => {
    const onChange = jest.fn();
    const onPreview = jest.fn();
    renderWithProviders(
      <RangePicker
        options={OPTIONS}
        value={null}
        countLine={null}
        onChange={onChange}
        onPreview={onPreview}
      />,
      { haptics: true },
    );

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    fireEvent.press(screen.getByRole('button', { name: THERAPIST_COPY.rangePrimary }));
    expect(onPreview).not.toHaveBeenCalled(); // disabled while nothing is selected

    fireEvent.press(screen.getByLabelText(THERAPIST_COPY.rangeOption14));
    expect(onChange).toHaveBeenCalledWith('14');
  });

  it('shows the honest count and fires preview when a range is selected', () => {
    const onPreview = jest.fn();
    renderWithProviders(
      <RangePicker
        options={OPTIONS}
        value="14"
        countLine="14 days, 9 entries"
        onChange={() => {}}
        onPreview={onPreview}
      />,
      { haptics: true },
    );

    expect(screen.getByText('14 days, 9 entries')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: THERAPIST_COPY.rangePrimary }));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });
});

describe('PdfPreview (S41)', () => {
  it('edits the name and shares with the trimmed full name', () => {
    const onShare = jest.fn();
    renderWithProviders(
      <PdfPreview
        initialName=""
        summaryLine="Jun 1 – Jun 18 · 18 days, 14 entries"
        terrainDays={[]}
        isEmpty={false}
        onShare={onShare}
      />,
      { haptics: true },
    );

    expect(screen.getByText('Jun 1 – Jun 18 · 18 days, 14 entries')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText(THERAPIST_COPY.previewNameLabel), '  Sam Doe ');
    fireEvent.press(screen.getByRole('button', { name: THERAPIST_COPY.sharePrimary }));
    // Second arg = includeTools opt-in, default OFF (check-ins-only share, matching consent).
    expect(onShare).toHaveBeenCalledWith('Sam Doe', false);
  });

  it('shows the honest empty-range line', () => {
    renderWithProviders(
      <PdfPreview initialName="" summaryLine="x" terrainDays={[]} isEmpty onShare={() => {}} />,
      { haptics: true },
    );
    expect(screen.getByText(THERAPIST_COPY.emptyRangeLine)).toBeTruthy();
  });
});
