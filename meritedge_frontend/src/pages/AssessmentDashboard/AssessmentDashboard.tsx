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
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

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
    title: "Invited",
    value: "1234",
    subtitle: "this week",
    icon: <FileTextOutlined className="text-blue-500" />,
  },
  {
    title: "Attempted",
    value: "575",
    subtitle: "this week",
    icon: <UserOutlined className="text-green-500" />,
  },
  {
    title: "Cleared",
    value: "320",
    subtitle: "this week",
    icon: <ClockCircleOutlined className="text-orange-500" />,
  },
  {
    title: "Pending",
    value: "123",
    subtitle: "this week",
    icon: <CheckCircleOutlined className="text-purple-500" />,
  },
  {
    title: "Shortlisted",
    value: "8",
    subtitle: "this week",
    icon: <FileTextOutlined className="text-indigo-500" />,
  },

  {
    title: "Clearing Rate",
    value: "83.3%",
    subtitle: "this week",
    icon: <PlayCircleOutlined className="text-cyan-500" />,
  },
  {
    title: "Drop-off Rate",
    value: "12.8%",
    subtitle: "this week",
    icon: <FallOutlined className="text-red-500" />,
  },
  {
    title: "Avg Completion Time",
    value: "43 min 22 sec",
    subtitle: "this week",
    icon: <ClockCircleOutlined className="text-yellow-500" />,
  },
];

const mockTechnologyData: DomainData[] = [
  { domain: "JavaScript", invited: 0, attended: 2800, notAttended: 0 },
  { domain: "Python", invited: 0, attended: 2600, notAttended: 0 },
  { domain: "React", invited: 0, attended: 2200, notAttended: 0 },
  { domain: "Node.js", invited: 0, attended: 1200, notAttended: 0 },
  { domain: "Java", invited: 0, attended: 950, notAttended: 0 },
  { domain: "SQL", invited: 0, attended: 1400, notAttended: 0 },
  { domain: "TypeScript", invited: 0, attended: 650, notAttended: 0 },
  { domain: "Docker", invited: 0, attended: 800, notAttended: 0 },
];

const mockConceptsData: TestOutcomeData[] = [
  { name: "Data Structures", value: 4876, color: "#10B981" },
  { name: "Algorithms", value: 3200, color: "#3B82F6" },
  { name: "OOP Concepts", value: 2800, color: "#F59E0B" },
  { name: "System Design", value: 1565, color: "#EF4444" },
  { name: "Problem Solving", value: 4200, color: "#8B5CF6" },
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
        className="border border-solid w-full flex items-center p-4 sm:p-5 md:p-6 lg:p-[30px] overflow-hidden rounded-[12px] sm:rounded-[16px] md:rounded-[20px] justify-between relative"
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
        <div className="flex flex-col items-start grow gap-2 flex-1 relative z-10">
          {/* Title */}
          <div className="inline-flex items-center gap-2.5 flex-[0_0_auto] justify-start relative">
            <div
              className="[font-family:'Helvetica_Neue-Medium',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-sm opacity-80 font-medium leading-[24.1px] relative text-left"
              style={{ color: "var(--text-primary)" }}
            >
              {metric.title}
            </div>
          </div>

          {/* Value */}
          <div className="inline-flex items-end gap-2.5 flex-[0_0_auto] justify-start relative">
            <div
              className="[font-family:'Helvetica_Neue-Medium',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-[18px] font-medium leading-[24.1px] whitespace-nowrap relative text-left"
              style={{ color: "var(--text-primary)" }}
            >
              {metric.value}
            </div>
          </div>

          {/* Subtitle */}
          <div className="w-full flex self-stretch items-center gap-2.5 flex-[0_0_auto] justify-start relative">
            <div
              className="[font-family:'Helvetica_Neue-Regular',Helvetica] mt-[-1.00px] tracking-[0] text-[13px] opacity-50 flex-1 font-normal leading-[24.1px] relative text-left"
              style={{ color: "var(--text-secondary)" }}
            >
              {metric.subtitle}
            </div>
          </div>
        </div>

        {/* Icon stays on far right */}
        <div className="relative z-10">{metric.icon}</div>
      </div>
    </div>
  );
};

