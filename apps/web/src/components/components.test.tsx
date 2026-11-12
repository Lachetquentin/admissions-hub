import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from '@/components/ui/input';
import { FormField } from './FormField';
import { Pagination } from './Pagination';
import { StatusTiles } from './StatusTiles';

describe('StatusTiles', () => {
  const counts = { NEW: 4, REVIEWING: 3, ACCEPTED: 2, REJECTED: 1 };

  it('shows the total and one counter per status', () => {
    render(<StatusTiles counts={counts} selected={undefined} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: 'Toutes (10)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Acceptées (2)' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('filters by the clicked status, and "Toutes" clears the filter', async () => {
    const onSelect = vi.fn();
    render(<StatusTiles counts={counts} selected="NEW" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /Refusées/ }));
    await userEvent.click(screen.getByRole('button', { name: /Toutes/ }));
    expect(onSelect.mock.calls).toEqual([['REJECTED'], [undefined]]);
  });
});

describe('Pagination', () => {
  it('marks the current page and disables "previous" on the first page', () => {
    render(<Pagination page={1} pageSize={8} total={36} onChange={() => {}} />);
    expect(screen.getByText('1–8 sur 36 · page 1 sur 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Page précédente' })).toBeDisabled();
  });

  it('asks for the clicked page', async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} pageSize={8} total={36} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    await userEvent.click(screen.getByRole('button', { name: 'Page suivante' }));
    expect(onChange.mock.calls).toEqual([[5], [3]]);
  });
});

describe('FormField', () => {
  it('links the label and announces the error with the field', () => {
    render(
      <FormField label="E-mail" error="Adresse e-mail invalide">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    const input = screen.getByLabelText('E-mail');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Adresse e-mail invalide');
  });

  it('is valid and uses the hint as description when there is no error', () => {
    render(
      <FormField label="École" hint="Une candidature ne change pas d'école">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    const input = screen.getByLabelText('École');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAccessibleDescription("Une candidature ne change pas d'école");
  });
});
