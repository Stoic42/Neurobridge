import React from 'react';
import type { UserRole } from '../types/index.ts';
import { useAppStore } from '../store/useAppStore';

interface RoleSelectorProps {
  className?: string;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ className = '' }) => {
  const { userRole, setUserRole } = useAppStore();

  const roles: { value: UserRole; label: string; description: string; icon: string }[] = [
    {
      value: 'ASD',
      label: 'ASD',
      description: 'Autism Spectrum Disorder',
      icon: '🧩'
    },
    {
      value: 'NT',
      label: 'NT',
      description: 'Neurotypical',
      icon: '🧠'
    },
    {
      value: 'UNCERTAIN',
      label: 'Uncertain',
      description: 'Not sure',
      icon: '❓'
    }
  ];

  return (
    <div className={`role-selector ${className} bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-6`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">I identify as:</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => setUserRole(role.value)}
            className={`
              p-5 rounded-2xl border-2 transition-all duration-200 text-left bg-white/70 backdrop-blur-sm shadow-md border-white/40
              hover:shadow-lg hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              ${userRole === role.value
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'
                : 'hover:bg-white/80'
              }
            `}
            aria-pressed={userRole === role.value}
            aria-label={`Select role ${role.label}`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl" aria-hidden="true">{role.icon}</span>
              <div>
                <div className="font-semibold text-gray-800">{role.label}</div>
                <div className="text-sm text-gray-600">{role.description}</div>
              </div>
            </div>
            {userRole === role.value && (
              <div className="mt-2 text-sm text-blue-600 font-medium">
                ✓ Selected
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-md">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This helps the AI understand your communication style 
          and provide more accurate translations. You can change this anytime.
        </p>
      </div>
    </div>
  );
};

export default RoleSelector;
