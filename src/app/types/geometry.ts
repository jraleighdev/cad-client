export interface Point {
    x: number;
    y: number;
}

export interface Line {
  id: string;
  start: Point;
  end: Point;
  color: string;
  width: number;
}

export interface Rectangle {
  id: string;
  start: Point;
  end: Point;
  color: string;
  width: number;
  fillColor?: string;
}

export interface Circle {
  id: string;
  center: Point;
  radius: number;
  color: string;
  width: number;
  fillColor?: string;
}