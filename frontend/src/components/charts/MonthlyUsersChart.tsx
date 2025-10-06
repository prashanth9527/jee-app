'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyUsersData {
  month: string;
  users: number;
  date: string;
}

export default function MonthlyUsersChart() {
  const [data, setData] = useState<MonthlyUsersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const response = await api.get('/admin/analytics/monthly-users?months=12');
        setData(response.data);
      } catch (error: any) {
        console.error('Error fetching monthly users data:', error);
        setError(error.response?.data?.message || 'Failed to load monthly users data');
        
        // Fallback to mock data
        const mockData: MonthlyUsersData[] = [
          { month: 'Jan 2024', users: 12, date: '2024-01-01T00:00:00.000Z' },
          { month: 'Feb 2024', users: 19, date: '2024-02-01T00:00:00.000Z' },
          { month: 'Mar 2024', users: 15, date: '2024-03-01T00:00:00.000Z' },
          { month: 'Apr 2024', users: 25, date: '2024-04-01T00:00:00.000Z' },
          { month: 'May 2024', users: 22, date: '2024-05-01T00:00:00.000Z' },
          { month: 'Jun 2024', users: 30, date: '2024-06-01T00:00:00.000Z' },
          { month: 'Jul 2024', users: 28, date: '2024-07-01T00:00:00.000Z' },
          { month: 'Aug 2024', users: 35, date: '2024-08-01T00:00:00.000Z' },
          { month: 'Sep 2024', users: 42, date: '2024-09-01T00:00:00.000Z' },
          { month: 'Oct 2024', users: 38, date: '2024-10-01T00:00:00.000Z' },
          { month: 'Nov 2024', users: 45, date: '2024-11-01T00:00:00.000Z' },
          { month: 'Dec 2024', users: 52, date: '2024-12-01T00:00:00.000Z' },
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
        label: 'New Users',
        data: data.map(item => item.users),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly New Users',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `New Users: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
