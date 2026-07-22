import { DISTRICT_CENTERS, type GeoPoint2 } from "@/lib/data/city-centers";

const EARTH_RADIUS_KM = 6371;

function haversineKm(a: GeoPoint2, b: GeoPoint2): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export type NearestLocation = {
  city: string;
  district: string;
  distanceKm: number;
};

/** Verilen koordinata en yakın il/ilçe merkezini bulur. */
export function findNearestDistrict(
  lat: number,
  lng: number,
): NearestLocation | null {
  let nearest: NearestLocation | null = null;

  for (const [city, districts] of Object.entries(DISTRICT_CENTERS)) {
    for (const [district, point] of Object.entries(districts)) {
      const distanceKm = haversineKm({ lat, lng }, point);
      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = { city, district, distanceKm };
      }
    }
  }

  return nearest;
}