// Test Settings Panel Component
const TestSettingsPanel: React.FC<{ theme: string }> = ({ theme }) => (
  <div
    className="border border-solid flex-1 min-w-0 flex flex-col p-[20px] overflow-hidden rounded-[20px] relative"
    style={{
      background: "var(--bg-secondary)",
      borderColor: "var(--border-primary)",
      minHeight: "420px",
    }}
  >
    <div className="flex items-center gap-2 mb-6">
      <BarChartOutlined
        className="text-xl"
        style={{ color: theme === "dark" ? "#ffffff" : "var(--text-primary)" }}
      />
      <span
        className="font-medium text-lg"
        style={{ color: theme === "dark" ? "#ffffff" : "var(--text-primary)" }}
      >
        Test Settings
      </span>
    </div>

    <div className="flex flex-col gap-6 flex-1">
      {/* PROCTORING Section */}
      <div className="flex flex-col gap-5">
        <div
          className="font-medium text-base"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
          }}
        ></div>
        <div className="flex justify-between items-center">
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            Proctoring:
          </span>
          <span
            className="text-sm font-medium"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            }}
          >
            NA
          </span>
        </div>
      </div>

      {/* QUESTIONS POOLING Section */}
      <div className="flex flex-col gap-3">
        <div
          className="font-medium text-base"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
          }}
        >
          QUESTIONS POOLING
        </div>
        <div className="flex justify-between items-center">
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            Pooling:
          </span>
          <span
            className="text-sm font-medium"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            }}
          >
            Disabled
          </span>
        </div>
      </div>

      {/* QUESTIONS Section */}
      <div className="flex flex-col gap-3">
        <div
          className="font-medium text-base"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
          }}
        >
          QUESTIONS
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span
              className="text-sm opacity-70"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              Programming:
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              }}
            >
              2
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className="text-sm opacity-70"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              Subjective:
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              }}
            >
              1
            </span>
          </div>
        </div>
      </div>

      {/* SCORING Section */}
      <div className="flex flex-col gap-3">
        <div
          className="font-medium text-base"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
          }}
        >
          SCORING
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span
              className="text-sm opacity-70"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              Total Score:
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              }}
            >
              30
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className="text-sm opacity-70"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              Cut-off Score:
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              }}
            >
              50
            </span>
          </div>
        </div>
      </div>

      {/* SKILLS Section */}
      <div className="flex flex-col gap-3">
        <div
          className="font-medium text-base"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
          }}
        >
          SKILLS
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span
              className="text-sm opacity-70"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              JavaScript:
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              }}
            >
              Advanced
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className="text-sm opacity-70"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              React:
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              }}
            >
              Intermediate
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className="text-sm opacity-70"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              Node.js:
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              }}
            >
              Advanced
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className="text-sm opacity-70"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              Problem Solving:
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              }}
            >
              Expert
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Technologies Chart Component
const TechnologiesChart: React.FC<{ data: DomainData[]; theme: string }> = ({
  data,
  theme,
}) => (
  <div
    className="border border-solid flex-1 min-w-0 flex flex-col p-[20px] overflow-hidden rounded-[20px] relative"
    style={{
      background: "var(--bg-secondary)",
      borderColor: "var(--border-primary)",
      minHeight: "420px",
    }}
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <BarChartOutlined
          className="text-xl"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
          }}
        />
        <span
          className="font-medium text-lg"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
          }}
        >
          Skills
        </span>
      </div>
      <div
        className="text-sm opacity-70"
        style={{
          color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
        }}
      >
        Skill Assessment Results
      </div>
    </div>
    <div className="flex justify-end mb-4">
      <div
        className="text-sm opacity-70"
        style={{
          color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
        }}
      >
        All Technologies
      </div>
    </div>
    <div className="flex-1">
      <ResponsiveContainer width="100%" height={320}>
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
          <Bar dataKey="attended" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Technologies Details */}
    <div className="flex justify-center gap-4 mt-4 flex-wrap">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "#3B82F6" }}
          />
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            {item.domain} ({item.attended})
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Concepts Donut Chart Component
const ConceptsChart: React.FC<{ data: TestOutcomeData[]; theme: string }> = ({
  data,
  theme,
}) => (
  <div
    className="border border-solid flex-1 min-w-0 flex flex-col p-[20px] overflow-hidden rounded-[20px] relative"
    style={{
      background: "var(--bg-secondary)",
      borderColor: "var(--border-primary)",
      minHeight: "420px",
    }}
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <PieChartOutlined
          className="text-xl"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
          }}
        />
        <span
          className="font-medium text-lg"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
          }}
        >
          Concepts
        </span>
      </div>
      <div
        className="text-sm opacity-70"
        style={{
          color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
        }}
      >
        Programming Concepts
      </div>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <ResponsiveContainer width="100%" height={320}>
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
              backgroundColor:
                theme === "dark" ? "#1f2937" : "var(--bg-tertiary)",
              border: `1px solid ${
                theme === "dark" ? "#374151" : "var(--border-primary)"
              }`,
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              borderRadius: "8px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="flex justify-center gap-4 mt-4 flex-wrap">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            {item.name} ({item.value})
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Device Usage Chart Component
const DeviceUsageChart: React.FC<{ theme: string }> = ({ theme }) => {
  const deviceData = [
    { device: "Desktop", count: 1250, percentage: 65 },
    { device: "Mobile", count: 675, percentage: 35 },
  ];

  return (
    <div
      className="border border-solid flex-1 min-w-0 flex flex-col p-[20px] overflow-hidden rounded-[20px] relative"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
        minHeight: "320px",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChartOutlined
            className="text-xl"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            }}
          />
          <span
            className="font-medium text-lg"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            }}
          >
            Device Usage
          </span>
        </div>
        <div
          className="text-sm opacity-70"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
          }}
        >
          Test Platform
        </div>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={deviceData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-secondary)"
            />
            <XAxis
              dataKey="device"
              tick={{
                fill: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                fontSize: 12,
              }}
              axisLine={{ stroke: "var(--border-secondary)" }}
            />
            <YAxis
              tick={{
                fill: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                fontSize: 12,
              }}
              axisLine={{ stroke: "var(--border-secondary)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor:
                  theme === "dark" ? "#1f2937" : "var(--bg-tertiary)",
                border: `1px solid ${
                  theme === "dark" ? "#374151" : "var(--border-primary)"
                }`,
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                borderRadius: "8px",
              }}
              formatter={(value, name, props) => [
                `${value} candidates (${props.payload.percentage}%)`,
                "Count",
              ]}
            />
            <Bar dataKey="count">
              {deviceData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? "#3B82F6" : "#10B981"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Device Details */}
      <div className="flex justify-center gap-6 mt-4 flex-wrap">
        {deviceData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: index === 0 ? "#3B82F6" : "#10B981" }}
            />
            <span
              className="text-sm opacity-70"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              {item.device}: {item.count} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Consumptions Line Chart Component
