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
  rotation?: number; // Rotation angle in degrees
}

export interface Rectangle {
  id: string;
  start: Point;
  end: Point;
  color: string;
  width: number;
  fillColor?: string;
  rotation?: number; // Rotation angle in degrees
}

export interface Circle {
  id: string;
  center: Point;
  radius: number;
  color: string;
  width: number;
  fillColor?: string;
  rotation?: number; // Rotation angle in degrees
}