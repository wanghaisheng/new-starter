import React, { createContext, useContext, ReactNode, useMemo } from 'react';

export interface PermissionContextValue {
  permissions: string[];
  hasPermission: (perm: string) => boolean;
  setPermissions: (perms: string[]) => void;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const [permissions, setPermissions] = React.useState<string[]>([]);

  const hasPermission = (perm: string) => permissions.includes(perm);

  const value = useMemo(
    () => ({ permissions, hasPermission, setPermissions }),
    [permissions]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

export function usePermission(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('PermissionContext 未注入，请确保组件被 PermissionProvider 包裹');
  return ctx;
}
