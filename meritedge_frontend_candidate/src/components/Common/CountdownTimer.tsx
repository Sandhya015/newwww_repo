import React, { useState, useEffect } from 'react';
import { Button } from 'antd';

interface CountdownTimerProps {
  durationMinutes: number;
  onTimeUp?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  durationMinutes, 
  onTimeUp,
  className = "!bg-[#00ff0033] !border-none !text-[#3afd8b] !font-semibold"
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(durationMinutes * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState<boolean>(true);

  useEffect(() => {
    // Reset timer when duration changes
    setTimeRemaining(durationMinutes * 60);
    setIsRunning(true);
  }, [durationMinutes]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeRemaining, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getButtonClassName = (): string => {
    // Change color based on time remaining
    if (timeRemaining <= 300) { // Last 5 minutes
      return "!bg-[#ff000033] !border-none !text-[#ff6b6b] !font-semibold";
    } else if (timeRemaining <= 600) { // Last 10 minutes
      return "!bg-[#ffaa0033] !border-none !text-[#ffd93d] !font-semibold";
    }
    return className;
  };

  return (
    <Button shape="round" className={getButtonClassName()}>
      {formatTime(timeRemaining)}
    </Button>
  );
};

export default CountdownTimer;
