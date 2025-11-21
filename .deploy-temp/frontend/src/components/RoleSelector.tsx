import React from 'react';
import type { UserRole } from '../types/index.ts';
import { useAppStore } from '../store/useAppStore';

interface RoleSelectorProps {
  className?: string;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ className = '' }) => {
  const { userRole, setUserRole } = useAppStore();

  const roles: { 
    value: UserRole; 
    label: string; 
    icon: string;
    color: string;
    activeColor: string;
    bgColor: string;
  }[] = [
    {
      value: 'ASD',
      label: 'ASD',
      icon: '🧩',
      color: 'text-primary-600',
      activeColor: 'bg-primary-200 border-primary-400',
      bgColor: 'hover:bg-primary-50'
    },
    {
      value: 'NT',
      label: 'NT',
      icon: '🧠',
      color: 'text-accent-600',
      activeColor: 'bg-accent-200 border-accent-400',
      bgColor: 'hover:bg-accent-50'
    },
    {
      value: 'UNCERTAIN',
      label: 'Uncertain',
      icon: '❓',
      color: 'text-neutral-600',
      activeColor: 'bg-neutral-200 border-neutral-400',
      bgColor: 'hover:bg-neutral-100'
    }
  ];

  return (
    <div className={`role-selector ${className}`}>
      <div className="flex items-center justify-center gap-4">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => setUserRole(role.value)}
            className={`
              group relative flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2 
              transition-all duration-200 min-w-[120px]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2
              ${userRole === role.value
                ? `${role.activeColor} shadow-md scale-105`
                : `bg-white border-neutral-200 ${role.bgColor} hover:shadow-sm hover:scale-102`
              }
            `}
            aria-pressed={userRole === role.value}
            aria-label={`Select identity: ${role.label}`}
          >
            <span className="text-3xl" aria-hidden="true">{role.icon}</span>
            <span className={`text-sm font-semibold ${userRole === role.value ? role.color : 'text-neutral-700'}`}>
              {role.label}
            </span>
            {userRole === role.value && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;
