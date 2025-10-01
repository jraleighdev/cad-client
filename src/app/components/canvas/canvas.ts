import { Component, ChangeDetectionStrategy, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, output } from '@angular/core';
import { EntityProperties, EntityPropertyCalculator, PropertyUpdate } from '../../types/entity-properties';
import { AnchorPoint, AnchorPointCalculator, SnapResult } from '../../types/anchor-points';

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

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasElement', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;
  
  private elementRef = inject(ElementRef);
  
  protected readonly isDrawing = signal(false);
  protected readonly currentTool = signal('select');
  protected readonly lines = signal<Line[]>([]);
  protected readonly rectangles = signal<Rectangle[]>([]);
  protected readonly circles = signal<Circle[]>([]);
  protected readonly currentLine = signal<Partial<Line> | null>(null);
  protected readonly currentRectangle = signal<Partial<Rectangle> | null>(null);
  protected readonly currentCircle = signal<Partial<Circle> | null>(null);
  
  // Selection state
  protected readonly selectedEntity = signal<{type: 'line' | 'rectangle' | 'circle', id: string} | null>(null);
  protected readonly isDragging = signal(false);
  protected readonly dragOffset = signal<Point | null>(null);
  
  // Resize handle state
  protected readonly isResizing = signal(false);
  protected readonly resizeHandle = signal<string | null>(null);
  protected readonly handleSize = 8; // Size of resize handles in pixels

  // Anchor point state
  protected readonly showAnchorPoints = signal(true);
  protected readonly snapEnabled = signal(true);
  protected readonly orthoEnabled = signal(false);
  protected readonly currentSnapPoint = signal<AnchorPoint | null>(null);
  protected readonly hoveredAnchorPoints = signal<AnchorPoint[]>([]);
  protected readonly anchorPointSize = 4; // Size of anchor point indicators

  private ctx: CanvasRenderingContext2D | null = null;
  private startPoint: Point | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private keyboardListener: ((event: KeyboardEvent) => void) | undefined;

  // Output events
  entitySelected = output<EntityProperties | null>();
  snapStateChanged = output<boolean>();
  mousePositionChanged = output<{x: number, y: number}>();

  ngAfterViewInit() {
    this.initializeCanvas();
    this.setupKeyboardListeners();
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.removeKeyboardListeners();
  }

  private initializeCanvas() {
    const canvas = this.canvasElement.nativeElement;
    this.ctx = canvas.getContext('2d');
    
    if (this.ctx) {
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
    
    this.resizeCanvas();
    this.drawGrid();
    this.setupResizeObserver();
  }

  private resizeCanvas() {
    const canvas = this.canvasElement.nativeElement;
    const container = canvas.parentElement;
    
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  }

  private setupResizeObserver() {
    const canvas = this.canvasElement.nativeElement;
    const container = canvas.parentElement;

    if (container && window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeCanvas();
        this.redrawCanvas();
      });

      this.resizeObserver.observe(container);
    }
  }

  private setupKeyboardListeners() {
    this.keyboardListener = (event: KeyboardEvent) => {
      // Ctrl+B to toggle snap
      if (event.ctrlKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        this.toggleSnap();
      }
      // F8 to toggle ortho
      if (event.key === 'F8') {
        event.preventDefault();
        this.toggleOrtho();
      }
    };

    document.addEventListener('keydown', this.keyboardListener);
  }

  private removeKeyboardListeners() {
    if (this.keyboardListener) {
      document.removeEventListener('keydown', this.keyboardListener);
    }
  }

  private drawGrid() {
    if (!this.ctx) return;

    const canvas = this.canvasElement.nativeElement;
    const gridSize = 20;

    this.ctx.strokeStyle = '#bdc3c7';
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.3;

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, canvas.height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(canvas.width, y);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  protected onMouseDown(event: MouseEvent) {
    const tool = this.currentTool();
    const rect = this.canvasElement.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const point = { x, y };
    
    if (tool === 'select') {
      // Check if clicking on a resize handle first
      const handle = this.getHandleAtPoint(point);
      if (handle) {
        this.isResizing.set(true);
        this.resizeHandle.set(handle);
        this.startPoint = point;
        this.setCanvasCursor('grabbing');
        return;
      }
      
      // Handle selection and dragging
      const entity = this.findEntityAtPoint(point);
      this.selectedEntity.set(entity);

      // Emit entity selection event
      this.emitEntitySelection(entity);

      if (entity) {
        this.isDragging.set(true);
        this.startPoint = point;

        // Calculate drag offset for smooth movement
        const entityData = this.getEntityData(entity);
        if (entityData) {
          const offset = this.calculateDragOffset(point, entityData);
          this.dragOffset.set(offset);
        }
      }
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
      // Handle drawing tools with snapping
      const snapResult = this.applySnapping(point);
      const snappedPoint = snapResult.snapPoint;

      this.startPoint = snappedPoint;
      this.isDrawing.set(true);
      this.currentSnapPoint.set(snapResult.anchorPoint || null);

      if (tool === 'line') {
        const newLine: Partial<Line> = {
          id: Date.now().toString(),
          start: snappedPoint,
          color: '#000000',
          width: 2
        };
        this.currentLine.set(newLine);
      } else if (tool === 'rectangle') {
        const newRectangle: Partial<Rectangle> = {
          id: Date.now().toString(),
          start: snappedPoint,
          color: '#000000',
          width: 2,
          fillColor: 'transparent'
        };
        this.currentRectangle.set(newRectangle);
      } else if (tool === 'circle') {
        const newCircle: Partial<Circle> = {
          id: Date.now().toString(),
          center: snappedPoint,
          color: '#000000',
          width: 2,
          fillColor: 'transparent'
        };
        this.currentCircle.set(newCircle);
      }
    }
  }

  protected onMouseMove(event: MouseEvent) {
    const rect = this.canvasElement.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const point = { x, y };

    // Emit mouse position for footer display
    this.mousePositionChanged.emit({ x: Math.round(x), y: Math.round(y) });

    if (this.isResizing() && this.selectedEntity()) {
      // Handle resizing selected entity with snapping
      const selected = this.selectedEntity();
      const snapResult = this.applySnapping(point, selected?.id);
      const snappedPoint = snapResult.snapPoint;
      this.currentSnapPoint.set(snapResult.anchorPoint || null);
      this.hoveredAnchorPoints.set([]);

      this.resizeSelectedEntity(snappedPoint);
      this.setCanvasCursor('grabbing');
    } else if (this.isDragging() && this.selectedEntity()) {
      // Handle dragging selected entity with snapping
      const selected = this.selectedEntity();

      // Calculate the new position based on drag offset first
      const offset = this.dragOffset();
      if (!offset) return;

      const newPosition = {
        x: point.x - offset.x,
        y: point.y - offset.y
      };

      // Apply snapping to the calculated position
      const snapResult = this.applySnapping(newPosition, selected?.id);
      const snappedPosition = snapResult.snapPoint;
      this.currentSnapPoint.set(snapResult.anchorPoint || null);
      this.hoveredAnchorPoints.set([]);

      this.moveSelectedEntityToPosition(snappedPosition);
      this.setCanvasCursor('move');
    } else if (this.isDrawing() && this.startPoint) {
      // Handle drawing preview with snapping and ortho constraint
      const snapResult = this.applySnapping(point);
      let snappedPoint = snapResult.snapPoint;

      // Apply ortho constraint after snapping for line tool
      const tool = this.currentTool();
      if (tool === 'line') {
        snappedPoint = this.applyOrthoConstraint(this.startPoint, snappedPoint);
      }

      this.currentSnapPoint.set(snapResult.anchorPoint || null);
      this.hoveredAnchorPoints.set([]);

      this.redrawCanvas();

      if (tool === 'line') {
        this.drawPreviewLine(this.startPoint, snappedPoint);
      } else if (tool === 'rectangle') {
        this.drawPreviewRectangle(this.startPoint, snappedPoint);
      } else if (tool === 'circle') {
        this.drawPreviewCircle(this.startPoint, snappedPoint);
      }
    } else {
      // Update cursor when hovering over handles (not dragging/resizing)
      const handle = this.getHandleAtPoint(point);
      if (handle) {
        this.setCanvasCursor(this.cursorForHandle(handle));
        this.currentSnapPoint.set(null);
        this.hoveredAnchorPoints.set([]);
      } else {
        // When just hovering (not actively drawing/moving/resizing), only show hover state
        // Don't set currentSnapPoint unless we're actually performing an operation
        this.currentSnapPoint.set(null);

        // Find all anchor points near the mouse for hover display
        // Use a larger boundary for hover detection to make it less precise than snapping
        const hoverDistance = AnchorPointCalculator.getSnapDistance() * 1.5; // 15 pixels vs 10 for snapping
        const allAnchors = this.getAllAnchorPoints();
        const hoveredAnchors = allAnchors.filter(anchor => {
          const distance = Math.sqrt(
            Math.pow(point.x - anchor.point.x, 2) + Math.pow(point.y - anchor.point.y, 2)
          );
          return distance <= hoverDistance;
        });
        this.hoveredAnchorPoints.set(hoveredAnchors);

        // Redraw canvas to update hover indicators
        this.redrawCanvas();

        this.setCanvasCursor('crosshair');
      }
    }
  }

  protected onMouseUp(event: MouseEvent) {
    if (this.isResizing()) {
      // Finish resizing
      this.isResizing.set(false);
      this.resizeHandle.set(null);
      this.currentSnapPoint.set(null);
      this.setCanvasCursor('crosshair');
    } else if (this.isDragging()) {
      // Finish dragging
      this.isDragging.set(false);
      this.dragOffset.set(null);
      this.currentSnapPoint.set(null);
      this.setCanvasCursor('crosshair');
    } else if (this.isDrawing() && this.startPoint) {
      // Finish drawing with snapping and ortho constraint
      const rect = this.canvasElement.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const endPoint = { x, y };

      const snapResult = this.applySnapping(endPoint);
      let snappedEndPoint = snapResult.snapPoint;

      const tool = this.currentTool();

      if (tool === 'line') {
        // Apply ortho constraint for line tool
        snappedEndPoint = this.applyOrthoConstraint(this.startPoint, snappedEndPoint);

        const completedLine: Line = {
          id: this.currentLine()?.id || Date.now().toString(),
          start: this.startPoint,
          end: snappedEndPoint,
          color: this.currentLine()?.color || '#000000',
          width: this.currentLine()?.width || 2
        };
        this.lines.update(lines => [...lines, completedLine]);
        this.currentLine.set(null);
      } else if (tool === 'rectangle') {
        const completedRectangle: Rectangle = {
          id: this.currentRectangle()?.id || Date.now().toString(),
          start: this.startPoint,
          end: snappedEndPoint,
          color: this.currentRectangle()?.color || '#000000',
          width: this.currentRectangle()?.width || 2,
          fillColor: this.currentRectangle()?.fillColor || 'transparent'
        };
        this.rectangles.update(rectangles => [...rectangles, completedRectangle]);
        this.currentRectangle.set(null);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(snappedEndPoint.x - this.startPoint.x, 2) + Math.pow(snappedEndPoint.y - this.startPoint.y, 2)
        );
        const completedCircle: Circle = {
          id: this.currentCircle()?.id || Date.now().toString(),
          center: this.startPoint,
          radius: radius,
          color: this.currentCircle()?.color || '#000000',
          width: this.currentCircle()?.width || 2,
          fillColor: this.currentCircle()?.fillColor || 'transparent'
        };
        this.circles.update(circles => [...circles, completedCircle]);
        this.currentCircle.set(null);
      }
      
      this.isDrawing.set(false);
      this.startPoint = null;
      this.currentSnapPoint.set(null);
    }
    
    this.redrawCanvas();
  }

  private drawPreviewLine(start: Point, end: Point) {
    if (!this.ctx) return;
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
  }

  private drawPreviewRectangle(start: Point, end: Point) {
    if (!this.ctx) return;
    
    const width = end.x - start.x;
    const height = end.y - start.y;
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.strokeRect(start.x, start.y, width, height);
    
    this.ctx.setLineDash([]);
  }

  private drawPreviewCircle(center: Point, end: Point) {
    if (!this.ctx) return;
    
    const radius = Math.sqrt(
      Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2)
    );
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
  }

  private redrawCanvas() {
    if (!this.ctx) return;
    
    const canvas = this.canvasElement.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    this.drawGrid();
    this.drawAllLines();
    this.drawAllRectangles();
    this.drawAllCircles();
    this.drawSelectionHighlight();
    this.drawAnchorPoints();
    this.drawSnapIndicator();
  }

  private drawAllLines() {
    if (!this.ctx) return;
    
    this.lines().forEach(line => {
      this.ctx!.strokeStyle = line.color;
      this.ctx!.lineWidth = line.width;
      this.ctx!.setLineDash([]);
      
      this.ctx!.beginPath();
      this.ctx!.moveTo(line.start.x, line.start.y);
      this.ctx!.lineTo(line.end.x, line.end.y);
      this.ctx!.stroke();
    });
  }

  private drawAllRectangles() {
    if (!this.ctx) return;
    
    this.rectangles().forEach(rectangle => {
      const width = rectangle.end.x - rectangle.start.x;
      const height = rectangle.end.y - rectangle.start.y;
      
      // Draw fill if specified
      if (rectangle.fillColor && rectangle.fillColor !== 'transparent') {
        this.ctx!.fillStyle = rectangle.fillColor;
        this.ctx!.fillRect(rectangle.start.x, rectangle.start.y, width, height);
      }
      
      // Draw stroke
      this.ctx!.strokeStyle = rectangle.color;
      this.ctx!.lineWidth = rectangle.width;
      this.ctx!.setLineDash([]);
      this.ctx!.strokeRect(rectangle.start.x, rectangle.start.y, width, height);
    });
  }

  private drawAllCircles() {
    if (!this.ctx) return;
    
    this.circles().forEach(circle => {
      // Draw fill if specified
      if (circle.fillColor && circle.fillColor !== 'transparent') {
        this.ctx!.fillStyle = circle.fillColor;
        this.ctx!.beginPath();
        this.ctx!.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
        this.ctx!.fill();
      }
      
      // Draw stroke
      this.ctx!.strokeStyle = circle.color;
      this.ctx!.lineWidth = circle.width;
      this.ctx!.setLineDash([]);
      this.ctx!.beginPath();
      this.ctx!.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
      this.ctx!.stroke();
    });
  }

  setTool(tool: string) {
    this.currentTool.set(tool);
  }

  toggleSnap() {
    this.snapEnabled.update(enabled => !enabled);
    this.snapStateChanged.emit(this.snapEnabled());
  }

  toggleOrtho() {
    this.orthoEnabled.update(enabled => !enabled);
  }

  private applyOrthoConstraint(start: Point, end: Point): Point {
    if (!this.orthoEnabled()) {
      return end;
    }

    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);

    // Constrain to the axis with greater movement
    if (dx > dy) {
      // Horizontal line
      return { x: end.x, y: start.y };
    } else {
      // Vertical line
      return { x: start.x, y: end.y };
    }
  }

  // Hit testing methods
  private hitTestLine(point: Point, line: Line, tolerance: number = 5): boolean {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return false;
    
    const t = ((point.x - line.start.x) * dx + (point.y - line.start.y) * dy) / (length * length);
    const tClamped = Math.max(0, Math.min(1, t));
    
    const closestX = line.start.x + tClamped * dx;
    const closestY = line.start.y + tClamped * dy;
    
    const distance = Math.sqrt(
      Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2)
    );
    
    return distance <= tolerance;
  }

  private hitTestRectangle(point: Point, rectangle: Rectangle, tolerance: number = 5): boolean {
    const minX = Math.min(rectangle.start.x, rectangle.end.x);
    const maxX = Math.max(rectangle.start.x, rectangle.end.x);
    const minY = Math.min(rectangle.start.y, rectangle.end.y);
    const maxY = Math.max(rectangle.start.y, rectangle.end.y);
    
    // Check if point is within the rectangle bounds
    if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) {
      return false;
    }
    
    // Check if point is near any of the four edges
    const nearLeftEdge = Math.abs(point.x - minX) <= tolerance;
    const nearRightEdge = Math.abs(point.x - maxX) <= tolerance;
    const nearTopEdge = Math.abs(point.y - minY) <= tolerance;
    const nearBottomEdge = Math.abs(point.y - maxY) <= tolerance;
    
    // Point must be near at least one edge to be considered a hit
    return nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge;
  }

  private hitTestCircle(point: Point, circle: Circle, tolerance: number = 5): boolean {
    const distance = Math.sqrt(
      Math.pow(point.x - circle.center.x, 2) + Math.pow(point.y - circle.center.y, 2)
    );
    
    return Math.abs(distance - circle.radius) <= tolerance;
  }

  private findEntityAtPoint(point: Point): {type: 'line' | 'rectangle' | 'circle', id: string} | null {
    // Check circles first (they're usually on top)
    for (const circle of this.circles()) {
      if (this.hitTestCircle(point, circle)) {
        return { type: 'circle', id: circle.id };
      }
    }
    
    // Check rectangles
    for (const rectangle of this.rectangles()) {
      if (this.hitTestRectangle(point, rectangle)) {
        return { type: 'rectangle', id: rectangle.id };
      }
    }
    
    // Check lines
    for (const line of this.lines()) {
      if (this.hitTestLine(point, line)) {
        return { type: 'line', id: line.id };
      }
    }
    
    return null;
  }

  // Helper methods for entity manipulation
  private getEntityData(entity: {type: 'line' | 'rectangle' | 'circle', id: string}): Line | Rectangle | Circle | null {
    if (entity.type === 'line') {
      return this.lines().find(line => line.id === entity.id) || null;
    } else if (entity.type === 'rectangle') {
      return this.rectangles().find(rectangle => rectangle.id === entity.id) || null;
    } else if (entity.type === 'circle') {
      return this.circles().find(circle => circle.id === entity.id) || null;
    }
    return null;
  }

  private calculateDragOffset(point: Point, entity: Line | Rectangle | Circle): Point {
    if ('center' in entity) {
      // Circle
      return {
        x: point.x - entity.center.x,
        y: point.y - entity.center.y
      };
    } else if ('start' in entity && 'end' in entity) {
      // Line or Rectangle
      return {
        x: point.x - entity.start.x,
        y: point.y - entity.start.y
      };
    }
    return { x: 0, y: 0 };
  }

  private moveSelectedEntity(point: Point) {
    const selected = this.selectedEntity();
    if (!selected) return;

    const offset = this.dragOffset();
    if (!offset) return;

    const newX = point.x - offset.x;
    const newY = point.y - offset.y;

    if (selected.type === 'line') {
      this.lines.update(lines =>
        lines.map(line =>
          line.id === selected.id
            ? {
                ...line,
                start: { x: newX, y: newY },
                end: {
                  x: line.end.x + (newX - line.start.x),
                  y: line.end.y + (newY - line.start.y)
                }
              }
            : line
        )
      );
    } else if (selected.type === 'rectangle') {
      this.rectangles.update(rectangles =>
        rectangles.map(rectangle =>
          rectangle.id === selected.id
            ? {
                ...rectangle,
                start: { x: newX, y: newY },
                end: {
                  x: rectangle.end.x + (newX - rectangle.start.x),
                  y: rectangle.end.y + (newY - rectangle.start.y)
                }
              }
            : rectangle
        )
      );
    } else if (selected.type === 'circle') {
      this.circles.update(circles =>
        circles.map(circle =>
          circle.id === selected.id
            ? {
                ...circle,
                center: { x: newX, y: newY }
              }
            : circle
        )
      );
    }

    this.redrawCanvas();

    // Emit updated properties after moving
    const selectedEntityInfo = this.selectedEntity();
    if (selectedEntityInfo) {
      this.emitEntitySelection(selectedEntityInfo);
    }
  }

  private moveSelectedEntityToPosition(position: Point) {
    const selected = this.selectedEntity();
    if (!selected) return;

    if (selected.type === 'line') {
      this.lines.update(lines =>
        lines.map(line => {
          if (line.id !== selected.id) return line;

          // Calculate the offset to move the line
          const dx = position.x - line.start.x;
          const dy = position.y - line.start.y;

          return {
            ...line,
            start: { x: position.x, y: position.y },
            end: {
              x: line.end.x + dx,
              y: line.end.y + dy
            }
          };
        })
      );
    } else if (selected.type === 'rectangle') {
      this.rectangles.update(rectangles =>
        rectangles.map(rectangle => {
          if (rectangle.id !== selected.id) return rectangle;

          // Calculate the offset to move the rectangle
          const dx = position.x - rectangle.start.x;
          const dy = position.y - rectangle.start.y;

          return {
            ...rectangle,
            start: { x: position.x, y: position.y },
            end: {
              x: rectangle.end.x + dx,
              y: rectangle.end.y + dy
            }
          };
        })
      );
    } else if (selected.type === 'circle') {
      this.circles.update(circles =>
        circles.map(circle =>
          circle.id === selected.id
            ? {
                ...circle,
                center: { x: position.x, y: position.y }
              }
            : circle
        )
      );
    }

    this.redrawCanvas();

    // Emit updated properties after moving
    const selectedEntityInfo = this.selectedEntity();
    if (selectedEntityInfo) {
      this.emitEntitySelection(selectedEntityInfo);
    }
  }

  private drawSelectionHighlight() {
    const selected = this.selectedEntity();
    if (!selected) return;

    const entity = this.getEntityData(selected);
    if (!entity) return;

    if (!this.ctx) return;

    this.ctx.strokeStyle = '#007bff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    if (selected.type === 'line') {
      const line = entity as Line;
      this.ctx.beginPath();
      this.ctx.moveTo(line.start.x, line.start.y);
      this.ctx.lineTo(line.end.x, line.end.y);
      this.ctx.stroke();
    } else if (selected.type === 'rectangle') {
      const rectangle = entity as Rectangle;
      const width = rectangle.end.x - rectangle.start.x;
      const height = rectangle.end.y - rectangle.start.y;
      this.ctx.strokeRect(rectangle.start.x, rectangle.start.y, width, height);
    } else if (selected.type === 'circle') {
      const circle = entity as Circle;
      this.ctx.beginPath();
      this.ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]);
    
    // Draw resize handles
    this.drawResizeHandles(selected, entity);
  }

  private drawResizeHandles(selected: {type: 'line' | 'rectangle' | 'circle', id: string}, entity: Line | Rectangle | Circle) {
    if (!this.ctx) return;

    this.ctx.fillStyle = '#007bff';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;

    if (selected.type === 'line') {
      const line = entity as Line;
      this.drawHandle(line.start.x, line.start.y, 'line-start');
      this.drawHandle(line.end.x, line.end.y, 'line-end');
    } else if (selected.type === 'rectangle') {
      const rectangle = entity as Rectangle;
      const minX = Math.min(rectangle.start.x, rectangle.end.x);
      const maxX = Math.max(rectangle.start.x, rectangle.end.x);
      const minY = Math.min(rectangle.start.y, rectangle.end.y);
      const maxY = Math.max(rectangle.start.y, rectangle.end.y);
      
      // Corner handles
      this.drawHandle(minX, minY, 'rect-top-left');
      this.drawHandle(maxX, minY, 'rect-top-right');
      this.drawHandle(minX, maxY, 'rect-bottom-left');
      this.drawHandle(maxX, maxY, 'rect-bottom-right');
    } else if (selected.type === 'circle') {
      const circle = entity as Circle;
      const { x: cx, y: cy } = circle.center;
      const r = circle.radius;
      // Axis-aligned handles: left/right (x-axis), top/bottom (y-axis)
      this.drawHandle(cx - r, cy, 'circle-left');
      this.drawHandle(cx + r, cy, 'circle-right');
      this.drawHandle(cx, cy - r, 'circle-top');
      this.drawHandle(cx, cy + r, 'circle-bottom');
    }
  }

  private drawHandle(x: number, y: number, _handleId: string) {
    if (!this.ctx) return;

    const size = this.handleSize;
    const halfSize = size / 2;

    // Draw handle
    this.ctx.fillRect(x - halfSize, y - halfSize, size, size);
    this.ctx.strokeRect(x - halfSize, y - halfSize, size, size);
  }

  private getHandleAtPoint(point: Point): string | null {
    const selected = this.selectedEntity();
    if (!selected) return null;

    const entity = this.getEntityData(selected);
    if (!entity) return null;

    if (selected.type === 'line') {
      const line = entity as Line;
      if (this.isPointNearHandle(point, line.start)) return 'line-start';
      if (this.isPointNearHandle(point, line.end)) return 'line-end';
    } else if (selected.type === 'rectangle') {
      const rectangle = entity as Rectangle;
      const minX = Math.min(rectangle.start.x, rectangle.end.x);
      const maxX = Math.max(rectangle.start.x, rectangle.end.x);
      const minY = Math.min(rectangle.start.y, rectangle.end.y);
      const maxY = Math.max(rectangle.start.y, rectangle.end.y);
      
      if (this.isPointNearHandle(point, { x: minX, y: minY })) return 'rect-top-left';
      if (this.isPointNearHandle(point, { x: maxX, y: minY })) return 'rect-top-right';
      if (this.isPointNearHandle(point, { x: minX, y: maxY })) return 'rect-bottom-left';
      if (this.isPointNearHandle(point, { x: maxX, y: maxY })) return 'rect-bottom-right';
    } else if (selected.type === 'circle') {
      const circle = entity as Circle;
      const { x: cx, y: cy } = circle.center;
      const r = circle.radius;
      if (this.isPointNearHandle(point, { x: cx - r, y: cy })) return 'circle-left';
      if (this.isPointNearHandle(point, { x: cx + r, y: cy })) return 'circle-right';
      if (this.isPointNearHandle(point, { x: cx, y: cy - r })) return 'circle-top';
      if (this.isPointNearHandle(point, { x: cx, y: cy + r })) return 'circle-bottom';
    }

    return null;
  }

  private isPointNearHandle(point: Point, handlePoint: Point): boolean {
    const distance = Math.sqrt(
      Math.pow(point.x - handlePoint.x, 2) + Math.pow(point.y - handlePoint.y, 2)
    );
    return distance <= this.handleSize;
  }

  private cursorForHandle(handle: string): string {
    switch (handle) {
      case 'rect-top-left':
      case 'rect-bottom-right':
        return 'nwse-resize';
      case 'rect-top-right':
      case 'rect-bottom-left':
        return 'nesw-resize';
      case 'circle-left':
      case 'circle-right':
        return 'ew-resize';
      case 'circle-top':
      case 'circle-bottom':
        return 'ns-resize';
      case 'line-start':
      case 'line-end':
        return 'grab';
      default:
        return 'crosshair';
    }
  }

  private setCanvasCursor(cursor: string) {
    const canvas = this.canvasElement?.nativeElement;
    if (canvas) {
      canvas.style.cursor = cursor;
    }
  }

  private resizeSelectedEntity(point: Point) {
    const selected = this.selectedEntity();
    if (!selected) return;

    const handle = this.resizeHandle();
    if (!handle) return;

    if (selected.type === 'line') {
      this.resizeLine(selected.id, handle, point);
    } else if (selected.type === 'rectangle') {
      this.resizeRectangle(selected.id, handle, point);
    } else if (selected.type === 'circle') {
      this.resizeCircle(selected.id, handle, point);
    }

    this.redrawCanvas();

    // Emit updated properties after resizing
    const selectedEntityInfo = this.selectedEntity();
    if (selectedEntityInfo) {
      this.emitEntitySelection(selectedEntityInfo);
    }
  }

  private resizeLine(lineId: string, handle: string, point: Point) {
    if (handle === 'line-start') {
      this.lines.update(lines => 
        lines.map(line => 
          line.id === lineId 
            ? { ...line, start: point }
            : line
        )
      );
    } else if (handle === 'line-end') {
      this.lines.update(lines => 
        lines.map(line => 
          line.id === lineId 
            ? { ...line, end: point }
            : line
        )
      );
    }
  }

  private resizeRectangle(rectangleId: string, handle: string, point: Point) {
    this.rectangles.update(rectangles => 
      rectangles.map(rectangle => {
        if (rectangle.id !== rectangleId) return rectangle;

        const currentMinX = Math.min(rectangle.start.x, rectangle.end.x);
        const currentMaxX = Math.max(rectangle.start.x, rectangle.end.x);
        const currentMinY = Math.min(rectangle.start.y, rectangle.end.y);
        const currentMaxY = Math.max(rectangle.start.y, rectangle.end.y);

        let newStart = { ...rectangle.start };
        let newEnd = { ...rectangle.end };

        switch (handle) {
          case 'rect-top-left':
            newStart = { x: currentMinX, y: currentMinY };
            newEnd = { x: currentMaxX, y: currentMaxY };
            newStart = point;
            break;
          case 'rect-top-right':
            newStart = { x: currentMinX, y: currentMinY };
            newEnd = { x: currentMaxX, y: currentMaxY };
            newEnd = { x: point.x, y: newStart.y };
            newStart = { x: newStart.x, y: point.y };
            break;
          case 'rect-bottom-left':
            newStart = { x: currentMinX, y: currentMinY };
            newEnd = { x: currentMaxX, y: currentMaxY };
            newStart = { x: point.x, y: newStart.y };
            newEnd = { x: newEnd.x, y: point.y };
            break;
          case 'rect-bottom-right':
            newStart = { x: currentMinX, y: currentMinY };
            newEnd = { x: currentMaxX, y: currentMaxY };
            newEnd = point;
            break;
        }

        return { ...rectangle, start: newStart, end: newEnd };
      })
    );
  }

  private resizeCircle(circleId: string, handle: string, point: Point) {
    this.circles.update(circles => 
      circles.map(circle => {
        if (circle.id !== circleId) return circle;

        const { x: cx, y: cy } = circle.center;

        let newRadius = circle.radius;
        switch (handle) {
          case 'circle-left':
            newRadius = Math.abs(point.x - cx);
            break;
          case 'circle-right':
            newRadius = Math.abs(point.x - cx);
            break;
          case 'circle-top':
            newRadius = Math.abs(point.y - cy);
            break;
          case 'circle-bottom':
            newRadius = Math.abs(point.y - cy);
            break;
        }

        return { ...circle, radius: Math.max(0, newRadius) };
      })
    );
  }

  /**
   * Emit entity selection event with calculated properties
   */
  private emitEntitySelection(entity: {type: 'line' | 'rectangle' | 'circle', id: string} | null) {
    if (!entity) {
      this.entitySelected.emit(null);
      return;
    }

    const entityData = this.getEntityData(entity);
    if (!entityData) {
      this.entitySelected.emit(null);
      return;
    }

    const canvas = this.canvasElement.nativeElement;
    const properties = EntityPropertyCalculator.calculateProperties(
      entityData,
      entity.type,
      canvas.height
    );

    this.entitySelected.emit(properties);
  }

  /**
   * Update entity based on property changes from properties panel
   */
  updateEntityFromProperties(update: PropertyUpdate) {
    if (!update.entityId || !update.entityType) return;

    const canvas = this.canvasElement.nativeElement;

    // Find the entity to update
    let entityData: Line | Rectangle | Circle | null = null;
    let entityIndex = -1;

    if (update.entityType === 'line') {
      entityIndex = this.lines().findIndex(line => line.id === update.entityId);
      if (entityIndex >= 0) {
        entityData = this.lines()[entityIndex];
      }
    } else if (update.entityType === 'rectangle') {
      entityIndex = this.rectangles().findIndex(rectangle => rectangle.id === update.entityId);
      if (entityIndex >= 0) {
        entityData = this.rectangles()[entityIndex];
      }
    } else if (update.entityType === 'circle') {
      entityIndex = this.circles().findIndex(circle => circle.id === update.entityId);
      if (entityIndex >= 0) {
        entityData = this.circles()[entityIndex];
      }
    }

    if (!entityData || entityIndex < 0) return;

    // Create updated properties
    const currentProperties = EntityPropertyCalculator.calculateProperties(
      entityData,
      update.entityType,
      canvas.height
    );

    const updatedProperties: EntityProperties = {
      ...currentProperties,
      ...update,
      id: update.entityId,
      type: update.entityType
    };

    // Convert properties back to entity data
    const updatedEntity = EntityPropertyCalculator.updateEntityFromProperties(
      entityData,
      update.entityType,
      updatedProperties,
      canvas.height
    );

    // Update the entity in the appropriate array
    if (update.entityType === 'line') {
      this.lines.update(lines =>
        lines.map((line, index) =>
          index === entityIndex ? updatedEntity as Line : line
        )
      );
    } else if (update.entityType === 'rectangle') {
      this.rectangles.update(rectangles =>
        rectangles.map((rectangle, index) =>
          index === entityIndex ? updatedEntity as Rectangle : rectangle
        )
      );
    } else if (update.entityType === 'circle') {
      this.circles.update(circles =>
        circles.map((circle, index) =>
          index === entityIndex ? updatedEntity as Circle : circle
        )
      );
    }

    // Redraw canvas and emit updated properties
    this.redrawCanvas();

    // Re-emit updated properties to sync with properties panel
    const selectedEntityInfo = this.selectedEntity();
    if (selectedEntityInfo && selectedEntityInfo.id === update.entityId) {
      this.emitEntitySelection(selectedEntityInfo);
    }
  }

  /**
   * Apply snapping to a point if near anchor points
   */
  private applySnapping(point: Point, excludeEntityId?: string): SnapResult {
    if (!this.snapEnabled()) {
      return {
        snapped: false,
        snapPoint: point
      };
    }

    return AnchorPointCalculator.snapToNearestAnchor(
      point,
      this.lines(),
      this.rectangles(),
      this.circles(),
      excludeEntityId
    );
  }

  /**
   * Get all current anchor points
   */
  private getAllAnchorPoints(): AnchorPoint[] {
    return AnchorPointCalculator.getAllAnchorPoints(
      this.lines(),
      this.rectangles(),
      this.circles()
    );
  }

  /**
   * Draw anchor points for selected entities and hovered anchor points
   */
  private drawAnchorPoints() {
    if (!this.ctx || !this.showAnchorPoints()) return;

    const selectedEntity = this.selectedEntity();
    const hoveredAnchors = this.hoveredAnchorPoints();
    const currentSnapPoint = this.currentSnapPoint();

    // Draw anchor points for selected entity (orange)
    if (selectedEntity) {
      const allAnchors = this.getAllAnchorPoints();
      const selectedEntityAnchors = allAnchors.filter(anchor =>
        anchor.entityId === selectedEntity.id
      );

      this.ctx.fillStyle = '#ff6b35'; // Orange for selected entity anchors
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;

      selectedEntityAnchors.forEach(anchor => {
        this.drawAnchorPoint(anchor.point);
      });
    }

    // Draw hovered anchor points (blue) - exclude the currently snapped point
    hoveredAnchors.forEach(anchor => {
      // Don't draw hovered if it's the currently snapped point (will be drawn green in drawSnapIndicator)
      if (!currentSnapPoint || anchor.id !== currentSnapPoint.id) {
        // Don't draw if it's already shown as selected entity anchor
        if (!selectedEntity || anchor.entityId !== selectedEntity.id) {
          if (this.ctx) {
            // Draw the anchor point in blue for hover state
            this.ctx.fillStyle = '#007bff'; // Blue for hovered anchor point
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.drawAnchorPoint(anchor.point);

            // Draw a larger blue circle around the hovered anchor point
            this.ctx.strokeStyle = '#007bff';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]);

            const radius = 6;
            this.ctx.beginPath();
            this.ctx.arc(anchor.point.x, anchor.point.y, radius, 0, 2 * Math.PI);
            this.ctx.stroke();
          }
        }
      }
    });
  }

  /**
   * Draw a single anchor point
   */
  private drawAnchorPoint(point: Point) {
    if (!this.ctx) return;

    const size = this.anchorPointSize;
    const halfSize = size / 2;

    // Draw small square for anchor point
    this.ctx.fillRect(point.x - halfSize, point.y - halfSize, size, size);
    this.ctx.strokeRect(point.x - halfSize, point.y - halfSize, size, size);
  }

  /**
   * Draw snap indicator when currently snapping
   */
  private drawSnapIndicator() {
    if (!this.ctx) return;

    const snapPoint = this.currentSnapPoint();
    if (!snapPoint) return;

    // Draw the anchor point in green for snapped state
    this.ctx.fillStyle = '#00ff00'; // Green for snapped anchor point
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.drawAnchorPoint(snapPoint.point);

    // Draw a larger highlight circle around the snap point
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([]);

    const radius = 8;
    this.ctx.beginPath();
    this.ctx.arc(snapPoint.point.x, snapPoint.point.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();

    // Draw cross hair
    const crossSize = 12;
    this.ctx.beginPath();
    this.ctx.moveTo(snapPoint.point.x - crossSize, snapPoint.point.y);
    this.ctx.lineTo(snapPoint.point.x + crossSize, snapPoint.point.y);
    this.ctx.moveTo(snapPoint.point.x, snapPoint.point.y - crossSize);
    this.ctx.lineTo(snapPoint.point.x, snapPoint.point.y + crossSize);
    this.ctx.stroke();
  }
}
