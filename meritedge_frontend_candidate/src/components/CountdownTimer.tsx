import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';

interface CountdownTimerProps {
  visible: boolean;
  onComplete: () => void;
  initialCount?: number;
  isLastSection?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  visible, 
  onComplete, 
  initialCount = 10,
  isLastSection = false
}) => {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (!visible) {
      setCount(initialCount);
      return;
    }

    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, visible, onComplete, initialCount]);

  if (!visible) return null;

  // Calculate progress for circular progress (0 to 100)
  const progress = ((initialCount - count) / initialCount) * 100;
  const circumference = 2 * Math.PI * 90; // radius = 90
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Modal
      open={visible}
      closable={false}
      footer={null}
      centered
      width={400}
      styles={{
        body: { padding: 0 },
        content: { backgroundColor: '#0a0a0a', borderRadius: '20px' },
        mask: { backgroundColor: 'rgba(0, 0, 0, 0.85)' },
      }}
    >
      <div className="flex flex-col items-center justify-center p-12 bg-[#0a0a0a]">
        <div className="relative w-48 h-48 mb-8">
          {/* Circular Progress Background */}
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="96"
              cy="96"
              r="90"
              stroke="#1f2937"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="90"
              stroke="#7C3AED"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Countdown Number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-bold text-[#7C3AED]">
              {count}
            </span>
          </div>
        </div>
        
        <p className="text-white text-xl font-semibold">
          {count > 0 ? 'Preparing next section...' : 'Redirecting...'}
        </p>
        {isLastSection && (
          <p className="text-white/70 text-sm mt-4 text-center max-w-[300px]">
            This is the last section of this assessment. Once you are done with answering all the questions, you can submit the assessment.Submission may take few minutes wait until you get the final submission confirmation
          </p>
        )}
      </div>
    </Modal>
  );
};

export default CountdownTimer;

