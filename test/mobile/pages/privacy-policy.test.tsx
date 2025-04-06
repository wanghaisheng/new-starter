import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Network } from '@capacitor/network';
import { I18nProvider } from '@core/lib/i18n/I18nProvider';
import PrivacyPolicyPage from '@mobile/settings/privacy-policy/page';

// Mock Network module
jest.mock('@capacitor/network', () => ({
  Network: {
    getStatus: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn()
  }
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock the styles module
jest.mock('@mobile/settings/privacy-policy/page.module.css', () => ({
  offlineMessage: 'offline-message',
  lastUpdated: 'last-updated',
  policySections: 'policy-sections'
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider>{children}</I18nProvider>
);

describe('PrivacyPolicyPage', () => {
  const mockNetworkStatus = (connected: boolean) => {
    ;(Network.getStatus as jest.Mock).mockResolvedValue({ connected });
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Mock network status
    mockNetworkStatus(true);
    ;(Network.addListener as jest.Mock).mockResolvedValue({
      remove: jest.fn()
    });
  });

  it('renders the privacy policy page correctly', async () => {
    render(
      <I18nProvider locale="en">
        <PrivacyPolicyPage />
      </I18nProvider>
    );

    // Check if the title is rendered
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();

    // Check if the last updated date is rendered
    expect(screen.getByTestId('last-updated')).toBeInTheDocument();

    // Check if all sections are rendered
    expect(screen.getByTestId('introduction-section')).toBeInTheDocument();
    expect(screen.getByTestId('information-collection-section')).toBeInTheDocument();
    expect(screen.getByTestId('information-usage-section')).toBeInTheDocument();
    expect(screen.getByTestId('data-security-section')).toBeInTheDocument();
    expect(screen.getByTestId('data-rights-section')).toBeInTheDocument();
    expect(screen.getByTestId('children-privacy-section')).toBeInTheDocument();
    expect(screen.getByTestId('policy-changes-section')).toBeInTheDocument();
    expect(screen.getByTestId('contact-us-section')).toBeInTheDocument();
  });

  // 滚动性能测试
  describe('Scroll Performance Tests', () => {
    it('scrolls smoothly', async () => {
      render(
        <I18nProvider locale="en">
          <PrivacyPolicyPage />
        </I18nProvider>
      );
      
      const content = screen.getByTestId('privacy-policy-content');
      const startTime = performance.now();
      
      // Scroll to bottom
      await act(async () => {
        fireEvent.scroll(content, { target: { scrollY: 1000 } });
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      const endTime = performance.now();
      const scrollDuration = endTime - startTime;
      
      // Scroll duration should be less than 500ms
      expect(scrollDuration).toBeLessThan(500);
    });

    it('maintains scroll position after content updates', async () => {
      render(
        <I18nProvider locale="en">
          <PrivacyPolicyPage />
        </I18nProvider>
      );
      
      const content = screen.getByTestId('privacy-policy-content');
      
      // Set initial scroll position
      await act(async () => {
        fireEvent.scroll(content, { target: { scrollY: 500 } });
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      const scrollPosition = content.scrollTop;
      
      // Trigger a re-render
      await act(async () => {
        mockNetworkStatus(false);
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      // Scroll position should be maintained
      expect(content.scrollTop).toBe(scrollPosition);
    });

    it('handles rapid scrolling', async () => {
      render(
        <I18nProvider locale="en">
          <PrivacyPolicyPage />
        </I18nProvider>
      );
      
      const content = screen.getByTestId('privacy-policy-content');
      const startTime = performance.now();
      
      // Perform multiple rapid scrolls
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          fireEvent.scroll(content, { target: { scrollY: i * 200 } });
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      const endTime = performance.now();
      const totalScrollTime = endTime - startTime;
      
      // Total scroll time should be less than 1 second
      expect(totalScrollTime).toBeLessThan(1000);
    });

    it('has proper scroll momentum', async () => {
      render(
        <I18nProvider locale="en">
          <PrivacyPolicyPage />
        </I18nProvider>
      );
      
      const content = screen.getByTestId('privacy-policy-content');
      
      // Simulate a fast scroll gesture
      await act(async () => {
        fireEvent.scroll(content, { target: { scrollY: 1000 } });
        await new Promise(resolve => setTimeout(resolve, 500));
      });
      
      // Check if scroll position is reasonable (not at the extreme end)
      expect(content.scrollTop).toBeGreaterThan(0);
      expect(content.scrollTop).toBeLessThan(content.scrollHeight);
    });
  });

  describe('Offline Mode', () => {
    it('shows offline message when offline', async () => {
      mockNetworkStatus(false);

      render(
        <I18nProvider locale="en">
          <PrivacyPolicyPage />
        </I18nProvider>
      );

      expect(screen.getByTestId('offline-message')).toBeInTheDocument();
    });

    it('hides offline message when online', async () => {
      mockNetworkStatus(true);

      render(
        <I18nProvider locale="en">
          <PrivacyPolicyPage />
        </I18nProvider>
      );

      expect(screen.queryByTestId('offline-message')).not.toBeInTheDocument();
    });

    it('updates offline status when network changes', async () => {
      mockNetworkStatus(true);
      let networkCallback: (status: { connected: boolean }) => void = () => {};

      ;(Network.addListener as jest.Mock).mockImplementation((event, callback) => {
        networkCallback = callback;
        return Promise.resolve({ remove: jest.fn() });
      });

      render(
        <I18nProvider locale="en">
          <PrivacyPolicyPage />
        </I18nProvider>
      );

      expect(screen.queryByTestId('offline-message')).not.toBeInTheDocument();

      // Simulate network status change
      await act(async () => {
        networkCallback({ connected: false });
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(screen.getByTestId('offline-message')).toBeInTheDocument();
    });
  });
}); 