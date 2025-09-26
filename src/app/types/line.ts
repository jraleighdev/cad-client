import { Point } from './point';

export interface Line {
  id: string;
  start: Point;
  end: Point;
  color: string;
  width: number;
}
