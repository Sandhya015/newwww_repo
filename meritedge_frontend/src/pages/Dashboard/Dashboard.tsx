import React, { useState } from "react";
import {
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FallOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

// Types for dashboard data
interface MetricCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

interface DomainData {
  domain: string;
  invited: number;
  attended: number;
  notAttended: number;
}

interface TestOutcomeData {
  name: string;
  value: number;
  color: string;
}

// Mock data - will be replaced with actual JSON data
const mockMetrics: MetricCard[] = [
  {
    title: "Total Test Created",
    value: "34",
    subtitle: "this week",
    icon: <FileTextOutlined className="text-blue-500" />,
  },
  {
    title: "Credits Assigned",
    value: "575",
    subtitle: "this week",
    icon: <UserOutlined className="text-green-500" />,
  },
  {
    title: "Credits Consumed",
    value: "200",
    subtitle: "currently consumed",
    icon: <ClockCircleOutlined className="text-orange-500" />,
  },
  {
    title: "Active Tests",
    value: "22",
    subtitle: "this week",
    icon: <CheckCircleOutlined className="text-purple-500" />,
  },
  {
    title: "Clearing Rate",
    value: "82.3%",
    subtitle: "this week",
    icon: <PlayCircleOutlined className="text-cyan-500" />,
  },
  {
    title: "Drop-off-Rate",
    value: "12.8%",
    subtitle: "this week",
    icon: <FallOutlined className="text-red-500" />,
  },
  {
    title: "Avg Completion Time",
    value: "42 min 22 sec",
    subtitle: "this week",
    icon: <ClockCircleOutlined className="text-yellow-500" />,
  },
  {
    title: "Most Used Test Type",
    value: "MCQ, Coding, Subjective",
    subtitle: "this week",
    icon: <FileTextOutlined className="text-indigo-500" />,
  },
];

const mockDomainData: DomainData[] = [
  {
    domain: "Frontend Engineering",
    invited: 3456,
    attended: 2800,
    notAttended: 456,
  },
  {
    domain: "Backend Engineering",
    invited: 3200,
    attended: 2600,
    notAttended: 400,
  },
  {
    domain: "Full Stack Development",
    invited: 2800,
    attended: 2200,
    notAttended: 350,
  },
  { domain: "DevOps", invited: 1500, attended: 1200, notAttended: 200 },
  { domain: "Cloud Computing", invited: 1200, attended: 950, notAttended: 150 },
  { domain: "Data Science", invited: 1800, attended: 1400, notAttended: 250 },
  { domain: "Cybersecurity", invited: 800, attended: 650, notAttended: 100 },
  { domain: "QA/Testing", invited: 1000, attended: 800, notAttended: 120 },
];

const mockTestOutcomeData: TestOutcomeData[] = [
  { name: "Passed", value: 4876, color: "#10B981" },
  { name: "Failed", value: 1287, color: "#EF4444" },
  { name: "Incomplete", value: 1565, color: "#3B82F6" },
];

// Metric Card Component
// Metric Card Component
const MetricCard: React.FC<{ metric: MetricCard }> = ({ metric }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className={`inline-flex items-start relative ${
        isHovered ? "shadow-[0px_14px_20px_#000000]" : ""
      }`}
      onMouseLeave={() => setIsHovered(false)}
      onMouseEnter={() => setIsHovered(true)}
    >
      <div
        className="border border-solid w-full flex items-center p-4 sm:p-5 md:p-6 lg:p-[25px] overflow-hidden rounded-[12px] sm:rounded-[16px] md:rounded-[20px] justify-between relative"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
        }}
      >
        <div
          className={`w-[136px] left-[189px] top-[-110px] blur-[57px] h-[136px] rounded-[68px] bg-blue-600 absolute ${
            isHovered ? "opacity-50" : "opacity-70"
          }`}
        />

        {/* Left side text container */}
        <div className="flex flex-col items-start grow gap-1.5 sm:gap-2 flex-1 relative z-10">
          {/* Title */}
          <div className="inline-flex items-center gap-2.5 flex-[0_0_auto] justify-start relative">
            <div
              className="[font-family:'Helvetica_Neue-Medium',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-xs sm:text-sm opacity-80 font-medium leading-tight sm:leading-[24.1px] relative text-left"
              style={{ color: "var(--text-primary)" }}
            >
              {metric.title}
            </div>
          </div>

          {/* Value */}
          <div className="inline-flex items-end gap-2.5 flex-[0_0_auto] justify-start relative">
            <div
              className="[font-family:'Helvetica_Neue-Medium',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-base sm:text-lg md:text-[18px] font-medium leading-tight sm:leading-[24.1px] whitespace-nowrap relative text-left"
              style={{ color: "var(--text-primary)" }}
            >
              {metric.value}
            </div>
          </div>

          {/* Subtitle */}
          <div className="w-full flex self-stretch items-center gap-2.5 flex-[0_0_auto] justify-start relative">
            <div
              className="[font-family:'Helvetica_Neue-Regular',Helvetica] mt-[-1.00px] tracking-[0] text-xs sm:text-[13px] opacity-50 flex-1 font-normal leading-tight sm:leading-[24.1px] relative text-left"
              style={{ color: "var(--text-secondary)" }}
            >
              {metric.subtitle}
            </div>
          </div>
        </div>

        {/* Icon stays on far right */}
        <div className="relative z-10 text-lg sm:text-xl md:text-2xl ml-2">
          {metric.icon}
        </div>
      </div>
    </div>
  );
};