const ConsumptionsChart: React.FC<{ theme: string }> = ({ theme }) => {
  const consumptionData = [
    {
      date: "Nov 26",
      dailyInvited: 45,
      dailyTaken: 38,
      monthlyInvited: 1200,
      monthlyTaken: 980,
    },
    {
      date: "Dec 1",
      dailyInvited: 52,
      dailyTaken: 44,
      monthlyInvited: 1350,
      monthlyTaken: 1120,
    },
    {
      date: "Jan 6",
      dailyInvited: 38,
      dailyTaken: 32,
      monthlyInvited: 980,
      monthlyTaken: 820,
    },
    {
      date: "Jan 29",
      dailyInvited: 65,
      dailyTaken: 58,
      monthlyInvited: 1650,
      monthlyTaken: 1420,
    },
    {
      date: "Feb 3",
      dailyInvited: 48,
      dailyTaken: 41,
      monthlyInvited: 1220,
      monthlyTaken: 1050,
    },
    {
      date: "Feb 9",
      dailyInvited: 72,
      dailyTaken: 65,
      monthlyInvited: 1820,
      monthlyTaken: 1580,
    },
  ];

  return (
    <div
      className="border border-solid flex-1 min-w-0 flex flex-col p-[20px] overflow-hidden rounded-[20px] relative"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
        minHeight: "320px",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChartOutlined
            className="text-xl"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            }}
          />
          <span
            className="font-medium text-lg"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            }}
          >
            Consumptions
          </span>
        </div>
        <div
          className="text-sm opacity-70"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
          }}
        >
          Daily & Monthly Trends
        </div>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={consumptionData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-secondary)"
            />
            <XAxis
              dataKey="date"
              tick={{
                fill: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                fontSize: 12,
              }}
              axisLine={{ stroke: "var(--border-secondary)" }}
            />
            <YAxis
              tick={{
                fill: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                fontSize: 12,
              }}
              axisLine={{ stroke: "var(--border-secondary)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor:
                  theme === "dark" ? "#1f2937" : "var(--bg-tertiary)",
                border: `1px solid ${
                  theme === "dark" ? "#374151" : "var(--border-primary)"
                }`,
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="dailyInvited"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="dailyTaken"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="monthlyInvited"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="monthlyTaken"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            Daily Invited
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500" />
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            Daily Taken
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-orange-500" />
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            Monthly Invited
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500" />
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            Monthly Taken
          </span>
        </div>
      </div>
    </div>
  );
};

