import { Line, Rectangle, Circle, Point } from "./geometry";

export interface EntityProperties {
  type: 'line' | 'rectangle' | 'circle' | null;
  id: string | null;
  position: { x: number; y: number };
  dimensions: {
    length?: number;        // Line
    width?: number;         // Rectangle
    height?: number;        // Rectangle
    diameter?: number;      // Circle
    radius?: number;        // Circle
  };
  rotation?: number;        // Rotation angle in degrees
  frozen?: boolean;         // If true, entity cannot be moved or resized
}

export interface PropertyUpdate {
  entityId: string;
  entityType: 'line' | 'rectangle' | 'circle';
  position?: { x: number; y: number };
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    radius?: number;
  };
  rotation?: number;        // Rotation angle in degrees
  frozen?: boolean;         // If true, entity cannot be moved or resized
}

export class EntityPropertyCalculator {

  /**
   * Calculate properties for any entity type
   */
  static calculateProperties(
    entity: Line | Rectangle | Circle,
    entityType: 'line' | 'rectangle' | 'circle',
    canvasHeight: number
  ): EntityProperties {
    switch (entityType) {
      case 'line':
        return this.calculateLineProperties(entity as Line, canvasHeight);
      case 'rectangle':
        return this.calculateRectangleProperties(entity as Rectangle, canvasHeight);
      case 'circle':
        return this.calculateCircleProperties(entity as Circle, canvasHeight);
      default:
        return this.getEmptyProperties();
    }
  }

  /**
   * Calculate line properties
   * Position: Point closest to bottom-left origin
   * Dimensions: Length
   */
  private static calculateLineProperties(line: Line, canvasHeight: number): EntityProperties {
    // Convert coordinates to bottom-left origin system
    const startBottomLeft = this.screenToBottomLeft(line.start, canvasHeight);
    const endBottomLeft = this.screenToBottomLeft(line.end, canvasHeight);

    // Find point closest to origin (0,0) which is bottom-left
    const startDistance = Math.sqrt(startBottomLeft.x * startBottomLeft.x + startBottomLeft.y * startBottomLeft.y);
    const endDistance = Math.sqrt(endBottomLeft.x * endBottomLeft.x + endBottomLeft.y * endBottomLeft.y);

    const closestPoint = startDistance <= endDistance ? startBottomLeft : endBottomLeft;

    // Calculate length
    const length = Math.sqrt(
      Math.pow(endBottomLeft.x - startBottomLeft.x, 2) +
      Math.pow(endBottomLeft.y - startBottomLeft.y, 2)
    );

    return {
      type: 'line',
      id: line.id,
      position: { x: Math.round(closestPoint.x * 100) / 100, y: Math.round(closestPoint.y * 100) / 100 },
      dimensions: {
        length: Math.round(length * 100) / 100
      },
      rotation: line.rotation || 0,
      frozen: line.frozen || false
    };
  }

  /**
   * Calculate rectangle properties
   * Position: Point closest to bottom-left origin
   * Dimensions: Width and height
   */
  private static calculateRectangleProperties(rectangle: Rectangle, canvasHeight: number): EntityProperties {
    // Convert coordinates to bottom-left origin system
    const startBottomLeft = this.screenToBottomLeft(rectangle.start, canvasHeight);
    const endBottomLeft = this.screenToBottomLeft(rectangle.end, canvasHeight);

    // Calculate rectangle bounds in bottom-left coordinate system
    const minX = Math.min(startBottomLeft.x, endBottomLeft.x);
    const maxX = Math.max(startBottomLeft.x, endBottomLeft.x);
    const minY = Math.min(startBottomLeft.y, endBottomLeft.y);
    const maxY = Math.max(startBottomLeft.y, endBottomLeft.y);

    // Position is the point closest to origin (bottom-left corner of rectangle)
    const position = { x: minX, y: minY };

    // Calculate dimensions
    const width = maxX - minX;
    const height = maxY - minY;

    return {
      type: 'rectangle',
      id: rectangle.id,
      position: { x: Math.round(position.x * 100) / 100, y: Math.round(position.y * 100) / 100 },
      dimensions: {
        width: Math.round(width * 100) / 100,
        height: Math.round(height * 100) / 100
      },
      rotation: rectangle.rotation || 0,
      frozen: rectangle.frozen || false
    };
  }

