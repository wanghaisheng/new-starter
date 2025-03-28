declare module 'bun:test' {
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => void | Promise<void>) => void;
  export const beforeEach: (fn: () => void | Promise<void>) => void;
  export const afterEach: (fn: () => void | Promise<void>) => void;
  
  export const expect: (actual: any) => {
    toBe: (expected: any) => void;
    toBeDefined: () => void;
    toBeNull: () => void;
    toEqual: (expected: any) => void;
    toHaveLength: (length: number) => void;
    toHaveBeenCalled: () => void;
    toHaveBeenCalledWith: (...args: any[]) => void;
    rejects: {
      toThrow: () => void;
    };
  };

  export const jest: {
    fn: () => jest.Mock;
  };

  export type Mock = {
    mockReturnValue: (value: any) => Mock;
    mockImplementation: (fn: (...args: any[]) => any) => Mock;
    mockResolvedValue: (value: any) => Mock;
    mockRejectedValue: (error: any) => Mock;
    mock: {
      calls: any[][];
    };
  };
} 