import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Title,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { TopToken } from '@/api/explain';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Title);

const ImportanceChart = ({ topTokens }: { topTokens: TopToken[] }) => {
  const sorted = [...topTokens].sort((a, b) => b.importance - a.importance);

  const data = {
    labels: sorted.map((t) => t.token),
    datasets: [
      {
        data: sorted.map((t) => t.importance),
        backgroundColor: 'hsl(271, 81%, 56%)',
        borderRadius: 4,
        barThickness: 20,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        min: 0,
        max: 1,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#e2e8f0', font: { family: 'JetBrains Mono', size: 11 } },
      },
    },
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4" style={{ height: Math.max(200, sorted.length * 32 + 40) }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default ImportanceChart;
