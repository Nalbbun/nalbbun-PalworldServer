import { Line } from "react-chartjs-2";

export default function ChartCard({ title, data, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-colors duration-200 border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-white">{title}</h3>

      <div className="h-[150px]">
      <Line
        data={{
          labels: data.map((_, i) => i),
          datasets: [
            {
              label: title,
              data,
              borderColor: color,
              tension: 0.3,
            },
          ],
        }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { display: false },  
              y: {  
                 ticks: { color: '#888' } 
              }
            }
          }}
        />
      </div>
    </div>
  );
}