// Participation Bar Chart Component
const PerformanceInsightsChart: React.FC = () => {
  const performanceData = [
    { metric: "Average Score", value: "78%", color: "#10B981" },
    { metric: "Highest Score", value: "95%", color: "#3B82F6" },
    { metric: "Lowest Score", value: "45%", color: "#EF4444" },
    { metric: "Median Score", value: "82%", color: "#8B5CF6" },
  ];

  return (
    <div
      className="border border-solid flex-1 min-w-0 flex flex-col p-3 sm:p-4 md:p-[20px] overflow-hidden rounded-[12px] sm:rounded-[16px] md:rounded-[20px] relative"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-2">
          <BarChartOutlined
            className="text-lg sm:text-xl"
            style={{ color: "var(--text-primary)" }}
          />
          <span
            className="font-medium text-base sm:text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            Performance Insights
          </span>
        </div>
        <div
          className="text-xs sm:text-sm opacity-70"
          style={{ color: "var(--text-secondary)" }}
        >
          Key Performance Indicators
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {performanceData.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-4 rounded-lg border border-solid"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-secondary)",
              }}
            >
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: item.color }}
              >
                {item.value}
              </div>
              <div
                className="text-sm text-center opacity-80"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.metric}
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        >
          <div
            className="text-xs sm:text-sm font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Performance Summary
          </div>
          <div
            className="text-[11px] sm:text-xs opacity-70"
            style={{ color: "var(--text-secondary)" }}
          >
            Strong performance with 78% average score. Majority of candidates
            (82% median) perform well above the threshold.
          </div>
        </div>
      </div>
    </div>
  );
};

// Domain Participation Chart Component
const DomainChart: React.FC<{ data: DomainData[] }> = ({ data }) => (
  <div
    className="border border-solid flex-1 min-w-0 flex flex-col p-3 sm:p-4 md:p-[20px] overflow-hidden rounded-[12px] sm:rounded-[16px] md:rounded-[20px] relative"
    style={{
      background: "var(--bg-secondary)",
      borderColor: "var(--border-primary)",
    }}
  >
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
      <div className="flex items-center gap-2">
        <BarChartOutlined
          className="text-lg sm:text-xl"
          style={{ color: "var(--text-primary)" }}
        />
        <span
          className="font-medium text-base sm:text-lg"
          style={{ color: "var(--text-primary)" }}
        >
          Test Breakout
        </span>
      </div>
      <div
        className="text-xs sm:text-sm opacity-70"
        style={{ color: "var(--text-secondary)" }}
      >
        Total {data.length} Domains
      </div>
    </div>
    <div className="flex justify-end mb-3 sm:mb-4">
      <div
        className="text-xs sm:text-sm opacity-70"
        style={{ color: "var(--text-secondary)" }}
      >
        All Domains
      </div>
    </div>
    <div className="flex-1">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-secondary)"
          />
          <XAxis
            dataKey="domain"
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border-secondary)" }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border-secondary)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
              borderRadius: "8px",
            }}
          />
          <Legend wrapperStyle={{ color: "var(--text-primary)" }} />
          <Bar dataKey="invited" stackId="a" fill="#3B82F6" name="Invited" />
          <Bar dataKey="attended" stackId="a" fill="#10B981" name="Attended" />
          <Bar
            dataKey="notAttended"
            stackId="a"
            fill="#F97316"
            name="Not Attended"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Test Outcome Donut Chart Component
