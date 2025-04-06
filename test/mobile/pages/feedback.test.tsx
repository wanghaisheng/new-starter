import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { mockIndexedDB } from '@/core/test/mock-indexeddb'
import FeedbackPage from '@/app/mobile/feedback/page'
import { I18nProvider } from '@/core/lib/i18n/config'
import { Network } from '@capacitor/network'
import { Camera } from '@capacitor/camera'

// Mock Capacitor plugins
jest.mock('@capacitor/network', () => ({
  Network: {
    getStatus: jest.fn().mockResolvedValue({ connected: true })
  }
}))

jest.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: jest.fn().mockResolvedValue({
      dataUrl: 'data:image/jpeg;base64,test'
    })
  }
}))

describe('FeedbackPage', () => {
  beforeAll(() => {
    mockIndexedDB.setup()
  })

  afterAll(() => {
    mockIndexedDB.teardown()
  })

  it('renders feedback form with correct translations', () => {
    render(
      <I18nProvider locale="en">
        <FeedbackPage />
      </I18nProvider>
    )

    expect(screen.getByText('Feedback')).toBeInTheDocument()
    expect(screen.getByText('Feedback Type')).toBeInTheDocument()
    expect(screen.getByText('Feedback Content')).toBeInTheDocument()
    expect(screen.getByText('Upload Image')).toBeInTheDocument()
    expect(screen.getByText('Submit')).toBeInTheDocument()
  })

  it('handles form submission with validation', async () => {
    render(
      <I18nProvider locale="en">
        <FeedbackPage />
      </I18nProvider>
    )

    // Try to submit empty form
    fireEvent.click(screen.getByText('Submit'))
    expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument()

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Feedback Type'), {
      target: { value: 'bug' }
    })
    fireEvent.change(screen.getByLabelText('Feedback Content'), {
      target: { value: 'Test feedback' }
    })

    // Submit the form
    fireEvent.click(screen.getByText('Submit'))

    // Check if submission is in progress
    expect(screen.getByText('Submitting...')).toBeInTheDocument()

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument()
    })
  })

  it('handles image upload and validation', async () => {
    render(
      <I18nProvider locale="en">
        <FeedbackPage />
      </I18nProvider>
    )

    // Mock successful image upload
    Camera.getPhoto.mockResolvedValueOnce({
      dataUrl: 'data:image/jpeg;base64,test'
    })

    // Click upload button
    fireEvent.click(screen.getByText('Upload Image'))

    // Wait for image to be uploaded
    await waitFor(() => {
      expect(screen.getByAltText('Uploaded Image')).toBeInTheDocument()
    })

    // Mock failed image upload
    Camera.getPhoto.mockRejectedValueOnce(new Error('Failed to upload image'))
    fireEvent.click(screen.getByText('Upload Image'))
    await waitFor(() => {
      expect(screen.getByText('Failed to submit feedback')).toBeInTheDocument()
    })
  })

  it('handles offline submission', async () => {
    // Mock network status as offline
    Network.getStatus.mockResolvedValueOnce({ connected: false })

    render(
      <I18nProvider locale="en">
        <FeedbackPage />
      </I18nProvider>
    )

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Feedback Type'), {
      target: { value: 'bug' }
    })
    fireEvent.change(screen.getByLabelText('Feedback Content'), {
      target: { value: 'Test feedback' }
    })

    // Submit the form
    fireEvent.click(screen.getByText('Submit'))

    // Check if submission is in progress
    expect(screen.getByText('Submitting...')).toBeInTheDocument()

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument()
    })

    // Verify data was stored in IndexedDB
    const storedData = await mockIndexedDB.get('feedback')
    expect(storedData).toContainEqual({
      type: 'bug',
      content: 'Test feedback',
      status: 'pending'
    })
  })

  it('handles network error during submission', async () => {
    // Mock network error
    Network.getStatus.mockRejectedValueOnce(new Error('Network error'))

    render(
      <I18nProvider locale="en">
        <FeedbackPage />
      </I18nProvider>
    )

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Feedback Type'), {
      target: { value: 'bug' }
    })
    fireEvent.change(screen.getByLabelText('Feedback Content'), {
      target: { value: 'Test feedback' }
    })

    // Submit the form
    fireEvent.click(screen.getByText('Submit'))

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Network error, please check your connection')).toBeInTheDocument()
    })
  })

  // 基本功能测试
  test('页面加载性能', async () => {
    const startTime = performance.now()
    render(<FeedbackPage />)
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(2000)
  })

  test('反馈类型选择', async () => {
    render(<FeedbackPage />)
    
    // 选择反馈类型
    const typeSelect = screen.getByLabelText('反馈类型')
    fireEvent.change(typeSelect, { target: { value: 'bug' } })
    
    // 验证类型选择
    expect(typeSelect).toHaveValue('bug')
  })

  test('表单必填项验证', async () => {
    render(<FeedbackPage />)
    
    // 尝试提交空表单
    const submitButton = screen.getByText('提交')
    fireEvent.click(submitButton)
    
    // 验证错误提示
    await waitFor(() => {
      expect(screen.getByText('请选择反馈类型')).toBeInTheDocument()
      expect(screen.getByText('请输入反馈内容')).toBeInTheDocument()
    })
  })

  test('图片上传大小限制', async () => {
    render(<FeedbackPage />)
    
    // 模拟大文件上传
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }) // 6MB
    
    const fileInput = screen.getByLabelText('上传图片')
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    // 验证错误提示
    await waitFor(() => {
      expect(screen.getByText('图片大小不能超过5MB')).toBeInTheDocument()
    })
  })

  test('提交按钮状态变化', async () => {
    render(<FeedbackPage />)
    
    // 初始状态
    const submitButton = screen.getByText('提交')
    expect(submitButton).toBeDisabled()
    
    // 填写表单
    const typeSelect = screen.getByLabelText('反馈类型')
    const contentInput = screen.getByLabelText('反馈内容')
    
    fireEvent.change(typeSelect, { target: { value: 'bug' } })
    fireEvent.change(contentInput, { target: { value: '测试反馈内容' } })
    
    // 验证按钮状态
    expect(submitButton).not.toBeDisabled()
  })

  // 异常情况测试
  test('网络断开时的提交处理', async () => {
    // 模拟网络离线
    ;(Network.getStatus as jest.Mock).mockResolvedValue({ connected: false })
    
    render(<FeedbackPage />)
    
    // 填写表单
    const typeSelect = screen.getByLabelText('反馈类型')
    const contentInput = screen.getByLabelText('反馈内容')
    
    fireEvent.change(typeSelect, { target: { value: 'bug' } })
    fireEvent.change(contentInput, { target: { value: '测试反馈内容' } })
    
    // 尝试提交
    const submitButton = screen.getByText('提交')
    fireEvent.click(submitButton)
    
    // 验证离线提示
    await waitFor(() => {
      expect(screen.getByText('当前网络不可用，请检查网络连接')).toBeInTheDocument()
    })
  })

  test('图片上传失败处理', async () => {
    render(<FeedbackPage />)
    
    // 模拟上传失败
    ;(Camera.getPhoto as jest.Mock).mockRejectedValue(new Error('上传失败'))
    
    // 触发图片上传
    const uploadButton = screen.getByText('上传图片')
    fireEvent.click(uploadButton)
    
    // 验证错误提示
    await waitFor(() => {
      expect(screen.getByText('图片上传失败，请重试')).toBeInTheDocument()
    })
  })

  // 性能测试
  test('图片上传时间', async () => {
    render(<FeedbackPage />)
    
    // 模拟图片上传
    const startTime = performance.now()
    ;(Camera.getPhoto as jest.Mock).mockResolvedValue({
      path: 'test.jpg',
      webPath: 'test.jpg'
    })
    
    const uploadButton = screen.getByText('上传图片')
    fireEvent.click(uploadButton)
    
    await waitFor(() => {
      expect(screen.getByAltText('已上传图片')).toBeInTheDocument()
    })
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(5000)
  })

  test('表单提交响应时间', async () => {
    render(<FeedbackPage />)
    
    // 填写表单
    const typeSelect = screen.getByLabelText('反馈类型')
    const contentInput = screen.getByLabelText('反馈内容')
    
    fireEvent.change(typeSelect, { target: { value: 'bug' } })
    fireEvent.change(contentInput, { target: { value: '测试反馈内容' } })
    
    // 记录提交时间
    const startTime = performance.now()
    const submitButton = screen.getByText('提交')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('提交成功')).toBeInTheDocument()
    })
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(1000)
  })
}) 