// Average Completion Chart Component
const AverageCompletionChart: React.FC<{ theme: string }> = ({ theme }) => {
  const completionData = [
    {
      date: "Week 1",
      sameDay: 65,
      within1Day: 85,
      within3Days: 92,
      within7Days: 98,
    },
    {
      date: "Week 2",
      sameDay: 58,
      within1Day: 78,
      within3Days: 88,
      within7Days: 95,
    },
    {
      date: "Week 3",
      sameDay: 72,
      within1Day: 90,
      within3Days: 96,
      within7Days: 99,
    },
    {
      date: "Week 4",
      sameDay: 61,
      within1Day: 82,
      within3Days: 91,
      within7Days: 97,
    },
    {
      date: "Week 5",
      sameDay: 68,
      within1Day: 87,
      within3Days: 94,
      within7Days: 98,
    },
    {
      date: "Week 6",
      sameDay: 75,
      within1Day: 92,
      within3Days: 97,
      within7Days: 100,
    },
  ];

  return (
    <div
      className="border border-solid flex-1 min-w-0 flex flex-col p-[20px] overflow-hidden rounded-[20px] relative"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
        minHeight: "320px",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChartOutlined
            className="text-xl"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            }}
          />
          <span
            className="font-medium text-lg"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            }}
          >
            Average Completion
          </span>
        </div>
        <div
          className="text-sm opacity-70"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
          }}
        >
          Completion Timeline
        </div>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={completionData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-secondary)"
            />
            <XAxis
              dataKey="date"
              tick={{
                fill: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                fontSize: 12,
              }}
              axisLine={{ stroke: "var(--border-secondary)" }}
            />
            <YAxis
              tick={{
                fill: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                fontSize: 12,
              }}
              axisLine={{ stroke: "var(--border-secondary)" }}
              domain={[50, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor:
                  theme === "dark" ? "#1f2937" : "var(--bg-tertiary)",
                border: `1px solid ${
                  theme === "dark" ? "#374151" : "var(--border-primary)"
                }`,
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                borderRadius: "8px",
              }}
              formatter={(value, name) => [`${value}%`, name]}
            />
            <Line
              type="monotone"
              dataKey="sameDay"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Same Day"
            />
            <Line
              type="monotone"
              dataKey="within1Day"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Within 1 Day"
            />
            <Line
              type="monotone"
              dataKey="within3Days"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Within 3 Days"
            />
            <Line
              type="monotone"
              dataKey="within7Days"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Within 7 Days"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            Same Day
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500" />
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            Within 1 Day
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-orange-500" />
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            Within 3 Days
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500" />
          <span
            className="text-sm opacity-70"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            Within 7 Days
          </span>
        </div>
      </div>
    </div>
  );
};

