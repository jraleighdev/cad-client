import { Point } from './point';

export interface Circle {
  id: string;
  center: Point;
  radius: number;
  color: string;
  width: number;
  fillColor?: string;
}