const TestOutcomeChart: React.FC<{
  data: TestOutcomeData[];
  totalCandidates: number;
}> = ({ data, totalCandidates }) => (
  <div
    className="border border-solid flex-1 min-w-0 flex flex-col p-3 sm:p-4 md:p-[20px] overflow-hidden rounded-[12px] sm:rounded-[16px] md:rounded-[20px] relative"
    style={{
      background: "var(--bg-secondary)",
      borderColor: "var(--border-primary)",
    }}
  >
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
      <div className="flex items-center gap-2">
        <PieChartOutlined
          className="text-lg sm:text-xl"
          style={{ color: "var(--text-primary)" }}
        />
        <span
          className="font-medium text-base sm:text-lg"
          style={{ color: "var(--text-primary)" }}
        >
          Test Outcome Distribution
        </span>
      </div>
      <div
        className="text-xs sm:text-sm opacity-70"
        style={{ color: "var(--text-secondary)" }}
      >
        All Domains
      </div>
    </div>
    <div className="text-center mb-3 sm:mb-4">
      <div
        className="text-xs sm:text-sm opacity-70"
        style={{ color: "var(--text-secondary)" }}
      >
        From 34 tests taken by {totalCandidates.toLocaleString()} candidates.
      </div>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
              borderRadius: "8px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="flex justify-center mt-3 sm:mt-4">
      <div
        className="text-xl sm:text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        {totalCandidates.toLocaleString()}
      </div>
    </div>
    <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4 flex-wrap">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5 sm:gap-2">
          <div
            className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span
            className="text-xs sm:text-sm opacity-70"
            style={{ color: "var(--text-secondary)" }}
          >
            {item.name} ({item.value})
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Monthly Performance Trends Chart Component
const MonthlyPerformanceChart: React.FC = () => {
  const performanceData = [
    {
      date: "Nov 26",
      testsCreated: 45,
      testsCompleted: 38,
      passRate: 84,
      avgScore: 72,
    },
    {
      date: "Dec 1",
      testsCreated: 52,
      testsCompleted: 44,
      passRate: 85,
      avgScore: 75,
    },
    {
      date: "Jan 6",
      testsCreated: 38,
      testsCompleted: 32,
      passRate: 84,
      avgScore: 70,
    },
    {
      date: "Jan 29",
      testsCreated: 65,
      testsCompleted: 58,
      passRate: 89,
      avgScore: 78,
    },
    {
      date: "Feb 3",
      testsCreated: 48,
      testsCompleted: 41,
      passRate: 85,
      avgScore: 74,
    },
    {
      date: "Feb 9",
      testsCreated: 72,
      testsCompleted: 65,
      passRate: 90,
      avgScore: 80,
    },
  ];

  return (
    <div
      className="border border-solid flex-1 min-w-0 flex flex-col p-3 sm:p-4 md:p-[20px] overflow-hidden rounded-[12px] sm:rounded-[16px] md:rounded-[20px] relative"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-2">
          <BarChartOutlined
            className="text-lg sm:text-xl"
            style={{ color: "var(--text-primary)" }}
          />
          <span
            className="font-medium text-base sm:text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            Monthly Performance
          </span>
        </div>
        <div
          className="text-xs sm:text-sm opacity-70"
          style={{ color: "var(--text-secondary)" }}
        >
          Performance Trends
        </div>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={performanceData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-secondary)"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border-secondary)" }}
            />
            <YAxis
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border-secondary)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="testsCreated"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Tests Created"
            />
            <Line
              type="monotone"
              dataKey="testsCompleted"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Tests Completed"
            />
            <Line
              type="monotone"
              dataKey="passRate"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Pass Rate %"
            />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Average Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 sm:w-3 h-0.5 bg-blue-500" />
          <span
            className="text-xs sm:text-sm opacity-70"
            style={{ color: "var(--text-secondary)" }}
          >
            Tests Created
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 sm:w-3 h-0.5 bg-green-500" />
          <span
            className="text-xs sm:text-sm opacity-70"
            style={{ color: "var(--text-secondary)" }}
          >
            Tests Completed
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 sm:w-3 h-0.5 bg-orange-500" />
          <span
            className="text-xs sm:text-sm opacity-70"
            style={{ color: "var(--text-secondary)" }}
          >
            Pass Rate %
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 sm:w-3 h-0.5 bg-red-500" />
          <span
            className="text-xs sm:text-sm opacity-70"
            style={{ color: "var(--text-secondary)" }}
          >
            Average Score
          </span>
        </div>
      </div>
    </div>
  );
};

