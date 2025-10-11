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
  frozen?: boolean; // If true, entity cannot be moved or resized
}

export interface Rectangle {
  id: string;
  start: Point;
  end: Point;
  color: string;
  width: number;
  fillColor?: string;
  rotation?: number; // Rotation angle in degrees
  frozen?: boolean; // If true, entity cannot be moved or resized
}

export interface Circle {
  id: string;
  center: Point;
  radius: number;
  color: string;
  width: number;
  fillColor?: string;
  rotation?: number; // Rotation angle in degrees
  frozen?: boolean; // If true, entity cannot be moved or resized
}

export interface LinearDimension {
  id: string;
  start: Point; // First anchor point
  end: Point; // Second anchor point
  offset: number; // Distance from the measured line (perpendicular offset)
  color: string;
  textSize: number; // Font size for dimension text
  frozen?: boolean; // If true, entity cannot be moved or resized
}