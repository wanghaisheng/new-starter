import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Network } from '@capacitor/network'
import { mockDataService } from '@/core/test/mock-data-service'
import HelpCenterPage from '@/app/mobile/help-center/page'
import { I18nProvider } from '@/core/lib/i18n/dictionaries'

jest.mock('@capacitor/network', () => ({
  Network: {
    getStatus: jest.fn(),
    addListener: jest.fn()
  }
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider locale={'en' as any} fallback={<div>Loading...</div>}>
    {children}
  </I18nProvider>
)

describe('HelpCenterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(Network.getStatus as jest.Mock).mockResolvedValue({ connected: true })
    ;(Network.addListener as jest.Mock).mockImplementation(() => ({
      remove: jest.fn()
    }))
  })

  it('renders help center page with correct translations', async () => {
    render(<HelpCenterPage />, { wrapper: TestWrapper })

    expect(await screen.findByText('Help Center')).toBeInTheDocument()
    expect(await screen.findByPlaceholderText('Search questions...')).toBeInTheDocument()
  })

  it('displays category list', async () => {
    render(<HelpCenterPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument()
      expect(screen.getByText('Payments')).toBeInTheDocument()
    })
  })

  it('navigates to question details', async () => {
    render(<HelpCenterPage />, { wrapper: TestWrapper })

    const accountCategory = await screen.findByText('Account')
    fireEvent.click(accountCategory)

    await waitFor(() => {
      expect(screen.getByText('How do I change my password?')).toBeInTheDocument()
      expect(screen.getByText('How do I update my profile?')).toBeInTheDocument()
    })
  })

  it('handles search functionality', async () => {
    render(<HelpCenterPage />, { wrapper: TestWrapper })

    const searchInput = await screen.findByPlaceholderText('Search questions...')
    fireEvent.change(searchInput, { target: { value: 'password' } })

    await waitFor(() => {
      expect(screen.getByText('How do I change my password?')).toBeInTheDocument()
      expect(screen.queryByText('How do I update my profile?')).not.toBeInTheDocument()
    })
  })

  it('handles offline mode', async () => {
    ;(Network.getStatus as jest.Mock).mockResolvedValue({ connected: false })

    render(<HelpCenterPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText('You are currently offline')).toBeInTheDocument()
    })

    // Should still display cached content
    expect(await screen.findByText('Account')).toBeInTheDocument()
    expect(await screen.findByText('Payments')).toBeInTheDocument()
  })

  // 基本功能测试
  test('页面加载性能', async () => {
    const startTime = performance.now()
    render(<HelpCenterPage />)
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(1500)
  })

  test('分类列表展示', async () => {
    render(<HelpCenterPage />)
    
    // 等待分类加载
    await waitFor(() => {
      expect(screen.getByText('账户问题')).toBeInTheDocument()
    })
    
    // 验证分类图标
    const categoryIcon = screen.getByTestId('category-icon-1')
    expect(categoryIcon).toBeInTheDocument()
  })

  test('问题详情页加载', async () => {
    render(<HelpCenterPage />)
    
    // 点击问题
    fireEvent.click(screen.getByText('如何修改密码？'))
    
    // 验证详情内容
    await waitFor(() => {
      expect(screen.getByText('修改密码的详细步骤...')).toBeInTheDocument()
    })
  })

  test('搜索功能', async () => {
    render(<HelpCenterPage />)
    
    // 输入搜索关键词
    const searchInput = screen.getByPlaceholderText('搜索问题')
    fireEvent.change(searchInput, { target: { value: '密码' } })
    
    // 验证搜索结果
    await waitFor(() => {
      expect(screen.getByText('如何修改密码？')).toBeInTheDocument()
    })
  })

  // 离线功能测试
  test('离线内容访问', async () => {
    // 模拟网络离线
    ;(Network.getStatus as jest.Mock).mockResolvedValue({ connected: false })
    
    render(<HelpCenterPage />)
    
    // 验证离线内容加载
    await waitFor(() => {
      expect(screen.getByText('账户问题')).toBeInTheDocument()
    })
  })

  test('离线搜索功能', async () => {
    // 模拟网络离线
    ;(Network.getStatus as jest.Mock).mockResolvedValue({ connected: false })
    
    render(<HelpCenterPage />)
    
    // 输入搜索关键词
    const searchInput = screen.getByPlaceholderText('搜索问题')
    fireEvent.change(searchInput, { target: { value: '密码' } })
    
    // 验证离线搜索结果
    await waitFor(() => {
      expect(screen.getByText('如何修改密码？')).toBeInTheDocument()
    })
  })

  // 性能测试
  test('内容切换动画流畅度', async () => {
    render(<HelpCenterPage />)
    
    // 记录动画开始时间
    const startTime = performance.now()
    
    // 触发内容切换
    fireEvent.click(screen.getByText('如何修改密码？'))
    
    // 等待动画完成
    await waitFor(() => {
      expect(screen.getByText('修改密码的详细步骤...')).toBeInTheDocument()
    })
    
    // 验证动画时间
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(300)
  })

  // 兼容性测试
  test('不同屏幕尺寸适配', async () => {
    // 模拟不同屏幕尺寸
    global.innerWidth = 375 // iPhone SE
    global.dispatchEvent(new Event('resize'))
    
    render(<HelpCenterPage />)
    
    // 验证布局适配
    const container = screen.getByTestId('help-center-container')
    expect(container).toHaveStyle({ width: '100%' })
  })
}) 