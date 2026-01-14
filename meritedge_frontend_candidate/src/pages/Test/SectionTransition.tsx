import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Layout } from 'antd';

const { Content } = Layout;

interface LocationState {
  nextSectionId?: string;
  nextSectionPath?: string;
  countdown?: number;
  isLastSection?: boolean;
}

const SectionTransition: React.FC = () => {
  const navigate = useNavigate();
  const { candidate_id } = useParams();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const initialCount = state?.countdown || 10;
  const nextSectionPath = state?.nextSectionPath || null;
  const isLastSection = state?.isLastSection || false;
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (count <= 0) {
      // Countdown finished, navigate to next section
      if (nextSectionPath) {
        console.log("🚀 Countdown finished, navigating to:", nextSectionPath);
        navigate(nextSectionPath, { replace: true });
      } else {
        // Fallback: navigate to test page
        navigate(`/${candidate_id}/test`, { replace: true });
      }
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, nextSectionPath, navigate, candidate_id]);

  // Calculate progress for circular progress (0 to 100)
  const progress = ((initialCount - count) / initialCount) * 100;
  const circumference = 2 * Math.PI * 90; // radius = 90
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Layout className="min-h-screen bg-[#0a0a0a]">
      <Content style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="flex flex-col items-center justify-center p-12">
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
      </Content>
    </Layout>
  );
};

export default SectionTransition;

