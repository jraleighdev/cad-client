import { Point } from './point';

export interface Rectangle {
  id: string;
  start: Point;
  end: Point;
  color: string;
  width: number;
  fillColor?: string;
}