// Score Distribution Chart Component
const ScoreDistributionChart: React.FC<{ theme: string }> = ({ theme }) => {
  const scoreData = [
    { range: "0-30", count: 120, percentage: 15 },
    { range: "30-60", count: 320, percentage: 40 },
    { range: "60-100", count: 360, percentage: 45 },
  ];

  const averageScore = 40; // Average score for highlighting
  const totalCandidates = 800;

  return (
    <div
      className="border border-solid flex-1 min-w-0 flex flex-col p-[20px] overflow-hidden rounded-[20px] relative"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
        minHeight: "320px",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChartOutlined
            className="text-xl"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            }}
          />
          <span
            className="font-medium text-lg"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            }}
          >
            Score Distribution
          </span>
        </div>
        <div
          className="text-sm opacity-70"
          style={{
            color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
          }}
        >
          Score Ranges
        </div>
      </div>

      <div className="flex gap-6 flex-1">
        {/* Chart */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={scoreData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-secondary)"
              />
              <XAxis
                dataKey="range"
                tick={{
                  fill: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                  fontSize: 12,
                }}
                axisLine={{ stroke: "var(--border-secondary)" }}
              />
              <YAxis
                tick={{
                  fill: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                  fontSize: 12,
                }}
                axisLine={{ stroke: "var(--border-secondary)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor:
                    theme === "dark" ? "#1f2937" : "var(--bg-tertiary)",
                  border: `1px solid ${
                    theme === "dark" ? "#374151" : "var(--border-primary)"
                  }`,
                  color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count">
                {scoreData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.range === "30-60"
                        ? "#3B82F6"
                        : entry.range === "0-30"
                        ? "#EF4444"
                        : "#10B981"
                    }
                  />
                ))}
              </Bar>
              {/* Average line */}
              <ReferenceLine
                x="30-60"
                stroke={
                  averageScore >= 30 && averageScore <= 60
                    ? "#FFD700"
                    : "#6B7280"
                }
                strokeWidth={3}
                strokeDasharray="5 5"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Details Panel */}
        <div className="w-48 flex flex-col gap-4">
          <div
            className="text-sm font-medium mb-2"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
            }}
          >
            Score Breakdown
          </div>

          {/* 0-30 Range */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span
                className="text-sm font-medium"
                style={{
                  color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                }}
              >
                0-30
              </span>
            </div>
            <div
              className="text-xs opacity-70 ml-5"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              120 candidates (15%)
            </div>
            {averageScore >= 0 && averageScore <= 30 && (
              <div
                className="text-xs font-medium ml-5"
                style={{ color: "#FFD700" }}
              >
                ← Average (40)
              </div>
            )}
          </div>

          {/* 30-60 Range */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span
                className="text-sm font-medium"
                style={{
                  color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                }}
              >
                30-60
              </span>
            </div>
            <div
              className="text-xs opacity-70 ml-5"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              320 candidates (40%)
            </div>
            {averageScore >= 30 && averageScore <= 60 && (
              <div
                className="text-xs font-medium ml-5"
                style={{ color: "#FFD700" }}
              >
                ← Average (40) ←
              </div>
            )}
          </div>

          {/* 60-100 Range */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span
                className="text-sm font-medium"
                style={{
                  color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                }}
              >
                60-100
              </span>
            </div>
            <div
              className="text-xs opacity-70 ml-5"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              360 candidates (45%)
            </div>
            {averageScore >= 60 && averageScore <= 100 && (
              <div
                className="text-xs font-medium ml-5"
                style={{ color: "#FFD700" }}
              >
                ← Average (40)
              </div>
            )}
          </div>

          {/* Total Summary */}
          <div
            className="border-t pt-3 mt-3"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <div
              className="text-xs font-medium mb-1"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              }}
            >
              Total Candidates: {totalCandidates}
            </div>
            <div
              className="text-xs font-medium"
              style={{
                color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              }}
            >
              Average Score: {averageScore}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { theme } = useTheme();
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
      style={{
        backgroundColor: "var(--bg-primary)",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div
        className="flex flex-col w-full items-start gap-1 pt-0 pb-2 sm:pb-[10px] px-0 relative border-b [border-bottom-style:solid]"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 self-stretch w-full items-start lg:items-center relative">
          <div className="flex w-full lg:w-auto justify-between lg:justify-start items-center relative">
            <div className="inline-flex gap-3 sm:gap-5 flex-[0_0_auto] items-center relative">
              <div className="inline-flex gap-3 sm:gap-4 flex-[0_0_auto] items-center relative">
                <div
                  className="relative w-fit mt-[-1.00px] [font-family:'Helvetica_Neue-Medium',Helvetica] font-medium text-lg sm:text-xl tracking-[0] leading-[normal] whitespace-nowrap"
                  style={{ color: "var(--text-primary)" }}
                >
                  Test Details
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

      {/* Test Details with Date Selector and Download */}
      <div className="mt-4 mb-6" style={{ position: "relative", zIndex: 30 }}>
        <div className="flex flex-col gap-3">
          {/* Test Name */}
          <div
            className="[font-family:'Helvetica_Neue-Medium',Helvetica] font-medium text-lg tracking-[0] leading-[24.1px]"
            style={{
              color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
              position: "relative",
              zIndex: 35,
            }}
          >
            JavaScript Fundamentals Assessment
          </div>

          {/* Test Details and Controls Row */}
          <div
            className="flex justify-between items-center flex-wrap gap-4"
            style={{ position: "relative", zIndex: 30 }}
          >
            {/* Left side - Test Details */}
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2">
                <span
                  className="[font-family:'Helvetica_Neue-Regular',Helvetica] text-sm opacity-70 tracking-[0] leading-[20px]"
                  style={{
                    color:
                      theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  Starts:
                </span>
                <span
                  className="[font-family:'Helvetica_Neue-Medium',Helvetica] text-sm font-medium tracking-[0] leading-[20px]"
                  style={{
                    color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  28-Aug-2025 06:30 PM
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="[font-family:'Helvetica_Neue-Regular',Helvetica] text-sm opacity-70 tracking-[0] leading-[20px]"
                  style={{
                    color:
                      theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  Ends:
                </span>
                <span
                  className="[font-family:'Helvetica_Neue-Medium',Helvetica] text-sm font-medium tracking-[0] leading-[20px]"
                  style={{
                    color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  29-Aug-2025 07:28 PM
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="[font-family:'Helvetica_Neue-Regular',Helvetica] text-sm opacity-70 tracking-[0] leading-[20px]"
                  style={{
                    color:
                      theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  Duration:
                </span>
                <span
                  className="[font-family:'Helvetica_Neue-Medium',Helvetica] text-sm font-medium tracking-[0] leading-[20px]"
                  style={{
                    color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  01:30
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="[font-family:'Helvetica_Neue-Regular',Helvetica] text-sm opacity-70 tracking-[0] leading-[20px]"
                  style={{
                    color:
                      theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  Cut-off:
                </span>
                <span
                  className="[font-family:'Helvetica_Neue-Medium',Helvetica] text-sm font-medium tracking-[0] leading-[20px]"
                  style={{
                    color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  50%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="[font-family:'Helvetica_Neue-Regular',Helvetica] text-sm opacity-70 tracking-[0] leading-[20px]"
                  style={{
                    color:
                      theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  Status:
                </span>
                <span
                  className="[font-family:'Helvetica_Neue-Medium',Helvetica] text-sm font-medium tracking-[0] leading-[20px]"
                  style={{
                    color: theme === "dark" ? "#ffffff" : "var(--text-primary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  Published
                </span>
              </div>
            </div>

            {/* Right side - Date Selector and Download */}
            <div className="flex items-center gap-4">
              {/* Date Range Selector */}
              <div className="flex items-center gap-2">
                <span
                  className="[font-family:'Helvetica_Neue-Regular',Helvetica] text-sm opacity-70 tracking-[0] leading-[20px]"
                  style={{
                    color:
                      theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  From:
                </span>
                <input
                  type="date"
                  className="px-3 py-1 rounded-md text-sm border"
                  style={{
                    backgroundColor: theme === "dark" ? "#374151" : "#ffffff",
                    borderColor: theme === "dark" ? "#6B7280" : "#D1D5DB",
                    color: theme === "dark" ? "#ffffff" : "#000000",
                    position: "relative",
                    zIndex: 35,
                  }}
                  defaultValue="2025-08-28"
                />
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="[font-family:'Helvetica_Neue-Regular',Helvetica] text-sm opacity-70 tracking-[0] leading-[20px]"
                  style={{
                    color:
                      theme === "dark" ? "#ffffff" : "var(--text-secondary)",
                    position: "relative",
                    zIndex: 35,
                  }}
                >
                  To:
                </span>
                <input
                  type="date"
                  className="px-3 py-1 rounded-md text-sm border"
                  style={{
                    backgroundColor: theme === "dark" ? "#374151" : "#ffffff",
                    borderColor: theme === "dark" ? "#6B7280" : "#D1D5DB",
                    color: theme === "dark" ? "#ffffff" : "#000000",
                    position: "relative",
                    zIndex: 35,
                  }}
                  defaultValue="2025-08-29"
                />
              </div>

              {/* Download Button */}
              <button
                className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: theme === "dark" ? "#3B82F6" : "#2563EB",
                  color: "#ffffff",
                  position: "relative",
                  zIndex: 35,
                }}
                onClick={() => {
                  // Download functionality would go here
                  console.log("Download dashboard data");
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 10L12 15L17 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15V3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Download
              </button>
            </div>
          </div>
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
        <TestSettingsPanel theme={theme} />
        <TechnologiesChart data={mockTechnologyData} theme={theme} />
        <ConceptsChart data={mockConceptsData} theme={theme} />
      </div>

      {/* Second Row - 4 Charts in 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4 sm:mt-6 w-full">
        <ScoreDistributionChart theme={theme} />
        <ConsumptionsChart theme={theme} />
        <AverageCompletionChart theme={theme} />
        <DeviceUsageChart theme={theme} />
      </div>
    </div>
  );
}
