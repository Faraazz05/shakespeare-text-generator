import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface Props {
  trainLosses: number[];
  valLosses: number[];
}

const LossChart = ({ trainLosses, valLosses }: Props) => {
  const labels = trainLosses.map((_, i) => `${i + 1}`);

  const data = {
    labels,
    datasets: [
      {
        label: 'Train Loss',
        data: trainLosses,
        borderColor: 'hsl(217, 91%, 60%)',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: 'Val Loss',
        data: valLosses,
        borderColor: 'hsl(38, 92%, 50%)',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Epoch', color: '#64748b' },
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' },
      },
      y: {
        title: { display: true, text: 'Loss', color: '#64748b' },
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' },
      },
    },
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4" style={{ height: 320 }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default LossChart;