// Recent Tests Component
const RecentTestsChart: React.FC = () => {
  const recentTests = [
    {
      name: "Frontend Development",
      type: "Coding",
      participants: 245,
      status: "Active",
      time: "2h ago",
      color: "#3B82F6",
    },
    {
      name: "Backend Engineering",
      type: "System Design",
      participants: 189,
      status: "Completed",
      time: "4h ago",
      color: "#10B981",
    },
    {
      name: "JavaScript Fundamentals",
      type: "MCQ",
      participants: 320,
      status: "Active",
      time: "6h ago",
      color: "#F59E0B",
    },
    {
      name: "Data Structures & Algorithms",
      type: "Coding",
      participants: 156,
      status: "Draft",
      time: "1d ago",
      color: "#EF4444",
    },
    {
      name: "React Advanced Concepts",
      type: "Subjective",
      participants: 278,
      status: "Active",
      time: "2d ago",
      color: "#8B5CF6",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "#10B981";
      case "Completed":
        return "#3B82F6";
      case "Draft":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  return (
    <div
      className="border border-solid flex-1 min-w-0 flex flex-col p-3 sm:p-4 md:p-[20px] overflow-hidden rounded-[12px] sm:rounded-[16px] md:rounded-[20px] relative"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-2">
          <FileTextOutlined
            className="text-lg sm:text-xl"
            style={{ color: "var(--text-primary)" }}
          />
          <span
            className="font-medium text-base sm:text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            Recent Tests
          </span>
        </div>
        <div
          className="text-xs sm:text-sm opacity-70"
          style={{ color: "var(--text-secondary)" }}
        >
          Latest Activities
        </div>
      </div>

      <div className="flex-1 space-y-2 sm:space-y-3 overflow-y-auto">
        {recentTests.map((test, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-secondary)",
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {/* Test Type Icon */}
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0"
                style={{ backgroundColor: test.color }}
              >
                {test.type === "Coding"
                  ? "C"
                  : test.type === "MCQ"
                  ? "M"
                  : test.type === "System Design"
                  ? "S"
                  : "R"}
              </div>

              {/* Test Info */}
              <div className="flex-1 min-w-0">
                <div
                  className="font-medium text-xs sm:text-sm truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {test.name}
                </div>
                <div
                  className="text-[10px] sm:text-xs opacity-70 truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {test.type} • {test.participants} participants
                </div>
              </div>
            </div>

            {/* Status and Time */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium"
                style={{
                  backgroundColor: getStatusColor(test.status) + "20",
                  color: getStatusColor(test.status),
                }}
              >
                {test.status}
              </div>
              <div
                className="text-[10px] sm:text-xs opacity-50"
                style={{ color: "var(--text-secondary)" }}
              >
                {test.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex justify-between items-center">
          <div
            className="text-[10px] sm:text-xs opacity-70"
            style={{ color: "var(--text-secondary)" }}
          >
            Total: 5 recent tests
          </div>
          <div
            className="text-[10px] sm:text-xs font-medium cursor-pointer hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            View All →
          </div>
        </div>
      </div>
    </div>
  );
};

// Usage Trends Chart Component
const UsageMetricsChart: React.FC = () => {
  const usageTrendsData = [
    { month: "Oct", totalInvited: 12, completed: 8, shortlisted: 2 },
    { month: "Nov", totalInvited: 18, completed: 14, shortlisted: 3 },
    { month: "Dec", totalInvited: 25, completed: 20, shortlisted: 4 },
    { month: "Jan", totalInvited: 32, completed: 26, shortlisted: 5 },
    { month: "Feb", totalInvited: 45, completed: 38, shortlisted: 7 },
    { month: "Mar", totalInvited: 62, completed: 52, shortlisted: 9 },
    { month: "Apr", totalInvited: 78, completed: 65, shortlisted: 12 },
    { month: "May", totalInvited: 165, completed: 142, shortlisted: 28 },
    { month: "Jun", totalInvited: 89, completed: 74, shortlisted: 15 },
    { month: "Jul", totalInvited: 62, completed: 53, shortlisted: 8 },
    { month: "Aug", totalInvited: 48, completed: 41, shortlisted: 6 },
    { month: "Sep", totalInvited: 35, completed: 29, shortlisted: 4 },
  ];

  return (
    <div
      className="border border-solid flex-1 min-w-0 flex flex-col p-3 sm:p-4 md:p-[20px] overflow-hidden rounded-[12px] sm:rounded-[16px] md:rounded-[20px] relative"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-2">
          <BarChartOutlined
            className="text-lg sm:text-xl"
            style={{ color: "var(--text-primary)" }}
          />
          <span
            className="font-medium text-base sm:text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            Usage Trends
          </span>
        </div>
        <div
          className="text-xs sm:text-sm opacity-70"
          style={{ color: "var(--text-secondary)" }}
        >
          Monthly Metrics
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-blue-600" />
          <span
            className="text-xs sm:text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Total Invited
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-600" />
          <span
            className="text-xs sm:text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Completed
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-teal-500" />
          <span
            className="text-xs sm:text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Shortlisted
          </span>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={usageTrendsData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-secondary)"
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border-secondary)" }}
            />
            <YAxis
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border-secondary)" }}
              domain={[0, 200]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="totalInvited"
              stroke="#2563EB"
              strokeWidth={3}
              dot={{ fill: "#2563EB", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
              name="Total Invited"
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#DC2626"
              strokeWidth={3}
              dot={{ fill: "#DC2626", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
              name="Completed"
            />
            <Line
              type="monotone"
              dataKey="shortlisted"
              stroke="#14B8A6"
              strokeWidth={3}
              dot={{ fill: "#14B8A6", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
              name="Shortlisted"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("Today");

  const timePeriods = [
    "Today",
    "Yesterday",
    "This Week",
    "Last Week",
    "This Month",
    "Last Month",
    "Custom Date",
  ];

  return (
    <div
      className="pt-1 pb-4 space-y-3 sm:space-y-4 max-w-full overflow-x-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Header */}
      <div
        className="flex flex-col w-full items-start gap-1 pt-0 pb-2 sm:pb-[10px] px-0 relative border-b [border-bottom-style:solid]"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex flex-col justify-between lg:flex-row gap-4 lg:gap-6 self-stretch w-full items-start lg:items-center relative">
          <div className="flex w-full lg:w-auto justify-between lg:justify-start items-center relative">
            <div className="inline-flex gap-3 sm:gap-5 flex-[0_0_auto] items-center relative">
              <div className="inline-flex gap-3 sm:gap-4 flex-[0_0_auto] items-center relative">
                <div
                  className="relative w-fit mt-[-1.00px] [font-family:'Helvetica_Neue-Medium',Helvetica] font-medium text-lg sm:text-xl tracking-[0] leading-[normal] whitespace-nowrap"
                  style={{ color: "var(--text-primary)" }}
                >
                  Dashboard
                </div>
              </div>
            </div>
          </div>

          <div
            className="inline-flex gap-1 p-1 flex-[0_0_auto] rounded-[60px] items-center relative overflow-x-auto w-full lg:w-auto"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <div className="flex gap-1 min-w-max">
              {timePeriods.map((period) => (
                <div
                  key={period}
                  className="flex min-w-[80px] sm:w-[100px] justify-center gap-[10px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-[80px] backdrop-blur-[15px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(15px)_brightness(100%)] items-center relative cursor-pointer"
                  style={{
                    backgroundColor:
                      selectedPeriod === period
                        ? "var(--accent-primary)"
                        : "var(--bg-secondary)",
                  }}
                  onClick={() => setSelectedPeriod(period)}
                >
                  <div
                    className="relative w-fit mt-[-1.00px] [font-family:'Helvetica_Neue-Regular',Helvetica] font-normal text-[11px] sm:text-xs tracking-[0] leading-[20px] whitespace-nowrap"
                    style={{
                      color:
                        selectedPeriod === period
                          ? "#ffffff"
                          : "var(--text-primary)",
                    }}
                  >
                    {period}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle below partition line */}
      <div className="mt-2 mb-3 sm:mb-4">
        <div
          className="[font-family:'Helvetica_Neue-Regular',Helvetica] font-normal text-sm sm:text-base md:text-lg opacity-70 tracking-[0] leading-tight sm:leading-[24.1px]"
          style={{ color: "var(--text-secondary)" }}
        >
          Test Performance Overview - Track overall test health and engagement
          trends at a glance.
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
        {mockMetrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="flex flex-col lg:flex-row gap-3 justify-center items-stretch w-full">
        <UsageMetricsChart />
        <DomainChart data={mockDomainData} />
        <TestOutcomeChart data={mockTestOutcomeData} totalCandidates={6575} />
      </div>

      {/* Second Row - 3 New Charts */}
      <div className="flex flex-col lg:flex-row gap-3 justify-center items-stretch mt-4 sm:mt-6 w-full">
        <MonthlyPerformanceChart />
        <PerformanceInsightsChart />
        <RecentTestsChart />
      </div>
    </div>
  );
}
