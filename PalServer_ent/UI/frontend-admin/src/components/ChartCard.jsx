import { Line } from "react-chartjs-2";

export default function ChartCard({ title, data, color }) {
  return (
    <div className="bg-gray-800 p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-2">{title}</h3>

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
        }}
        height={150}
      />
    </div>
  );
}