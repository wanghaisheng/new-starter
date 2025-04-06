import { LinkProps as NextLinkProps } from 'next/link';
import Link from 'next/link';
import { cn } from '@/core/utils/cn';

interface LinkProps extends NextLinkProps {
  className?: string;
  children: React.ReactNode;
}

export const CustomLink = ({ className, children, ...props }: LinkProps) => {
  return (
    <Link
      className={cn(
        'text-blue-600 hover:text-blue-800 hover:underline',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}; 