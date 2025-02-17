import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressBar from './ProgressBar';

describe('ProgressBar component', () => {
  it('renders a progress element with correct attributes and classes', () => {
    const progressValue = 50;
    const variant = 'progressing';

    render(<ProgressBar progress={progressValue} variant={variant} />);

    // The progress element should be accessible via its aria-label
    const progressElement = screen.getByRole('progressbar', {
      name: 'Deployment Progress',
    });

    expect(progressElement).toBeInTheDocument();
    expect(progressElement).toHaveAttribute('max', '100');
    expect(progressElement).toHaveAttribute('value', progressValue.toString());
    expect(progressElement).toHaveAttribute(
      'aria-valuenow',
      progressValue.toString()
    );
    expect(progressElement).toHaveAttribute('aria-valuemin', '0');
    expect(progressElement).toHaveAttribute('aria-valuemax', '100');

    // Verify that the progress element has the proper CSS classes.
    expect(progressElement).toHaveClass('progress');
    expect(progressElement).toHaveClass(variant);
  });

  it('renders a label when provided', () => {
    const progressValue = 75;
    const variant = 'progressing';
    const label = 'Test Label';

    render(
      <ProgressBar progress={progressValue} variant={variant} label={label} />
    );

    // The label should be rendered in a span with class "progress-label"
    const labelElement = screen.getByText(label);
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).toHaveClass('progress-label');
  });

  it('does not render a label when not provided', () => {
    const progressValue = 30;
    const variant = 'progressing';

    render(<ProgressBar progress={progressValue} variant={variant} />);

    // Query for an element with the class "progress-label" should return null.
    const labelElement = screen.queryByText((content, element) =>
      element?.classList.contains('progress-label') ? true : false
    );
    expect(labelElement).toBeNull();
  });
});
