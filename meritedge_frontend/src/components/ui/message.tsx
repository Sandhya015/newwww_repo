// Message utility to replace antd message
import toast from 'react-hot-toast';

export const message = {
  success: (content: string, duration?: number) => {
    toast.success(content, { duration: duration || 3000 });
  },
  error: (content: string, duration?: number) => {
    toast.error(content, { duration: duration || 5000 });
  },
  warning: (content: string, duration?: number) => {
    toast(content, { 
      icon: '⚠️',
      duration: duration || 4000,
      style: {
        background: '#faad14',
        color: '#fff',
      }
    });
  },
  info: (content: string, duration?: number) => {
    toast(content, { 
      icon: 'ℹ️',
      duration: duration || 4000,
      style: {
        background: '#1890ff',
        color: '#fff',
      }
    });
  },
  loading: (content: string) => {
    return toast.loading(content);
  },
};

