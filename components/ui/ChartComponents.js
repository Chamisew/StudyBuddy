import { useEffect, useState } from 'react';
import { Dimensions, View } from 'react-native';

// Web environment detection
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

// Conditional chart imports based on platform
let ChartComponent;
let ChartJS;
if (isWeb) {
  // Web: Use Chart.js
  ChartJS = require('chart.js');
  // Register necessary components
  if (typeof window !== 'undefined') {
    ChartJS.Chart.register(
      ChartJS.CategoryScale,
      ChartJS.LinearScale,
      ChartJS.PointElement,
      ChartJS.LineElement,
      ChartJS.BarElement,
      ChartJS.Title,
      ChartJS.Tooltip,
      ChartJS.Legend,
      ChartJS.Filler,
      ChartJS.ArcElement
    );
  }
  ChartComponent = require('react-chartjs-2');
} else {
  // Mobile: Use react-native-chart-kit
  ChartComponent = { 
    BarChart: require('react-native-chart-kit').BarChart,
    LineChart: require('react-native-chart-kit').LineChart,
    PieChart: require('react-native-chart-kit').PieChart
  };
}

// Chart configuration constants
const CHART_HEIGHT = 150;
const CHART_WIDTH = Dimensions.get('window').width * 0.9;

// Web chart options
const webChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#333',
        font: {
          size: 10
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#6366f1',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      type: 'category',
      ticks: {
        color: '#666',
        font: {
          size: 10
        }
      },
      grid: {
        display: false
      }
    },
    y: {
      type: 'linear',
      ticks: {
        color: '#666',
        font: {
          size: 10
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    }
  }
};

// Mobile chart configuration
const mobileChartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: '#fff',
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#6366f1'
  }
};

// Chart components
export const UserGrowthChart = ({ users }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!users || users.length === 0) return;

    // Calculate user growth data (last 30 days)
    const now = new Date();
    const dates = [];
    const userCounts = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
      
      const count = users.filter(user => {
        const joinDate = user.createdAt?.toDate?.() || user.joinDate?.toDate?.() || new Date(0);
        return joinDate <= date;
      }).length;
      
      userCounts.push(count);
    }

    if (isWeb) {
      setChartData({
        labels: dates,
        datasets: [
          {
            label: 'Total Users',
            data: userCounts,
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: '#6366f1',
            tension: 0.4,
            pointRadius: 2
          }
        ]
      });
    } else {
      setChartData({
        labels: dates.map(d => d.slice(5)), // Show only MM-DD
        datasets: [{ data: userCounts }]
      });
    }
  }, [users]);

  if (!chartData) return null;

  if (isWeb) {
    return (
      <View style={{ height: CHART_HEIGHT, width: '100%' }}>
        <ChartComponent.Line 
          data={chartData} 
          options={{
            ...webChartOptions,
            plugins: {
              ...webChartOptions.plugins,
              title: {
                display: true,
                text: 'User Growth (30 Days)',
                color: '#333',
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            }
          }} 
        />
      </View>
    );
  } else {
    return (
      <ChartComponent.LineChart
        data={chartData}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        chartConfig={mobileChartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
        withShadow={false}
        withInnerLines={false}
        yAxisLabel=""
        yAxisSuffix=""
        yAxisInterval={1}
        fromZero
      />
    );
  }
};

export const ContentDistributionChart = ({ resources, videos }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!resources || !videos) return;

    const subjectCounts = {};
    
    // Count resources by subject
    resources.forEach(resource => {
      const subject = resource.subject || 'Uncategorized';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });
    
    // Count videos by subject
    videos.forEach(video => {
      const subject = video.subject || 'Uncategorized';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });

    const subjects = Object.keys(subjectCounts);
    const counts = Object.values(subjectCounts);

    if (isWeb) {
      setChartData({
        labels: subjects,
        datasets: [
          {
            label: 'Content Items',
            data: counts,
            backgroundColor: [
              'rgba(99, 102, 241, 0.7)',
              'rgba(16, 185, 129, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(139, 92, 246, 0.7)',
              'rgba(236, 72, 153, 0.7)',
              'rgba(59, 130, 246, 0.7)'
            ],
            borderColor: [
              'rgba(99, 102, 241, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(139, 92, 246, 1)',
              'rgba(236, 72, 153, 1)',
              'rgba(59, 130, 246, 1)'
            ],
            borderWidth: 1
          }
        ]
      });
    } else {
      // For mobile pie chart, we need a different format
      const pieData = subjects.map((subject, index) => ({
        name: subject.length > 10 ? subject.substring(0, 10) + '...' : subject,
        population: counts[index],
        color: [
          '#6366f1',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899',
          '#3b82f6'
        ][index % 6],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }));
      
      setChartData(pieData);
    }
  }, [resources, videos]);

  if (!chartData) return null;

  if (isWeb) {
    return (
      <View style={{ height: CHART_HEIGHT, width: '100%' }}>
        <ChartComponent.Bar 
          data={chartData} 
          options={{
            ...webChartOptions,
            plugins: {
              ...webChartOptions.plugins,
              title: {
                display: true,
                text: 'Content Distribution by Subject',
                color: '#333',
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            },
            scales: {
              ...webChartOptions.scales,
              x: {
                ...webChartOptions.scales.x,
                ticks: {
                  ...webChartOptions.scales.x.ticks,
                  autoSkip: false,
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            }
          }} 
        />
      </View>
    );
  } else {
    return (
      <ChartComponent.PieChart
        data={chartData}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        chartConfig={mobileChartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    );
  }
};

export const UserRoleChart = ({ users, tutors }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!users) return;

    const totalUsers = users.length;
    const totalTutors = tutors ? tutors.length : 0;
    const totalStudents = totalUsers - totalTutors;

    if (isWeb) {
      setChartData({
        labels: ['Students', 'Tutors'],
        datasets: [
          {
            label: 'User Roles',
            data: [totalStudents, totalTutors],
            backgroundColor: [
              'rgba(16, 185, 129, 0.7)',
              'rgba(99, 102, 241, 0.7)'
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(99, 102, 241, 1)'
            ],
            borderWidth: 1
          }
        ]
      });
    } else {
      setChartData([
        {
          name: 'Students',
          population: totalStudents,
          color: '#10b981',
          legendFontColor: '#7F7F7F',
          legendFontSize: 12
        },
        {
          name: 'Tutors',
          population: totalTutors,
          color: '#6366f1',
          legendFontColor: '#7F7F7F',
          legendFontSize: 12
        }
      ]);
    }
  }, [users, tutors]);

  if (!chartData) return null;

  if (isWeb) {
    return (
      <View style={{ height: CHART_HEIGHT, width: '100%' }}>
        <ChartComponent.Pie 
          data={chartData} 
          options={{
            ...webChartOptions,
            plugins: {
              ...webChartOptions.plugins,
              title: {
                display: true,
                text: 'User Roles Distribution',
                color: '#333',
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            }
          }} 
        />
      </View>
    );
  } else {
    return (
      <ChartComponent.PieChart
        data={chartData}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        chartConfig={mobileChartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    );
  }
};