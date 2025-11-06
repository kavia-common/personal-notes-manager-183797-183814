import { render, screen } from '@testing-library/react';
import App from './App';

test('renders top bar title', () => {
  render(<App />);
  const title = screen.getByText(/Personal Notes/i);
  expect(title).toBeInTheDocument();
});
