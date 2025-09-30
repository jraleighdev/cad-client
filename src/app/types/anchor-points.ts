import { Point, Line, Rectangle, Circle } from '../components/canvas/canvas';

export interface AnchorPoint {
  id: string;
  point: Point;
  type: AnchorPointType;
  entityId: string;
  entityType: 'line' | 'rectangle' | 'circle';
}

export type AnchorPointType =
  // Line anchor points
  | 'line-start'
  | 'line-end'
  | 'line-midpoint'
  // Rectangle anchor points
  | 'rect-top-left'
  | 'rect-top-right'
  | 'rect-bottom-left'
  | 'rect-bottom-right'
  | 'rect-top-mid'
  | 'rect-bottom-mid'
  | 'rect-left-mid'
  | 'rect-right-mid'
  // Circle anchor points
  | 'circle-center';

export interface SnapResult {
  snapped: boolean;
  snapPoint: Point;
  anchorPoint?: AnchorPoint;
}

export class AnchorPointCalculator {
  private static readonly SNAP_DISTANCE = 10; // pixels

  /**
   * Calculate all anchor points for a line
   */
  static calculateLineAnchorPoints(line: Line): AnchorPoint[] {
    const midpoint = {
      x: (line.start.x + line.end.x) / 2,
      y: (line.start.y + line.end.y) / 2
    };

    return [
      {
        id: `${line.id}-start`,
        point: line.start,
        type: 'line-start',
        entityId: line.id,
        entityType: 'line'
      },
      {
        id: `${line.id}-end`,
        point: line.end,
        type: 'line-end',
        entityId: line.id,
        entityType: 'line'
      },
      {
        id: `${line.id}-midpoint`,
        point: midpoint,
        type: 'line-midpoint',
        entityId: line.id,
        entityType: 'line'
      }
    ];
  }

  /**
   * Calculate all anchor points for a rectangle
   */
  static calculateRectangleAnchorPoints(rectangle: Rectangle): AnchorPoint[] {
    const minX = Math.min(rectangle.start.x, rectangle.end.x);
    const maxX = Math.max(rectangle.start.x, rectangle.end.x);
    const minY = Math.min(rectangle.start.y, rectangle.end.y);
    const maxY = Math.max(rectangle.start.y, rectangle.end.y);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    return [
      // Corner points
      {
        id: `${rectangle.id}-top-left`,
        point: { x: minX, y: minY },
        type: 'rect-top-left',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-top-right`,
        point: { x: maxX, y: minY },
        type: 'rect-top-right',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-bottom-left`,
        point: { x: minX, y: maxY },
        type: 'rect-bottom-left',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-bottom-right`,
        point: { x: maxX, y: maxY },
        type: 'rect-bottom-right',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      // Midpoint of edges
      {
        id: `${rectangle.id}-top-mid`,
        point: { x: midX, y: minY },
        type: 'rect-top-mid',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-bottom-mid`,
        point: { x: midX, y: maxY },
        type: 'rect-bottom-mid',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-left-mid`,
        point: { x: minX, y: midY },
        type: 'rect-left-mid',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-right-mid`,
        point: { x: maxX, y: midY },
        type: 'rect-right-mid',
        entityId: rectangle.id,
        entityType: 'rectangle'
      }
    ];
  }

  /**
   * Calculate all anchor points for a circle
   */
  static calculateCircleAnchorPoints(circle: Circle): AnchorPoint[] {
    return [
      {
        id: `${circle.id}-center`,
        point: circle.center,
        type: 'circle-center',
        entityId: circle.id,
        entityType: 'circle'
      }
    ];
  }

  /**
   * Get all anchor points for all entities
   */
  static getAllAnchorPoints(
    lines: Line[],
    rectangles: Rectangle[],
    circles: Circle[]
  ): AnchorPoint[] {
    const anchorPoints: AnchorPoint[] = [];

    // Add line anchor points
    lines.forEach(line => {
      anchorPoints.push(...this.calculateLineAnchorPoints(line));
    });

    // Add rectangle anchor points
    rectangles.forEach(rectangle => {
      anchorPoints.push(...this.calculateRectangleAnchorPoints(rectangle));
    });

    // Add circle anchor points
    circles.forEach(circle => {
      anchorPoints.push(...this.calculateCircleAnchorPoints(circle));
    });

    return anchorPoints;
  }

  /**
   * Find the nearest anchor point to a given point
   */
  static findNearestAnchorPoint(
    targetPoint: Point,
    anchorPoints: AnchorPoint[],
    excludeEntityId?: string
  ): SnapResult {
    let nearestAnchor: AnchorPoint | null = null;
    let nearestDistance = this.SNAP_DISTANCE;

    for (const anchor of anchorPoints) {
      // Skip anchor points from the same entity if specified
      if (excludeEntityId && anchor.entityId === excludeEntityId) {
        continue;
      }

      const distance = this.calculateDistance(targetPoint, anchor.point);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestAnchor = anchor;
      }
    }

    if (nearestAnchor) {
      return {
        snapped: true,
        snapPoint: nearestAnchor.point,
        anchorPoint: nearestAnchor
      };
    }

    return {
      snapped: false,
      snapPoint: targetPoint
    };
  }

  /**
   * Calculate distance between two points
   */
  private static calculateDistance(point1: Point, point2: Point): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  }

  /**
   * Snap a point to the nearest anchor if within snap distance
   */
  static snapToNearestAnchor(
    targetPoint: Point,
    lines: Line[],
    rectangles: Rectangle[],
    circles: Circle[],
    excludeEntityId?: string
  ): SnapResult {
    const allAnchors = this.getAllAnchorPoints(lines, rectangles, circles);
    return this.findNearestAnchorPoint(targetPoint, allAnchors, excludeEntityId);
  }

  /**
   * Get snap distance threshold
   */
  static getSnapDistance(): number {
    return this.SNAP_DISTANCE;
  }
}