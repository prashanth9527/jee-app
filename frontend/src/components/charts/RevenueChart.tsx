'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueData {
  month: string;
  revenue: number;
  transactions: number;
  newSubscriptions: number;
  date: string;
}

export default function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const response = await api.get('/admin/analytics/revenue?months=12');
        setData(response.data);
      } catch (error: any) {
        console.error('Error fetching revenue data:', error);
        setError(error.response?.data?.message || 'Failed to load revenue data');
        
        // Fallback to mock data
        const mockData: RevenueData[] = [
          { month: 'Jan 2024', revenue: 1250, transactions: 8, newSubscriptions: 5, date: '2024-01-01T00:00:00.000Z' },
          { month: 'Feb 2024', revenue: 1890, transactions: 12, newSubscriptions: 8, date: '2024-02-01T00:00:00.000Z' },
          { month: 'Mar 2024', revenue: 1450, transactions: 9, newSubscriptions: 6, date: '2024-03-01T00:00:00.000Z' },
          { month: 'Apr 2024', revenue: 2200, transactions: 14, newSubscriptions: 10, date: '2024-04-01T00:00:00.000Z' },
          { month: 'May 2024', revenue: 1980, transactions: 13, newSubscriptions: 9, date: '2024-05-01T00:00:00.000Z' },
          { month: 'Jun 2024', revenue: 2750, transactions: 18, newSubscriptions: 12, date: '2024-06-01T00:00:00.000Z' },
          { month: 'Jul 2024', revenue: 2600, transactions: 17, newSubscriptions: 11, date: '2024-07-01T00:00:00.000Z' },
          { month: 'Aug 2024', revenue: 3200, transactions: 21, newSubscriptions: 14, date: '2024-08-01T00:00:00.000Z' },
          { month: 'Sep 2024', revenue: 3800, transactions: 25, newSubscriptions: 16, date: '2024-09-01T00:00:00.000Z' },
          { month: 'Oct 2024', revenue: 3450, transactions: 23, newSubscriptions: 15, date: '2024-10-01T00:00:00.000Z' },
          { month: 'Nov 2024', revenue: 4200, transactions: 28, newSubscriptions: 18, date: '2024-11-01T00:00:00.000Z' },
          { month: 'Dec 2024', revenue: 4850, transactions: 32, newSubscriptions: 21, date: '2024-12-01T00:00:00.000Z' },
        ];
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: data.map(item => item.revenue),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Transactions',
        data: data.map(item => item.transactions),
        borderColor: 'rgba(168, 85, 247, 1)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgba(168, 85, 247, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Revenue & Transactions',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (context.datasetIndex === 0) {
              return `Revenue: ₹${context.parsed.y.toLocaleString()}`;
            } else {
              return `Transactions: ${context.parsed.y}`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '₹' + value.toLocaleString();
          }
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            {error}. Showing sample data.
          </p>
        </div>
      )}
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
