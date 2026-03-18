import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EvaluationCard } from '../evaluation-card';

describe('EvaluationCard', () => {
  it('renders card title', () => {
    render(
      <EvaluationCard title="Test Card" ready={true}>
        <p>content</p>
      </EvaluationCard>
    );
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('shows children when ready', () => {
    render(
      <EvaluationCard title="Test Card" ready={true}>
        <p>card content</p>
      </EvaluationCard>
    );
    expect(screen.getByText('card content')).toBeInTheDocument();
  });

  it('shows skeleton when not ready', () => {
    render(
      <EvaluationCard title="Test Card" ready={false}>
        <p>card content</p>
      </EvaluationCard>
    );
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('collapses on header click', () => {
    render(
      <EvaluationCard title="Test Card" ready={true}>
        <p>card content</p>
      </EvaluationCard>
    );
    expect(screen.getByText('card content')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Test Card'));
    expect(screen.queryByText('card content')).toBeNull();
  });

  it('shows expand aria-label when collapsed', () => {
    render(
      <EvaluationCard title="Test Card" ready={true}>
        <p>card content</p>
      </EvaluationCard>
    );
    fireEvent.click(screen.getByText('Test Card'));
    expect(screen.getByLabelText('Expand card')).toBeInTheDocument();
  });

  it('shows collapse aria-label when expanded (default)', () => {
    render(
      <EvaluationCard title="Test Card" ready={true}>
        <p>card content</p>
      </EvaluationCard>
    );
    expect(screen.getByLabelText('Collapse card')).toBeInTheDocument();
  });
});
