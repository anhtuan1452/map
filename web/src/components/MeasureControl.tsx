import React from 'react';
import { lineString } from '@turf/helpers';
import length from '@turf/length';

const MeasureControl: React.FC = () => {
  const [measuring, setMeasuring] = React.useState(false);
  const [points, setPoints] = React.useState<Array<[number, number]>>([]);
  const [distance, setDistance] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (points.length >= 2) {
      const line = lineString(points.map(([lon, lat]) => [lon, lat]));
      const len = length(line, { units: 'kilometers' });
      setDistance(len);
    } else {
      setDistance(null);
    }
  }, [points]);

  // Note: integration with actual Leaflet map clicks requires access to map instance.
  // This component provides the UI state; MapView should pass click handlers to collect coords.

  return (
    <div style={{ position: 'absolute', top: 10, right: 10, background: 'white', padding: 8, borderRadius: 6 }}>
      <button onClick={() => { setMeasuring(!measuring); setPoints([]); setDistance(null); }}>
        {measuring ? 'Dừng đo' : 'Bật thước đo'}
      </button>
      {measuring && <p>Chế độ đo: click 2 điểm hoặc nhiều hơn trên bản đồ</p>}
      {distance !== null && <p>Khoảng cách: {distance.toFixed(3)} km</p>}
    </div>
  );
};

export default MeasureControl;