  /**
   * Calculate circle properties
   * Position: Center point
   * Dimensions: Diameter and radius
   */
  private static calculateCircleProperties(circle: Circle, canvasHeight: number): EntityProperties {
    // Convert center to bottom-left origin system
    const centerBottomLeft = this.screenToBottomLeft(circle.center, canvasHeight);

    return {
      type: 'circle',
      id: circle.id,
      position: { x: Math.round(centerBottomLeft.x * 100) / 100, y: Math.round(centerBottomLeft.y * 100) / 100 },
      dimensions: {
        radius: Math.round(circle.radius * 100) / 100,
        diameter: Math.round((circle.radius * 2) * 100) / 100
      },
      rotation: circle.rotation || 0,
      frozen: circle.frozen || false
    };
  }

  /**
   * Convert screen coordinates (top-left origin) to bottom-left origin
   */
  private static screenToBottomLeft(point: Point, canvasHeight: number): Point {
    return {
      x: point.x,
      y: canvasHeight - point.y
    };
  }

  /**
   * Convert bottom-left origin coordinates to screen coordinates (top-left origin)
   */
  static bottomLeftToScreen(point: Point, canvasHeight: number): Point {
    return {
      x: point.x,
      y: canvasHeight - point.y
    };
  }

  /**
   * Get empty properties for no selection
   */
  static getEmptyProperties(): EntityProperties {
    return {
      type: null,
      id: null,
      position: { x: 0, y: 0 },
      dimensions: {}
    };
  }

  /**
   * Update entity coordinates based on property changes
   * Returns updated entity data in screen coordinates
   */
  static updateEntityFromProperties(
    originalEntity: Line | Rectangle | Circle,
    entityType: 'line' | 'rectangle' | 'circle',
    properties: EntityProperties,
    canvasHeight: number
  ): Line | Rectangle | Circle {
    switch (entityType) {
      case 'line':
        return this.updateLineFromProperties(originalEntity as Line, properties, canvasHeight);
      case 'rectangle':
        return this.updateRectangleFromProperties(originalEntity as Rectangle, properties, canvasHeight);
      case 'circle':
        return this.updateCircleFromProperties(originalEntity as Circle, properties, canvasHeight);
      default:
        return originalEntity;
    }
  }

  private static updateLineFromProperties(line: Line, properties: EntityProperties, canvasHeight: number): Line {
    if (!properties.position || !properties.dimensions?.length) return line;

    // Convert new position from bottom-left to screen coordinates
    const newPositionScreen = this.bottomLeftToScreen(properties.position, canvasHeight);

    // Calculate current line vector and length
    const currentLength = Math.sqrt(
      Math.pow(line.end.x - line.start.x, 2) +
      Math.pow(line.end.y - line.start.y, 2)
    );

    if (currentLength === 0) return line;

    // Calculate unit vector
    const unitX = (line.end.x - line.start.x) / currentLength;
    const unitY = (line.end.y - line.start.y) / currentLength;

    // Calculate new end point based on new length and position
    const newEndX = newPositionScreen.x + (unitX * properties.dimensions.length);
    const newEndY = newPositionScreen.y + (unitY * properties.dimensions.length);

    return {
      ...line,
      start: newPositionScreen,
      end: { x: newEndX, y: newEndY },
      rotation: properties.rotation !== undefined ? properties.rotation : line.rotation,
      frozen: properties.frozen !== undefined ? properties.frozen : line.frozen
    };
  }

  private static updateRectangleFromProperties(rectangle: Rectangle, properties: EntityProperties, canvasHeight: number): Rectangle {
    if (!properties.position || !properties.dimensions?.width || !properties.dimensions?.height) return rectangle;

    // Convert new position from bottom-left to screen coordinates
    const newPositionScreen = this.bottomLeftToScreen(properties.position, canvasHeight);

    // Calculate end point in screen coordinates
    const endBottomLeft = {
      x: properties.position.x + properties.dimensions.width,
      y: properties.position.y + properties.dimensions.height
    };
    const newEndScreen = this.bottomLeftToScreen(endBottomLeft, canvasHeight);

    return {
      ...rectangle,
      start: newPositionScreen,
      end: newEndScreen,
      rotation: properties.rotation !== undefined ? properties.rotation : rectangle.rotation,
      frozen: properties.frozen !== undefined ? properties.frozen : rectangle.frozen
    };
  }

  private static updateCircleFromProperties(circle: Circle, properties: EntityProperties, canvasHeight: number): Circle {
    if (!properties.position || !properties.dimensions?.radius) return circle;

    // Convert new center from bottom-left to screen coordinates
    const newCenterScreen = this.bottomLeftToScreen(properties.position, canvasHeight);

    return {
      ...circle,
      center: newCenterScreen,
      radius: properties.dimensions.radius,
      rotation: properties.rotation !== undefined ? properties.rotation : circle.rotation,
      frozen: properties.frozen !== undefined ? properties.frozen : circle.frozen
    };
  }
}