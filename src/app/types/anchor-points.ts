import { Point, Line, Rectangle, Circle } from "./geometry";

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
   * Rotate a point around a center by a given angle in degrees
   */
  private static rotatePoint(point: Point, center: Point, angleDegrees: number): Point {
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);

    const translatedX = point.x - center.x;
    const translatedY = point.y - center.y;

    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;

    return {
      x: rotatedX + center.x,
      y: rotatedY + center.y
    };
  }

  /**
   * Calculate all anchor points for a line
   */
  static calculateLineAnchorPoints(line: Line): AnchorPoint[] {
    const centerX = (line.start.x + line.end.x) / 2;
    const centerY = (line.start.y + line.end.y) / 2;
    const center = { x: centerX, y: centerY };

    let startPoint = line.start;
    let endPoint = line.end;
    let midpoint = center;

    // Apply rotation if present
    if (line.rotation) {
      startPoint = this.rotatePoint(line.start, center, line.rotation);
      endPoint = this.rotatePoint(line.end, center, line.rotation);
      midpoint = this.rotatePoint(midpoint, center, line.rotation);
    }

    return [
      {
        id: `${line.id}-start`,
        point: startPoint,
        type: 'line-start',
        entityId: line.id,
        entityType: 'line'
      },
      {
        id: `${line.id}-end`,
        point: endPoint,
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

    // Calculate center for rotation
    const width = rectangle.end.x - rectangle.start.x;
    const height = rectangle.end.y - rectangle.start.y;
    const centerX = rectangle.start.x + width / 2;
    const centerY = rectangle.start.y + height / 2;
    const center = { x: centerX, y: centerY };

    // Define unrotated points
    let topLeft = { x: minX, y: minY };
    let topRight = { x: maxX, y: minY };
    let bottomLeft = { x: minX, y: maxY };
    let bottomRight = { x: maxX, y: maxY };
    let topMid = { x: midX, y: minY };
    let bottomMid = { x: midX, y: maxY };
    let leftMid = { x: minX, y: midY };
    let rightMid = { x: maxX, y: midY };

    // Apply rotation if present
    if (rectangle.rotation) {
      topLeft = this.rotatePoint(topLeft, center, rectangle.rotation);
      topRight = this.rotatePoint(topRight, center, rectangle.rotation);
      bottomLeft = this.rotatePoint(bottomLeft, center, rectangle.rotation);
      bottomRight = this.rotatePoint(bottomRight, center, rectangle.rotation);
      topMid = this.rotatePoint(topMid, center, rectangle.rotation);
      bottomMid = this.rotatePoint(bottomMid, center, rectangle.rotation);
      leftMid = this.rotatePoint(leftMid, center, rectangle.rotation);
      rightMid = this.rotatePoint(rightMid, center, rectangle.rotation);
    }

    return [
      // Corner points
      {
        id: `${rectangle.id}-top-left`,
        point: topLeft,
        type: 'rect-top-left',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-top-right`,
        point: topRight,
        type: 'rect-top-right',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-bottom-left`,
        point: bottomLeft,
        type: 'rect-bottom-left',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-bottom-right`,
        point: bottomRight,
        type: 'rect-bottom-right',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      // Midpoint of edges
      {
        id: `${rectangle.id}-top-mid`,
        point: topMid,
        type: 'rect-top-mid',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-bottom-mid`,
        point: bottomMid,
        type: 'rect-bottom-mid',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-left-mid`,
        point: leftMid,
        type: 'rect-left-mid',
        entityId: rectangle.id,
        entityType: 'rectangle'
      },
      {
        id: `${rectangle.id}-right-mid`,
        point: rightMid,
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
    // Circle center doesn't change with rotation, but we keep consistency
    let centerPoint = circle.center;

    // Note: Circle rotation doesn't affect the center point position
    // but we maintain the same structure for consistency

    return [
      {
        id: `${circle.id}-center`,
        point: centerPoint,
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