import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectTypeFilter } from '../project-type-filter';

const ALL_TYPES_SET = new Set(['narrative', 'documentary', 'corporate', 'tv-episodic']);

describe('ProjectTypeFilter', () => {
  it('renders "All" checkbox and 4 type checkboxes', () => {
    render(
      <ProjectTypeFilter
        activeTypes={ALL_TYPES_SET}
        onToggleType={vi.fn()}
        onToggleAll={vi.fn()}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(5);
    expect(screen.getByLabelText(/select all project types/i)).toBeDefined();
    expect(screen.getByText('Narrative')).toBeDefined();
    expect(screen.getByText('Documentary')).toBeDefined();
    expect(screen.getByText('Corporate')).toBeDefined();
    expect(screen.getByText('TV / Episodic')).toBeDefined();
  });

  it('all checkboxes are checked when activeTypes contains all 4 types', () => {
    render(
      <ProjectTypeFilter
        activeTypes={ALL_TYPES_SET}
        onToggleType={vi.fn()}
        onToggleAll={vi.fn()}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    for (const cb of checkboxes) {
      expect(cb.checked).toBe(true);
    }
  });

  it('clicking a type checkbox calls onToggleType with the type key', () => {
    const onToggleType = vi.fn();
    render(
      <ProjectTypeFilter
        activeTypes={ALL_TYPES_SET}
        onToggleType={onToggleType}
        onToggleAll={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('Narrative'));
    expect(onToggleType).toHaveBeenCalledWith('narrative');
  });

  it('clicking "All" checkbox calls onToggleAll', () => {
    const onToggleAll = vi.fn();
    render(
      <ProjectTypeFilter
        activeTypes={ALL_TYPES_SET}
        onToggleType={vi.fn()}
        onToggleAll={onToggleAll}
      />
    );
    fireEvent.click(screen.getByLabelText(/select all project types/i));
    expect(onToggleAll).toHaveBeenCalledOnce();
  });

  it('"All" checkbox is unchecked when activeTypes has fewer than 4 types', () => {
    const partial = new Set(['narrative', 'documentary']);
    render(
      <ProjectTypeFilter
        activeTypes={partial}
        onToggleType={vi.fn()}
        onToggleAll={vi.fn()}
      />
    );
    const allCheckbox = screen.getByLabelText(/select all project types/i) as HTMLInputElement;
    expect(allCheckbox.checked).toBe(false);
  });

  it('each type label includes an icon element with aria-hidden', () => {
    const { container } = render(
      <ProjectTypeFilter
        activeTypes={ALL_TYPES_SET}
        onToggleType={vi.fn()}
        onToggleAll={vi.fn()}
      />
    );
    // Each of the 4 type rows should have an aria-hidden icon (svg)
    const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenIcons.length).toBeGreaterThanOrEqual(4);
  });
});
