import { Line } from './line';
import { Rectangle } from './rectangle';
import { Circle } from './circle';

export type EntityType = 'line' | 'rectangle' | 'circle' | null;

export interface SelectedEntity {
  type: EntityType;
  id: string;
}

export type Entity = (Line | Rectangle | Circle) & {
  color?: string;
  width?: number;
  fillColor?: string;
};
