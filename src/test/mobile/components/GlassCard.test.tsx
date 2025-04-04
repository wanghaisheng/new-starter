import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GlassCard from '@/mobile/components/ui/GlassCard';

describe('GlassCard Component', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <div data-testid="test-child">Test Child Content</div>
      </GlassCard>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });
  
  it('applies default styling correctly', () => {
    render(
      <GlassCard>
        <div>Test Content</div>
      </GlassCard>
    );
    
    const glassCard = screen.getByText('Test Content').parentElement;
    expect(glassCard).toHaveClass('rounded-xl');
    
    // 检查内联样式是否正确应用
    expect(glassCard).toHaveStyle({
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      backgroundColor: 'rgba(17, 25, 40, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.125)',
    });
  });
  
  it('applies custom styling correctly', () => {
    render(
      <GlassCard 
        className="custom-class" 
        rounded="full" 
        opacity={50} 
        blur={8}
        border={false}
      >
        <div>Test Content</div>
      </GlassCard>
    );
    
    const glassCard = screen.getByText('Test Content').parentElement;
    expect(glassCard).toHaveClass('rounded-full');
    expect(glassCard).toHaveClass('custom-class');
    
    // 检查自定义内联样式是否正确应用
    expect(glassCard).toHaveStyle({
      backdropFilter: 'blur(8px) saturate(180%)',
      WebkitBackdropFilter: 'blur(8px) saturate(180%)',
      backgroundColor: 'rgba(17, 25, 40, 0.5)',
      border: 'none',
    });
  });
  
  it('handles click events correctly', () => {
    const mockOnClick = jest.fn();
    render(
      <GlassCard onClick={mockOnClick}>
        <div>Click Me</div>
      </GlassCard>
    );
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
  
  it('applies custom border color correctly', () => {
    render(
      <GlassCard borderColor="rgba(255, 0, 0, 0.5)">
        <div>Test Content</div>
      </GlassCard>
    );
    
    const glassCard = screen.getByText('Test Content').parentElement;
    expect(glassCard).toHaveStyle({
      border: '1px solid rgba(255, 0, 0, 0.5)',
    });
  });
}); 