'use client';

import toast from 'react-hot-toast';

export const txToast = {
  success: (message: string) =>
    toast.success(message, {
      style: {
        background: '#0A2540',
        color: 'white',
        border: '1px solid #1E3A8A',
      },
      icon: '🎉',
    }),

  pending: (message: string) =>
    toast.loading(message, {
      style: {
        background: '#0A2540',
        color: 'white',
        border: '1px solid #2563EB',
      },
    }),

  error: (message: string) =>
    toast.error(message, {
      style: {
        background: '#0A2540',
        color: '#ff6b6b',
        border: '1px solid #7f1d1d',
      },
      icon: '❌',
    }),
};
