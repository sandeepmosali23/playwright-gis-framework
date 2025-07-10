/**
 * GIS calculation utilities
 */

import { IGISCalculations } from '../interfaces';
import { GIS_CONFIG } from '../config/constants';

export class GISCalculations implements IGISCalculations {
  /**
   * Calculates distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = GIS_CONFIG.EARTH_RADIUS_KM;

    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLng = this.degreesToRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Calculates the bearing (direction) between two points
   * Returns bearing in degrees (0-360)
   */
  static calculateBearing(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const dLng = this.degreesToRadians(lng2 - lng1);
    const lat1Rad = this.degreesToRadians(lat1);
    const lat2Rad = this.degreesToRadians(lat2);

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    const bearing = Math.atan2(y, x);
    return ((bearing * 180) / Math.PI + 360) % 360;
  }

  /**
   * Converts degrees to radians
   */
  static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Converts radians to degrees
   */
  static radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * Formats coordinates for display
   */
  static formatCoordinates(
    lat: number,
    lng: number,
    precision: number = GIS_CONFIG.COORDINATE_PRECISION.DEFAULT
  ): string {
    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
  }

  /**
   * Calculates the center point between two coordinates
   */
  static calculateMidpoint(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): { lat: number; lng: number } {
    const lat1Rad = this.degreesToRadians(lat1);
    const lat2Rad = this.degreesToRadians(lat2);
    const dLng = this.degreesToRadians(lng2 - lng1);

    const bx = Math.cos(lat2Rad) * Math.cos(dLng);
    const by = Math.cos(lat2Rad) * Math.sin(dLng);

    const lat3Rad = Math.atan2(
      Math.sin(lat1Rad) + Math.sin(lat2Rad),
      Math.sqrt((Math.cos(lat1Rad) + bx) * (Math.cos(lat1Rad) + bx) + by * by)
    );
    const lng3Rad =
      this.degreesToRadians(lng1) + Math.atan2(by, Math.cos(lat1Rad) + bx);

    return {
      lat: this.radiansToDegrees(lat3Rad),
      lng: this.radiansToDegrees(lng3Rad),
    };
  }

  /**
   * Calculates the destination point given a starting point, bearing, and distance
   */
  static calculateDestination(
    lat: number,
    lng: number,
    bearing: number,
    distance: number
  ): { lat: number; lng: number } {
    const R = GIS_CONFIG.EARTH_RADIUS_KM;
    const latRad = this.degreesToRadians(lat);
    const lngRad = this.degreesToRadians(lng);
    const bearingRad = this.degreesToRadians(bearing);

    const lat2Rad = Math.asin(
      Math.sin(latRad) * Math.cos(distance / R) +
        Math.cos(latRad) * Math.sin(distance / R) * Math.cos(bearingRad)
    );

    const lng2Rad =
      lngRad +
      Math.atan2(
        Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(latRad),
        Math.cos(distance / R) - Math.sin(latRad) * Math.sin(lat2Rad)
      );

    return {
      lat: this.radiansToDegrees(lat2Rad),
      lng: this.radiansToDegrees(lng2Rad),
    };
  }

  /**
   * Calculates the area of a polygon defined by an array of coordinates
   * Returns area in square kilometers
   */
  static calculatePolygonArea(
    coordinates: { lat: number; lng: number }[]
  ): number {
    if (coordinates.length < 3) {
      return 0;
    }

    const R = GIS_CONFIG.EARTH_RADIUS_KM;
    let area = 0;

    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      const lat1 = this.degreesToRadians(coordinates[i].lat);
      const lat2 = this.degreesToRadians(coordinates[j].lat);
      const lng1 = this.degreesToRadians(coordinates[i].lng);
      const lng2 = this.degreesToRadians(coordinates[j].lng);

      area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = (Math.abs(area) * R * R) / 2;
    return area;
  }

  /**
   * Normalizes longitude to [-180, 180] range
   */
  static normalizeLongitude(lng: number): number {
    while (lng > 180) lng -= 360;
    while (lng < -180) lng += 360;
    return lng;
  }

  /**
   * Normalizes latitude to [-90, 90] range
   */
  static normalizeLatitude(lat: number): number {
    return Math.max(-90, Math.min(90, lat));
  }

  /**
   * Converts decimal degrees to degrees, minutes, seconds format
   */
  static toDMS(decimal: number, isLongitude: boolean = false): string {
    const dir = isLongitude
      ? decimal >= 0
        ? 'E'
        : 'W'
      : decimal >= 0
        ? 'N'
        : 'S';

    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds =
      Math.round(((abs - degrees) * 60 - minutes) * 60 * 100) / 100;

    return `${degrees}°${minutes}'${seconds}"${dir}`;
  }

  /**
   * Converts DMS to decimal degrees
   */
  static fromDMS(
    degrees: number,
    minutes: number,
    seconds: number,
    direction: string
  ): number {
    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }
    return decimal;
  }
}
