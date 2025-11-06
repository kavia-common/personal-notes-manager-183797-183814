import { render, screen } from '@testing-library/react';
import TopBar from './components/TopBar';

test('renders top bar title', () => {
  render(<TopBar theme="light" onToggleTheme={() => {}} isConnected={false} />);
  const title = screen.getByText(/Personal Notes/i);
  expect(title).toBeInTheDocument();
});
