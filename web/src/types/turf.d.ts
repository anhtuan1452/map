declare module '@turf/helpers' {
  export function lineString(coordinates: number[][], properties?: any, options?: any): any;
}

declare module '@turf/length' {
  export default function length(geojson: any, options?: { units?: 'kilometers' | 'miles' | 'meters' }): number;
}
