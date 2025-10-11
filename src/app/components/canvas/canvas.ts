import { Component, ChangeDetectionStrategy, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, output } from '@angular/core';
import { EntityProperties, EntityPropertyCalculator, PropertyUpdate } from '../../types/entity-properties';
import { AnchorPoint, AnchorPointCalculator, SnapResult } from '../../types/anchor-points';
import { Line, Rectangle, Circle, Point, LinearDimension } from '../../types/geometry';
import { AppStore } from '../../state/app.store';

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasElement', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;
  
  private appStore = inject(AppStore);
  private elementRef = inject(ElementRef);
  
  protected readonly isDrawing = signal(false);
  protected readonly currentTool = signal('select');
  protected readonly lines = signal<Line[]>([]);
  protected readonly rectangles = signal<Rectangle[]>([]);
  protected readonly circles = signal<Circle[]>([]);
  protected readonly dimensions = signal<LinearDimension[]>([]);
  protected readonly currentLine = signal<Partial<Line> | null>(null);
  protected readonly currentRectangle = signal<Partial<Rectangle> | null>(null);
  protected readonly currentCircle = signal<Partial<Circle> | null>(null);
  protected readonly currentDimension = signal<Partial<LinearDimension> | null>(null);
  
  // Selection state
  protected readonly selectedEntity = signal<{type: 'line' | 'rectangle' | 'circle', id: string} | null>(null);
  protected readonly selectedEntities = signal<Array<{type: 'line' | 'rectangle' | 'circle', id: string}>>([]);
  protected readonly isDragging = signal(false);
  protected readonly dragOffset = signal<Point | null>(null);

  // Selection box state
  protected readonly isDrawingSelectionBox = signal(false);
  protected readonly selectionBoxStart = signal<Point | null>(null);
  protected readonly selectionBoxEnd = signal<Point | null>(null);
  
  // Resize handle state
  protected readonly isResizing = signal(false);
  protected readonly resizeHandle = signal<string | null>(null);
  protected readonly handleSize = 8; // Size of resize handles in pixels

  // Rotation handle state
  protected readonly isRotating = signal(false);
  protected readonly rotationStartAngle = signal<number>(0);
  protected readonly rotationHandleSize = 8; // Size of rotation handle in pixels

  // Anchor point state
  protected readonly showAnchorPoints = signal(true);
  protected readonly currentSnapPoint = signal<AnchorPoint | null>(null);
  protected readonly hoveredAnchorPoints = signal<AnchorPoint[]>([]);
  protected readonly anchorPointSize = 4; // Size of anchor point indicators

  // Pan state
  protected readonly isPanning = signal(false);
  protected readonly panStartPoint = signal<Point | null>(null);

  // Dimension placement state
  protected readonly dimensionPlacementStep = signal<number>(0); // 0: none, 1: start set, 2: end set (adjusting offset)

  // Cursor tracking for paste operations
  private lastCursorPosition = signal<Point | null>(null);

  private ctx: CanvasRenderingContext2D | null = null;
  private startPoint: Point | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private keyboardListener: ((event: KeyboardEvent) => void) | undefined;

  // Output events
  entitySelected = output<EntityProperties | null>();

  ngAfterViewInit() {
    this.initializeCanvas();
    this.setupKeyboardListeners();
    this.setupWheelListener();
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
      // Ctrl+C to copy
      if (event.ctrlKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        this.copySelectedEntity();
      }
      // Ctrl+V to paste
      if (event.ctrlKey && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        this.pasteEntity();
      }
      // Ctrl+D to delete
      if (event.ctrlKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        this.deleteSelectedEntities();
      }
      // Ctrl+Q to freeze/unfreeze
      if (event.ctrlKey && event.key.toLowerCase() === 'q') {
        event.preventDefault();
        const selected = this.selectedEntity();
        if (selected) {
          const entityData = this.getEntityData(selected);
          if (entityData?.frozen) {
            this.unfreezeSelectedEntity();
          } else {
            this.freezeSelectedEntity();
          }
        }
      }
      // Ctrl+0 to reset view
      if (event.ctrlKey && event.key === '0') {
        event.preventDefault();
        this.appStore.resetView();
        this.redrawCanvas();
      }
      // Escape to cancel current operation
      if (event.key === 'Escape') {
        event.preventDefault();
        this.cancelCurrentOperation();
      }
    };

    document.addEventListener('keydown', this.keyboardListener);
  }

  private cancelCurrentOperation() {
    // Cancel dimension placement
    if (this.currentTool() === 'dimension') {
      this.currentDimension.set(null);
      this.dimensionPlacementStep.set(0);
    }

    // Cancel other drawing operations
    this.currentLine.set(null);
    this.currentRectangle.set(null);
    this.currentCircle.set(null);
    this.isDrawing.set(false);
    this.startPoint = null;
    this.currentSnapPoint.set(null);

    this.redrawCanvas();
  }

  private setupWheelListener() {
    const canvas = this.canvasElement.nativeElement;

    canvas.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Calculate zoom change (negative deltaY means zoom in)
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const currentZoom = this.appStore.zoom();
      const newZoom = currentZoom * zoomFactor;

      // Get current pan offset
      const currentPan = this.appStore.panOffset();

      // Calculate the point in world coordinates before zoom
      const worldX = (mouseX - currentPan.x) / currentZoom;
      const worldY = (mouseY - currentPan.y) / currentZoom;

      // Calculate new pan offset to keep mouse position fixed
      const newPanX = mouseX - worldX * newZoom;
      const newPanY = mouseY - worldY * newZoom;

      // Update zoom and pan
      this.appStore.setZoom(newZoom);
      this.appStore.setPanOffset({ x: newPanX, y: newPanY });

      this.redrawCanvas();
    }, { passive: false });
  }

  private removeKeyboardListeners() {
    if (this.keyboardListener) {
      document.removeEventListener('keydown', this.keyboardListener);
    }
  }

  /**
   * Convert screen coordinates to world coordinates (accounting for pan and zoom)
   */
  private screenToWorld(screenPoint: Point): Point {
    const zoom = this.appStore.zoom();
    const pan = this.appStore.panOffset();

    return {
      x: (screenPoint.x - pan.x) / zoom,
      y: (screenPoint.y - pan.y) / zoom
    };
  }

  /**
   * Convert world coordinates to screen coordinates (accounting for pan and zoom)
   */
  private worldToScreen(worldPoint: Point): Point {
    const zoom = this.appStore.zoom();
    const pan = this.appStore.panOffset();

    return {
      x: worldPoint.x * zoom + pan.x,
      y: worldPoint.y * zoom + pan.y
    };
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

    // Draw origin indicator at bottom-left (0,0)
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.lineWidth = 2;

    // Draw X axis indicator (horizontal line from origin)
    this.ctx.beginPath();
    this.ctx.moveTo(0, canvas.height);
    this.ctx.lineTo(40, canvas.height);
    this.ctx.stroke();

    // Draw Y axis indicator (vertical line from origin)
    this.ctx.beginPath();
    this.ctx.moveTo(0, canvas.height);
    this.ctx.lineTo(0, canvas.height - 40);
    this.ctx.stroke();

    // Draw origin point
    this.ctx.beginPath();
    this.ctx.arc(0, canvas.height, 4, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw axis labels
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillText('X', 45, canvas.height + 4);
    this.ctx.fillText('Y', 4, canvas.height - 45);
    this.ctx.fillText('(0,0)', 8, canvas.height - 8);
  }

  protected onMouseDown(event: MouseEvent) {
    const tool = this.currentTool();
    const rect = this.canvasElement.nativeElement.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const screenPoint = { x: screenX, y: screenY };

    // Middle mouse button for panning
    if (event.button === 1) {
      event.preventDefault();
      this.isPanning.set(true);
      this.panStartPoint.set(screenPoint);
      this.setCanvasCursor('grabbing');
      return;
    }

    // Convert to world coordinates for entity interaction
    const point = this.screenToWorld(screenPoint);

    if (tool === 'select') {
      // Check if selected entity is frozen
      const selected = this.selectedEntity();
      const isFrozen = selected ? this.getEntityData(selected)?.frozen : false;

      // Check if clicking on rotation handle first (only if not frozen)
      if (!isFrozen && this.isPointNearRotationHandle(point)) {
        this.isRotating.set(true);
        const center = this.getEntityCenter();
        if (center) {
          // Calculate initial angle from center to mouse position
          const angle = Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI);
          this.rotationStartAngle.set(angle);
        }
        this.setCanvasCursor('grabbing');
        return;
      }

      // Check if clicking on a resize handle (only if not frozen)
      if (!isFrozen) {
        const handle = this.getHandleAtPoint(point);
        if (handle) {
          this.isResizing.set(true);
          this.resizeHandle.set(handle);
          this.startPoint = point;
          this.setCanvasCursor('grabbing');
          return;
        }
      }

      // Handle selection and dragging
      const entity = this.findEntityAtPoint(point);

      if (entity) {
        // Clicking on an entity
        this.selectedEntity.set(entity);
        this.selectedEntities.set([entity]);
        this.emitEntitySelection(entity);

        // Check if entity is frozen before allowing drag
        const entityData = this.getEntityData(entity);
        if (entityData && !entityData.frozen) {
          this.isDragging.set(true);
          this.startPoint = point;

          // Calculate drag offset for smooth movement
          const offset = this.calculateDragOffset(point, entityData);
          this.dragOffset.set(offset);
        }
      } else {
        // Clicking on empty space - start selection box
        this.selectedEntity.set(null);
        this.selectedEntities.set([]);
        this.emitEntitySelection(null);

        this.isDrawingSelectionBox.set(true);
        this.selectionBoxStart.set(point);
        this.selectionBoxEnd.set(point);
        this.startPoint = point;
      }
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle' || tool === 'dimension') {
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
      } else if (tool === 'dimension') {
        // Dimension tool has multi-step placement
        const step = this.dimensionPlacementStep();

        if (step === 0) {
          // First click: set start point
          const newDimension: Partial<LinearDimension> = {
            id: Date.now().toString(),
            start: snappedPoint,
            color: '#000000',
            textSize: 12,
            offset: 20 // Default offset from the line
          };
          this.currentDimension.set(newDimension);
          this.dimensionPlacementStep.set(1);
          this.isDrawing.set(true);
        } else if (step === 1) {
          // Second click: set end point, move to offset adjustment
          this.currentDimension.update(dim => dim ? { ...dim, end: snappedPoint } : dim);
          this.dimensionPlacementStep.set(2);
          // Keep isDrawing true to continue showing preview
        } else if (step === 2) {
          // Third click: finalize dimension (handled here, not in onMouseUp)
          const currentDim = this.currentDimension();
          if (currentDim && currentDim.start && currentDim.end) {
            const completedDimension: LinearDimension = {
              id: currentDim.id || Date.now().toString(),
              start: currentDim.start,
              end: currentDim.end,
              color: currentDim.color || '#000000',
              textSize: currentDim.textSize || 12,
              offset: currentDim.offset || 20
            };
            this.dimensions.update(dimensions => [...dimensions, completedDimension]);
            this.currentDimension.set(null);
            this.dimensionPlacementStep.set(0);
            this.isDrawing.set(false);
          }
        }
      }
    }
  }

  protected onMouseMove(event: MouseEvent) {
    const rect = this.canvasElement.nativeElement.getBoundingClientRect();
    const canvas = this.canvasElement.nativeElement;
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const screenPoint = { x: screenX, y: screenY };

    // Handle panning (use screen coordinates)
    if (this.isPanning()) {
      const panStart = this.panStartPoint();
      if (panStart) {
        const currentPan = this.appStore.panOffset();
        const dx = screenPoint.x - panStart.x;
        const dy = screenPoint.y - panStart.y;

        this.appStore.setPanOffset({
          x: currentPan.x + dx,
          y: currentPan.y + dy
        });

        this.panStartPoint.set(screenPoint);
        this.redrawCanvas();
      }
      return;
    }

    // Convert to world coordinates for entity interaction
    const point = this.screenToWorld(screenPoint);

    // Track cursor position for paste operations (in world coordinates)
    this.lastCursorPosition.set(point);

    // Emit mouse position for footer display (convert world coords to bottom-left origin)
    const bottomLeftX = Math.round(point.x);
    const bottomLeftY = Math.round(canvas.height - point.y);
    this.appStore.updateMousePosition({ x: bottomLeftX, y: bottomLeftY });

    if (this.isDrawingSelectionBox()) {
      // Handle drawing selection box
      this.selectionBoxEnd.set(point);
      this.redrawCanvas();
    } else if (this.isRotating() && this.selectedEntity()) {
      // Handle rotating selected entity
      const center = this.getEntityCenter();
      if (center) {
        // Calculate current angle from center to mouse position
        const currentAngle = Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI);
        const startAngle = this.rotationStartAngle();
        const angleDelta = currentAngle - startAngle;

        // Update entity rotation
        this.rotateSelectedEntity(angleDelta);

        // Update start angle for next frame
        this.rotationStartAngle.set(currentAngle);
      }
      this.setCanvasCursor('grabbing');
    } else if (this.isResizing() && this.selectedEntity()) {
      // Handle resizing selected entity with snapping
      const selected = this.selectedEntity();
      const snapResult = this.applySnapping(point, selected?.id);
      const snappedPoint = snapResult.snapPoint;
      this.currentSnapPoint.set(snapResult.anchorPoint || null);
      this.hoveredAnchorPoints.set([]);

      this.resizeSelectedEntity(snappedPoint);
      this.setCanvasCursor('grabbing');
    } else if (this.isDragging() && this.selectedEntity()) {
      // Handle dragging selected entity with entity-to-entity snapping
      const selected = this.selectedEntity();
      if (!selected) return;

      // Calculate the new position based on drag offset first
      const offset = this.dragOffset();
      if (!offset) return;

      const newPosition = {
        x: point.x - offset.x,
        y: point.y - offset.y
      };

      // First move entity to the new position (temporarily)
      this.moveSelectedEntityToPosition(newPosition);

      // Try entity-to-entity snapping (snap anchor points between entities)
      const entitySnap = this.applyEntitySnapping(selected.id, selected.type);

      if (entitySnap) {
        // Apply the snap offset
        const snappedPosition = {
          x: newPosition.x + entitySnap.offset.x,
          y: newPosition.y + entitySnap.offset.y
        };
        this.moveSelectedEntityToPosition(snappedPosition);
        this.currentSnapPoint.set(entitySnap.snapPoint);
      } else {
        // No entity snap found, keep the position as calculated
        this.currentSnapPoint.set(null);
      }

      this.hoveredAnchorPoints.set([]);
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

      // Update the current drawing entity with the snapped point
      if (tool === 'line') {
        this.currentLine.update(line => line ? { ...line, end: snappedPoint } : line);
      } else if (tool === 'rectangle') {
        this.currentRectangle.update(rect => rect ? { ...rect, end: snappedPoint } : rect);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(snappedPoint.x - this.startPoint.x, 2) + Math.pow(snappedPoint.y - this.startPoint.y, 2)
        );
        this.currentCircle.update(circle => circle ? { ...circle, radius } : circle);
      } else if (tool === 'dimension') {
        const step = this.dimensionPlacementStep();

        if (step === 1) {
          // Moving to set end point
          this.currentDimension.update(dim => dim ? { ...dim, end: snappedPoint } : dim);
        } else if (step === 2) {
          // Adjusting offset based on mouse position
          const currentDim = this.currentDimension();
          if (currentDim && currentDim.start && currentDim.end) {
            // Calculate perpendicular offset from mouse position to the dimension line
            const offset = this.calculateDimensionOffset(currentDim.start, currentDim.end, point);
            this.currentDimension.update(dim => dim ? { ...dim, offset } : dim);
          }
        }
      }

      this.redrawCanvas();
    } else {
      // Update cursor when hovering over handles (not dragging/resizing/rotating)
      if (this.isPointNearRotationHandle(point)) {
        this.setCanvasCursor('grab');
        this.currentSnapPoint.set(null);
        this.hoveredAnchorPoints.set([]);
      } else {
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
  }

  protected onMouseUp(event: MouseEvent) {
    // End panning
    if (this.isPanning()) {
      this.isPanning.set(false);
      this.panStartPoint.set(null);
      this.setCanvasCursor('crosshair');
      return;
    }

    if (this.isDrawingSelectionBox()) {
      // Finish selection box
      this.isDrawingSelectionBox.set(false);
      const start = this.selectionBoxStart();
      const end = this.selectionBoxEnd();

      if (start && end) {
        // Find all entities within the selection box
        const selected = this.findEntitiesInBox(start, end);
        this.selectedEntities.set(selected);

        // If only one entity selected, set it as the selected entity for properties panel
        if (selected.length === 1) {
          this.selectedEntity.set(selected[0]);
          this.emitEntitySelection(selected[0]);
        } else if (selected.length === 0) {
          this.selectedEntity.set(null);
          this.emitEntitySelection(null);
        } else {
          // Multiple entities selected - for now just show the first one
          // TODO: Update properties panel to handle multiple selections
          this.selectedEntity.set(selected[0]);
          this.emitEntitySelection(selected[0]);
        }
      }

      this.selectionBoxStart.set(null);
      this.selectionBoxEnd.set(null);
      this.redrawCanvas();
    } else if (this.isRotating()) {
      // Finish rotating
      this.isRotating.set(false);
      this.setCanvasCursor('crosshair');
    } else if (this.isResizing()) {
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
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;
      const screenPoint = { x: screenX, y: screenY };
      const endPoint = this.screenToWorld(screenPoint);

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

      // Reset drawing state for completed drawings (non-dimension tools)
      if (tool !== 'dimension') {
        this.isDrawing.set(false);
        this.startPoint = null;
        this.currentSnapPoint.set(null);
      }
    }
    
    this.redrawCanvas();
  }

  private drawCurrentPreview() {
    if (!this.ctx) return;

    const currentLine = this.currentLine();
    const currentRectangle = this.currentRectangle();
    const currentCircle = this.currentCircle();
    const currentDimension = this.currentDimension();

    if (currentLine && currentLine.start && currentLine.end) {
      this.drawPreviewLine(currentLine.start, currentLine.end);
    } else if (currentRectangle && currentRectangle.start && currentRectangle.end) {
      this.drawPreviewRectangle(currentRectangle.start, currentRectangle.end);
    } else if (currentCircle && currentCircle.center && currentCircle.radius !== undefined) {
      this.drawPreviewCircleByRadius(currentCircle.center, currentCircle.radius);
    } else if (currentDimension && currentDimension.start && currentDimension.end) {
      this.drawPreviewDimension(currentDimension.start, currentDimension.end, currentDimension.offset || 20);
    }
  }

  private drawSelectionBox() {
    if (!this.ctx) return;

    const start = this.selectionBoxStart();
    const end = this.selectionBoxEnd();

    if (!start || !end) return;

    const width = end.x - start.x;
    const height = end.y - start.y;

    // Draw semi-transparent fill
    this.ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
    this.ctx.fillRect(start.x, start.y, width, height);

    // Draw dashed border (adjust line width for zoom)
    const zoom = this.appStore.zoom();
    this.ctx.strokeStyle = '#007bff';
    this.ctx.lineWidth = 1 / zoom;
    this.ctx.setLineDash([5 / zoom, 5 / zoom]);
    this.ctx.strokeRect(start.x, start.y, width, height);
    this.ctx.setLineDash([]);
  }

  private drawPreviewLine(start: Point, end: Point) {
    if (!this.ctx) return;

    const zoom = this.appStore.zoom();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 / zoom;
    this.ctx.setLineDash([5 / zoom, 5 / zoom]);

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  private drawPreviewRectangle(start: Point, end: Point) {
    if (!this.ctx) return;

    const zoom = this.appStore.zoom();
    const width = end.x - start.x;
    const height = end.y - start.y;

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 / zoom;
    this.ctx.setLineDash([5 / zoom, 5 / zoom]);

    this.ctx.strokeRect(start.x, start.y, width, height);

    this.ctx.setLineDash([]);
  }

  private drawPreviewCircle(center: Point, end: Point) {
    if (!this.ctx) return;

    const zoom = this.appStore.zoom();
    const radius = Math.sqrt(
      Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2)
    );

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 / zoom;
    this.ctx.setLineDash([5 / zoom, 5 / zoom]);

    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  private drawPreviewCircleByRadius(center: Point, radius: number) {
    if (!this.ctx) return;

    const zoom = this.appStore.zoom();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 / zoom;
    this.ctx.setLineDash([5 / zoom, 5 / zoom]);

    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  private drawPreviewDimension(start: Point, end: Point, offset: number) {
    if (!this.ctx) return;

    const zoom = this.appStore.zoom();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1 / zoom;
    this.ctx.setLineDash([5 / zoom, 5 / zoom]);

    this.drawDimensionGeometry(start, end, offset, '#000000', 12);

    this.ctx.setLineDash([]);
  }

  private redrawCanvas() {
    if (!this.ctx) return;

    const canvas = this.canvasElement.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    this.ctx.save();

    // Apply pan and zoom transforms
    const zoom = this.appStore.zoom();
    const pan = this.appStore.panOffset();
    this.ctx.translate(pan.x, pan.y);
    this.ctx.scale(zoom, zoom);

    this.drawGrid();
    this.drawAllLines();
    this.drawAllRectangles();
    this.drawAllCircles();
    this.drawAllDimensions();
    this.drawCurrentPreview();
    this.drawSelectionHighlight();
    this.drawSelectionBox();
    this.drawAnchorPoints();
    this.drawSnapIndicator();

    // Restore context state
    this.ctx.restore();
  }

  private drawAllLines() {
    if (!this.ctx) return;

    this.lines().forEach(line => {
      this.ctx!.save();

      // Apply rotation if present
      if (line.rotation) {
        const centerX = (line.start.x + line.end.x) / 2;
        const centerY = (line.start.y + line.end.y) / 2;
        this.ctx!.translate(centerX, centerY);
        this.ctx!.rotate((line.rotation * Math.PI) / 180);
        this.ctx!.translate(-centerX, -centerY);
      }

      this.ctx!.strokeStyle = line.color;
      this.ctx!.lineWidth = line.width;
      this.ctx!.setLineDash([]);

      this.ctx!.beginPath();
      this.ctx!.moveTo(line.start.x, line.start.y);
      this.ctx!.lineTo(line.end.x, line.end.y);
      this.ctx!.stroke();

      this.ctx!.restore();
    });
  }

  private drawAllRectangles() {
    if (!this.ctx) return;

    this.rectangles().forEach(rectangle => {
      this.ctx!.save();

      const width = rectangle.end.x - rectangle.start.x;
      const height = rectangle.end.y - rectangle.start.y;

      // Apply rotation if present
      if (rectangle.rotation) {
        const centerX = rectangle.start.x + width / 2;
        const centerY = rectangle.start.y + height / 2;
        this.ctx!.translate(centerX, centerY);
        this.ctx!.rotate((rectangle.rotation * Math.PI) / 180);
        this.ctx!.translate(-centerX, -centerY);
      }

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

      this.ctx!.restore();
    });
  }

  private drawAllCircles() {
    if (!this.ctx) return;

    this.circles().forEach(circle => {
      this.ctx!.save();

      // Apply rotation if present (note: rotation doesn't visually affect circles,
      // but we store it for consistency)
      if (circle.rotation) {
        this.ctx!.translate(circle.center.x, circle.center.y);
        this.ctx!.rotate((circle.rotation * Math.PI) / 180);
        this.ctx!.translate(-circle.center.x, -circle.center.y);
      }

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

      this.ctx!.restore();
    });
  }

  private drawAllDimensions() {
    if (!this.ctx) return;

    this.dimensions().forEach(dimension => {
      this.drawDimensionGeometry(dimension.start, dimension.end, dimension.offset, dimension.color, dimension.textSize);
    });
  }

  private drawDimensionGeometry(start: Point, end: Point, offset: number, color: string, textSize: number) {
    if (!this.ctx) return;

    const zoom = this.appStore.zoom();

    // Calculate the direction vector and perpendicular vector
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return;

    // Normalize direction vector
    const dirX = dx / length;
    const dirY = dy / length;

    // Perpendicular vector (rotated 90 degrees)
    const perpX = -dirY;
    const perpY = dirX;

    // Calculate offset points
    const offsetStartX = start.x + perpX * offset;
    const offsetStartY = start.y + perpY * offset;
    const offsetEndX = end.x + perpX * offset;
    const offsetEndY = end.y + perpY * offset;

    // Draw extension lines
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1 / zoom;
    this.ctx.setLineDash([]);

    // Extension line from start point
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(offsetStartX + perpX * 5, offsetStartY + perpY * 5);
    this.ctx.stroke();

    // Extension line from end point
    this.ctx.beginPath();
    this.ctx.moveTo(end.x, end.y);
    this.ctx.lineTo(offsetEndX + perpX * 5, offsetEndY + perpY * 5);
    this.ctx.stroke();

    // Draw dimension line
    this.ctx.beginPath();
    this.ctx.moveTo(offsetStartX, offsetStartY);
    this.ctx.lineTo(offsetEndX, offsetEndY);
    this.ctx.stroke();

    // Draw arrows
    const arrowSize = 10 / zoom;
    this.drawArrow(offsetStartX, offsetStartY, dirX, dirY, arrowSize, color);
    this.drawArrow(offsetEndX, offsetEndY, -dirX, -dirY, arrowSize, color);

    // Draw text
    const midX = (offsetStartX + offsetEndX) / 2;
    const midY = (offsetStartY + offsetEndY) / 2;

    this.ctx.save();
    this.ctx.translate(midX, midY);

    // Calculate angle for text rotation
    let angle = Math.atan2(dy, dx);
    // Keep text upright
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
      angle += Math.PI;
    }
    this.ctx.rotate(angle);

    // Scale text to maintain constant size
    this.ctx.scale(1 / zoom, 1 / zoom);

    this.ctx.font = `${textSize}px Arial`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';

    const dimensionText = length.toFixed(1);
    this.ctx.fillText(dimensionText, 0, -3);

    this.ctx.restore();
  }

  private drawArrow(x: number, y: number, dirX: number, dirY: number, size: number, color: string) {
    if (!this.ctx) return;

    const zoom = this.appStore.zoom();

    // Arrow head points
    const angle = 25 * (Math.PI / 180); // 25 degree arrow

    const leftX = x - size * (dirX * Math.cos(angle) - dirY * Math.sin(angle));
    const leftY = y - size * (dirX * Math.sin(angle) + dirY * Math.cos(angle));

    const rightX = x - size * (dirX * Math.cos(-angle) - dirY * Math.sin(-angle));
    const rightY = y - size * (dirX * Math.sin(-angle) + dirY * Math.cos(-angle));

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(leftX, leftY);
    this.ctx.lineTo(rightX, rightY);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Calculate the perpendicular offset distance from a point to a line
   * Returns signed distance (positive/negative indicates which side)
   */
  private calculateDimensionOffset(start: Point, end: Point, mousePoint: Point): number {
    // Direction vector
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return 20; // Default offset

    // Normalize direction vector
    const dirX = dx / length;
    const dirY = dy / length;

    // Perpendicular vector (rotated 90 degrees)
    const perpX = -dirY;
    const perpY = dirX;

    // Vector from start to mouse
    const toMouseX = mousePoint.x - start.x;
    const toMouseY = mousePoint.y - start.y;

    // Project onto perpendicular vector to get signed distance
    const offset = toMouseX * perpX + toMouseY * perpY;

    return offset;
  }

  setTool(tool: string) {
    // Cancel any ongoing operations when switching tools
    this.cancelCurrentOperation();
    this.currentTool.set(tool);
  }

  toggleSnap() {
    this.appStore.toggleSnap();
  }

  toggleOrtho() {
    this.appStore.toggleOrtho()
  }

  deleteSelectedEntities() {
    const selected = this.selectedEntities();
    if (selected.length === 0) return;

    // Track deleted entities for potential undo
    const deletedEntities = selected.map(entity => {
      const entityData = this.getEntityData(entity);
      if (!entityData) return null;

      return {
        type: entity.type,
        data: entityData
      };
    }).filter(e => e !== null) as Array<{type: 'line' | 'rectangle' | 'circle', data: Line | Rectangle | Circle}>;

    // Add to delete history
    this.appStore.addDeletedEntities(deletedEntities);

    // Remove entities from their respective arrays
    const selectedIds = new Set(selected.map(e => e.id));

    this.lines.update(lines => lines.filter(line => !selectedIds.has(line.id)));
    this.rectangles.update(rectangles => rectangles.filter(rect => !selectedIds.has(rect.id)));
    this.circles.update(circles => circles.filter(circle => !selectedIds.has(circle.id)));

    // Clear selection
    this.selectedEntity.set(null);
    this.selectedEntities.set([]);
    this.emitEntitySelection(null);

    // Redraw canvas
    this.redrawCanvas();
  }

  freezeSelectedEntity() {
    const selected = this.selectedEntity();
    if (!selected) return;

    if (selected.type === 'line') {
      this.lines.update(lines =>
        lines.map(line =>
          line.id === selected.id ? { ...line, frozen: true } : line
        )
      );
    } else if (selected.type === 'rectangle') {
      this.rectangles.update(rectangles =>
        rectangles.map(rectangle =>
          rectangle.id === selected.id ? { ...rectangle, frozen: true } : rectangle
        )
      );
    } else if (selected.type === 'circle') {
      this.circles.update(circles =>
        circles.map(circle =>
          circle.id === selected.id ? { ...circle, frozen: true } : circle
        )
      );
    }

    this.redrawCanvas();
    this.emitEntitySelection(selected);
  }

  unfreezeSelectedEntity() {
    const selected = this.selectedEntity();
    if (!selected) return;

    if (selected.type === 'line') {
      this.lines.update(lines =>
        lines.map(line =>
          line.id === selected.id ? { ...line, frozen: false } : line
        )
      );
    } else if (selected.type === 'rectangle') {
      this.rectangles.update(rectangles =>
        rectangles.map(rectangle =>
          rectangle.id === selected.id ? { ...rectangle, frozen: false } : rectangle
        )
      );
    } else if (selected.type === 'circle') {
      this.circles.update(circles =>
        circles.map(circle =>
          circle.id === selected.id ? { ...circle, frozen: false } : circle
        )
      );
    }

    this.redrawCanvas();
    this.emitEntitySelection(selected);
  }

  copySelectedEntity() {
    const selected = this.selectedEntity();
    if (!selected) return;

    const entityData = this.getEntityData(selected);
    if (entityData) {
      this.appStore.copyEntity(entityData);
    }
  }

  pasteEntity() {
    const clipboardEntity = this.appStore.clipboardEntity();
    if (!clipboardEntity) return;

    const cursorPos = this.lastCursorPosition();
    const newId = Date.now().toString();

    // Calculate entity center and offset from cursor position
    let pastePosition: Point;

    if (cursorPos) {
      // Use cursor position if available
      pastePosition = cursorPos;
    } else {
      // Fallback to center of canvas if cursor position not tracked
      const canvas = this.canvasElement.nativeElement;
      pastePosition = { x: canvas.width / 2, y: canvas.height / 2 };
    }

    if ('start' in clipboardEntity && 'end' in clipboardEntity) {
      // Line or Rectangle - calculate center and offset
      const centerX = (clipboardEntity.start.x + clipboardEntity.end.x) / 2;
      const centerY = (clipboardEntity.start.y + clipboardEntity.end.y) / 2;
      const offsetX = pastePosition.x - centerX;
      const offsetY = pastePosition.y - centerY;

      const newEntity = {
        ...clipboardEntity,
        id: newId,
        start: { x: clipboardEntity.start.x + offsetX, y: clipboardEntity.start.y + offsetY },
        end: { x: clipboardEntity.end.x + offsetX, y: clipboardEntity.end.y + offsetY }
      };

      if ('radius' in clipboardEntity) {
        // This shouldn't happen as circles don't have start/end
        return;
      } else if ('fillColor' in clipboardEntity && clipboardEntity.fillColor !== undefined) {
        // Rectangle
        this.rectangles.update(rects => [...rects, newEntity as Rectangle]);
        this.selectedEntity.set({ type: 'rectangle', id: newId });
      } else {
        // Line
        this.lines.update(lines => [...lines, newEntity as Line]);
        this.selectedEntity.set({ type: 'line', id: newId });
      }
    } else if ('center' in clipboardEntity && 'radius' in clipboardEntity) {
      // Circle - place center at cursor position
      const newCircle: Circle = {
        ...clipboardEntity,
        id: newId,
        center: { x: pastePosition.x, y: pastePosition.y }
      };
      this.circles.update(circles => [...circles, newCircle]);
      this.selectedEntity.set({ type: 'circle', id: newId });
    }

    this.redrawCanvas();
    this.emitEntitySelection(this.selectedEntity());
  }

  private applyOrthoConstraint(start: Point, end: Point): Point {
    if (!this.appStore.orthoEnabled()) {
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
    // Transform the point to the line's local coordinate system if rotated
    let testPoint = point;
    if (line.rotation) {
      const centerX = (line.start.x + line.end.x) / 2;
      const centerY = (line.start.y + line.end.y) / 2;
      const center = { x: centerX, y: centerY };
      // Reverse rotation to transform click point to line's local space
      testPoint = this.rotatePoint(point, center, -line.rotation);
    }

    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return false;

    const t = ((testPoint.x - line.start.x) * dx + (testPoint.y - line.start.y) * dy) / (length * length);
    const tClamped = Math.max(0, Math.min(1, t));

    const closestX = line.start.x + tClamped * dx;
    const closestY = line.start.y + tClamped * dy;

    const distance = Math.sqrt(
      Math.pow(testPoint.x - closestX, 2) + Math.pow(testPoint.y - closestY, 2)
    );

    return distance <= tolerance;
  }

  private hitTestRectangle(point: Point, rectangle: Rectangle, tolerance: number = 5): boolean {
    // Transform the point to the rectangle's local coordinate system if rotated
    let testPoint = point;
    if (rectangle.rotation) {
      const width = rectangle.end.x - rectangle.start.x;
      const height = rectangle.end.y - rectangle.start.y;
      const centerX = rectangle.start.x + width / 2;
      const centerY = rectangle.start.y + height / 2;
      const center = { x: centerX, y: centerY };
      // Reverse rotation to transform click point to rectangle's local space
      testPoint = this.rotatePoint(point, center, -rectangle.rotation);
    }

    const minX = Math.min(rectangle.start.x, rectangle.end.x);
    const maxX = Math.max(rectangle.start.x, rectangle.end.x);
    const minY = Math.min(rectangle.start.y, rectangle.end.y);
    const maxY = Math.max(rectangle.start.y, rectangle.end.y);

    // Check if point is within the rectangle bounds
    if (testPoint.x < minX || testPoint.x > maxX || testPoint.y < minY || testPoint.y > maxY) {
      return false;
    }

    // Check if point is near any of the four edges
    const nearLeftEdge = Math.abs(testPoint.x - minX) <= tolerance;
    const nearRightEdge = Math.abs(testPoint.x - maxX) <= tolerance;
    const nearTopEdge = Math.abs(testPoint.y - minY) <= tolerance;
    const nearBottomEdge = Math.abs(testPoint.y - maxY) <= tolerance;

    // Point must be near at least one edge to be considered a hit
    return nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge;
  }

  private hitTestCircle(point: Point, circle: Circle, tolerance: number = 5): boolean {
    // Note: Circles don't visually change with rotation, but for consistency we handle it
    let testPoint = point;
    if (circle.rotation) {
      // Reverse rotation to transform click point to circle's local space
      testPoint = this.rotatePoint(point, circle.center, -circle.rotation);
    }

    const distance = Math.sqrt(
      Math.pow(testPoint.x - circle.center.x, 2) + Math.pow(testPoint.y - circle.center.y, 2)
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

  private findEntitiesInBox(start: Point, end: Point): Array<{type: 'line' | 'rectangle' | 'circle', id: string}> {
    const selected: Array<{type: 'line' | 'rectangle' | 'circle', id: string}> = [];

    // Normalize box coordinates
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    // Check lines
    for (const line of this.lines()) {
      if (this.isLineInBox(line, minX, maxX, minY, maxY)) {
        selected.push({ type: 'line', id: line.id });
      }
    }

    // Check rectangles
    for (const rectangle of this.rectangles()) {
      if (this.isRectangleInBox(rectangle, minX, maxX, minY, maxY)) {
        selected.push({ type: 'rectangle', id: rectangle.id });
      }
    }

    // Check circles
    for (const circle of this.circles()) {
      if (this.isCircleInBox(circle, minX, maxX, minY, maxY)) {
        selected.push({ type: 'circle', id: circle.id });
      }
    }

    return selected;
  }

  private isLineInBox(line: Line, minX: number, maxX: number, minY: number, maxY: number): boolean {
    // Check if both endpoints are within the box
    const startInBox = line.start.x >= minX && line.start.x <= maxX &&
                       line.start.y >= minY && line.start.y <= maxY;
    const endInBox = line.end.x >= minX && line.end.x <= maxX &&
                     line.end.y >= minY && line.end.y <= maxY;

    return startInBox && endInBox;
  }

  private isRectangleInBox(rectangle: Rectangle, minX: number, maxX: number, minY: number, maxY: number): boolean {
    // Check if all corners of the rectangle are within the box
    const rectMinX = Math.min(rectangle.start.x, rectangle.end.x);
    const rectMaxX = Math.max(rectangle.start.x, rectangle.end.x);
    const rectMinY = Math.min(rectangle.start.y, rectangle.end.y);
    const rectMaxY = Math.max(rectangle.start.y, rectangle.end.y);

    return rectMinX >= minX && rectMaxX <= maxX &&
           rectMinY >= minY && rectMaxY <= maxY;
  }

  private isCircleInBox(circle: Circle, minX: number, maxX: number, minY: number, maxY: number): boolean {
    // Check if the entire circle (center +/- radius) is within the box
    const circleMinX = circle.center.x - circle.radius;
    const circleMaxX = circle.center.x + circle.radius;
    const circleMinY = circle.center.y - circle.radius;
    const circleMaxY = circle.center.y + circle.radius;

    return circleMinX >= minX && circleMaxX <= maxX &&
           circleMinY >= minY && circleMaxY <= maxY;
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
    const selectedEntities = this.selectedEntities();
    if (selectedEntities.length === 0) return;

    if (!this.ctx) return;

    const zoom = this.appStore.zoom();
    this.ctx.strokeStyle = '#007bff';
    this.ctx.lineWidth = 2 / zoom;
    this.ctx.setLineDash([5 / zoom, 5 / zoom]);

    // Draw highlight for all selected entities
    for (const selected of selectedEntities) {
      const entity = this.getEntityData(selected);
      if (!entity) continue;

      this.ctx.save();

      if (selected.type === 'line') {
        const line = entity as Line;

        // Apply rotation if present
        if (line.rotation) {
          const centerX = (line.start.x + line.end.x) / 2;
          const centerY = (line.start.y + line.end.y) / 2;
          this.ctx.translate(centerX, centerY);
          this.ctx.rotate((line.rotation * Math.PI) / 180);
          this.ctx.translate(-centerX, -centerY);
        }

        this.ctx.beginPath();
        this.ctx.moveTo(line.start.x, line.start.y);
        this.ctx.lineTo(line.end.x, line.end.y);
        this.ctx.stroke();
      } else if (selected.type === 'rectangle') {
        const rectangle = entity as Rectangle;
        const width = rectangle.end.x - rectangle.start.x;
        const height = rectangle.end.y - rectangle.start.y;

        // Apply rotation if present
        if (rectangle.rotation) {
          const centerX = rectangle.start.x + width / 2;
          const centerY = rectangle.start.y + height / 2;
          this.ctx.translate(centerX, centerY);
          this.ctx.rotate((rectangle.rotation * Math.PI) / 180);
          this.ctx.translate(-centerX, -centerY);
        }

        this.ctx.strokeRect(rectangle.start.x, rectangle.start.y, width, height);
      } else if (selected.type === 'circle') {
        const circle = entity as Circle;

        // Apply rotation if present (for consistency, though circles don't visually rotate)
        if (circle.rotation) {
          this.ctx.translate(circle.center.x, circle.center.y);
          this.ctx.rotate((circle.rotation * Math.PI) / 180);
          this.ctx.translate(-circle.center.x, -circle.center.y);
        }

        this.ctx.beginPath();
        this.ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }

    this.ctx.setLineDash([]);

    // Only draw resize handles and rotation handle if a single entity is selected
    const selected = this.selectedEntity();
    if (selected && selectedEntities.length === 1) {
      const entity = this.getEntityData(selected);
      if (entity) {
        this.drawResizeHandles(selected, entity);
        this.drawRotationHandle();
      }
    }
  }

  private drawResizeHandles(selected: {type: 'line' | 'rectangle' | 'circle', id: string}, entity: Line | Rectangle | Circle) {
    if (!this.ctx) return;

    const zoom = this.appStore.zoom();
    this.ctx.fillStyle = '#007bff';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1 / zoom;

    if (selected.type === 'line') {
      const line = entity as Line;

      // Apply rotation to handle positions
      if (line.rotation) {
        const centerX = (line.start.x + line.end.x) / 2;
        const centerY = (line.start.y + line.start.y) / 2;
        const startRotated = this.rotatePoint(line.start, { x: centerX, y: centerY }, line.rotation);
        const endRotated = this.rotatePoint(line.end, { x: centerX, y: centerY }, line.rotation);
        this.drawHandle(startRotated.x, startRotated.y, 'line-start');
        this.drawHandle(endRotated.x, endRotated.y, 'line-end');
      } else {
        this.drawHandle(line.start.x, line.start.y, 'line-start');
        this.drawHandle(line.end.x, line.end.y, 'line-end');
      }
    } else if (selected.type === 'rectangle') {
      const rectangle = entity as Rectangle;
      const minX = Math.min(rectangle.start.x, rectangle.end.x);
      const maxX = Math.max(rectangle.start.x, rectangle.end.x);
      const minY = Math.min(rectangle.start.y, rectangle.end.y);
      const maxY = Math.max(rectangle.start.y, rectangle.end.y);

      // Apply rotation to corner handles
      if (rectangle.rotation) {
        const width = rectangle.end.x - rectangle.start.x;
        const height = rectangle.end.y - rectangle.start.y;
        const centerX = rectangle.start.x + width / 2;
        const centerY = rectangle.start.y + height / 2;
        const center = { x: centerX, y: centerY };

        const topLeft = this.rotatePoint({ x: minX, y: minY }, center, rectangle.rotation);
        const topRight = this.rotatePoint({ x: maxX, y: minY }, center, rectangle.rotation);
        const bottomLeft = this.rotatePoint({ x: minX, y: maxY }, center, rectangle.rotation);
        const bottomRight = this.rotatePoint({ x: maxX, y: maxY }, center, rectangle.rotation);

        this.drawHandle(topLeft.x, topLeft.y, 'rect-top-left');
        this.drawHandle(topRight.x, topRight.y, 'rect-top-right');
        this.drawHandle(bottomLeft.x, bottomLeft.y, 'rect-bottom-left');
        this.drawHandle(bottomRight.x, bottomRight.y, 'rect-bottom-right');
      } else {
        this.drawHandle(minX, minY, 'rect-top-left');
        this.drawHandle(maxX, minY, 'rect-top-right');
        this.drawHandle(minX, maxY, 'rect-bottom-left');
        this.drawHandle(maxX, maxY, 'rect-bottom-right');
      }
    } else if (selected.type === 'circle') {
      const circle = entity as Circle;
      const { x: cx, y: cy } = circle.center;
      const r = circle.radius;

      // Apply rotation to axis handles
      if (circle.rotation) {
        const left = this.rotatePoint({ x: cx - r, y: cy }, circle.center, circle.rotation);
        const right = this.rotatePoint({ x: cx + r, y: cy }, circle.center, circle.rotation);
        const top = this.rotatePoint({ x: cx, y: cy - r }, circle.center, circle.rotation);
        const bottom = this.rotatePoint({ x: cx, y: cy + r }, circle.center, circle.rotation);

        this.drawHandle(left.x, left.y, 'circle-left');
        this.drawHandle(right.x, right.y, 'circle-right');
        this.drawHandle(top.x, top.y, 'circle-top');
        this.drawHandle(bottom.x, bottom.y, 'circle-bottom');
      } else {
        this.drawHandle(cx - r, cy, 'circle-left');
        this.drawHandle(cx + r, cy, 'circle-right');
        this.drawHandle(cx, cy - r, 'circle-top');
        this.drawHandle(cx, cy + r, 'circle-bottom');
      }
    }
  }

  /**
   * Rotate a point around a center by a given angle in degrees
   */
  private rotatePoint(point: Point, center: Point, angleDegrees: number): Point {
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

  private drawHandle(x: number, y: number, _handleId: string) {
    if (!this.ctx) return;

    const zoom = this.appStore.zoom();
    const size = this.handleSize / zoom;
    const halfSize = size / 2;

    // Draw handle
    this.ctx.fillRect(x - halfSize, y - halfSize, size, size);
    this.ctx.strokeRect(x - halfSize, y - halfSize, size, size);
  }

  /**
   * Draw rotation handle for selected entity
   * Shows a vertical line with a green circle at the top
   */
  private drawRotationHandle() {
    if (!this.ctx) return;

    const zoom = this.appStore.zoom();
    const center = this.getEntityCenter();
    const handlePos = this.getRotationHandlePosition();

    if (!center || !handlePos) return;

    // Draw vertical line from center/top of entity to handle
    this.ctx.strokeStyle = '#00ff00'; // Green color
    this.ctx.lineWidth = 2 / zoom;
    this.ctx.setLineDash([]);

    this.ctx.beginPath();
    this.ctx.moveTo(center.x, center.y);
    this.ctx.lineTo(handlePos.x, handlePos.y);
    this.ctx.stroke();

    // Draw green circle at handle position
    this.ctx.fillStyle = '#00ff00'; // Green fill
    this.ctx.strokeStyle = '#ffffff'; // White border
    this.ctx.lineWidth = 1 / zoom;

    this.ctx.beginPath();
    this.ctx.arc(handlePos.x, handlePos.y, this.rotationHandleSize / zoom, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();
  }

  private getHandleAtPoint(point: Point): string | null {
    const selected = this.selectedEntity();
    if (!selected) return null;

    const entity = this.getEntityData(selected);
    if (!entity) return null;

    if (selected.type === 'line') {
      const line = entity as Line;

      // Apply rotation to handle positions for hit testing
      if (line.rotation) {
        const centerX = (line.start.x + line.end.x) / 2;
        const centerY = (line.start.y + line.end.y) / 2;
        const center = { x: centerX, y: centerY };
        const startRotated = this.rotatePoint(line.start, center, line.rotation);
        const endRotated = this.rotatePoint(line.end, center, line.rotation);

        if (this.isPointNearHandle(point, startRotated)) return 'line-start';
        if (this.isPointNearHandle(point, endRotated)) return 'line-end';
      } else {
        if (this.isPointNearHandle(point, line.start)) return 'line-start';
        if (this.isPointNearHandle(point, line.end)) return 'line-end';
      }
    } else if (selected.type === 'rectangle') {
      const rectangle = entity as Rectangle;
      const minX = Math.min(rectangle.start.x, rectangle.end.x);
      const maxX = Math.max(rectangle.start.x, rectangle.end.x);
      const minY = Math.min(rectangle.start.y, rectangle.end.y);
      const maxY = Math.max(rectangle.start.y, rectangle.end.y);

      // Apply rotation to corner handles for hit testing
      if (rectangle.rotation) {
        const width = rectangle.end.x - rectangle.start.x;
        const height = rectangle.end.y - rectangle.start.y;
        const centerX = rectangle.start.x + width / 2;
        const centerY = rectangle.start.y + height / 2;
        const center = { x: centerX, y: centerY };

        const topLeft = this.rotatePoint({ x: minX, y: minY }, center, rectangle.rotation);
        const topRight = this.rotatePoint({ x: maxX, y: minY }, center, rectangle.rotation);
        const bottomLeft = this.rotatePoint({ x: minX, y: maxY }, center, rectangle.rotation);
        const bottomRight = this.rotatePoint({ x: maxX, y: maxY }, center, rectangle.rotation);

        if (this.isPointNearHandle(point, topLeft)) return 'rect-top-left';
        if (this.isPointNearHandle(point, topRight)) return 'rect-top-right';
        if (this.isPointNearHandle(point, bottomLeft)) return 'rect-bottom-left';
        if (this.isPointNearHandle(point, bottomRight)) return 'rect-bottom-right';
      } else {
        if (this.isPointNearHandle(point, { x: minX, y: minY })) return 'rect-top-left';
        if (this.isPointNearHandle(point, { x: maxX, y: minY })) return 'rect-top-right';
        if (this.isPointNearHandle(point, { x: minX, y: maxY })) return 'rect-bottom-left';
        if (this.isPointNearHandle(point, { x: maxX, y: maxY })) return 'rect-bottom-right';
      }
    } else if (selected.type === 'circle') {
      const circle = entity as Circle;
      const { x: cx, y: cy } = circle.center;
      const r = circle.radius;

      // Apply rotation to axis handles for hit testing
      if (circle.rotation) {
        const left = this.rotatePoint({ x: cx - r, y: cy }, circle.center, circle.rotation);
        const right = this.rotatePoint({ x: cx + r, y: cy }, circle.center, circle.rotation);
        const top = this.rotatePoint({ x: cx, y: cy - r }, circle.center, circle.rotation);
        const bottom = this.rotatePoint({ x: cx, y: cy + r }, circle.center, circle.rotation);

        if (this.isPointNearHandle(point, left)) return 'circle-left';
        if (this.isPointNearHandle(point, right)) return 'circle-right';
        if (this.isPointNearHandle(point, top)) return 'circle-top';
        if (this.isPointNearHandle(point, bottom)) return 'circle-bottom';
      } else {
        if (this.isPointNearHandle(point, { x: cx - r, y: cy })) return 'circle-left';
        if (this.isPointNearHandle(point, { x: cx + r, y: cy })) return 'circle-right';
        if (this.isPointNearHandle(point, { x: cx, y: cy - r })) return 'circle-top';
        if (this.isPointNearHandle(point, { x: cx, y: cy + r })) return 'circle-bottom';
      }
    }

    return null;
  }

  private isPointNearHandle(point: Point, handlePoint: Point): boolean {
    const distance = Math.sqrt(
      Math.pow(point.x - handlePoint.x, 2) + Math.pow(point.y - handlePoint.y, 2)
    );
    const zoom = this.appStore.zoom();
    return distance <= this.handleSize / zoom;
  }

  /**
   * Get the position of the rotation handle for the selected entity
   */
  private getRotationHandlePosition(): Point | null {
    const selected = this.selectedEntity();
    if (!selected) return null;

    const entity = this.getEntityData(selected);
    if (!entity) return null;

    const zoom = this.appStore.zoom();
    const handleOffset = 30 / zoom; // Keep handle at constant screen distance

    // Calculate the center and top-middle point of the entity
    if (selected.type === 'line') {
      const line = entity as Line;
      // For lines, place rotation handle at the midpoint, extending upward
      const centerX = (line.start.x + line.end.x) / 2;
      const centerY = (line.start.y + line.end.y) / 2;
      const center = { x: centerX, y: centerY };
      const handlePos = { x: centerX, y: centerY - handleOffset };

      // Apply rotation to the handle position
      if (line.rotation) {
        return this.rotatePoint(handlePos, center, line.rotation);
      }
      return handlePos;
    } else if (selected.type === 'rectangle') {
      const rectangle = entity as Rectangle;
      const width = rectangle.end.x - rectangle.start.x;
      const height = rectangle.end.y - rectangle.start.y;
      const centerX = rectangle.start.x + width / 2;
      const centerY = rectangle.start.y + height / 2;
      const center = { x: centerX, y: centerY };
      const minY = Math.min(rectangle.start.y, rectangle.end.y);
      const handlePos = { x: centerX, y: minY - handleOffset };

      // Apply rotation to the handle position
      if (rectangle.rotation) {
        return this.rotatePoint(handlePos, center, rectangle.rotation);
      }
      return handlePos;
    } else if (selected.type === 'circle') {
      const circle = entity as Circle;
      const handlePos = { x: circle.center.x, y: circle.center.y - circle.radius - handleOffset };

      // Apply rotation to the handle position
      if (circle.rotation) {
        return this.rotatePoint(handlePos, circle.center, circle.rotation);
      }
      return handlePos;
    }

    return null;
  }

  /**
   * Check if a point is near the rotation handle
   */
  private isPointNearRotationHandle(point: Point): boolean {
    const handlePos = this.getRotationHandlePosition();
    if (!handlePos) return false;

    const distance = Math.sqrt(
      Math.pow(point.x - handlePos.x, 2) + Math.pow(point.y - handlePos.y, 2)
    );
    const zoom = this.appStore.zoom();
    return distance <= this.rotationHandleSize / zoom;
  }

  /**
   * Get the center point of the selected entity for rotation
   */
  private getEntityCenter(): Point | null {
    const selected = this.selectedEntity();
    if (!selected) return null;

    const entity = this.getEntityData(selected);
    if (!entity) return null;

    if (selected.type === 'line') {
      const line = entity as Line;
      return {
        x: (line.start.x + line.end.x) / 2,
        y: (line.start.y + line.end.y) / 2
      };
    } else if (selected.type === 'rectangle') {
      const rectangle = entity as Rectangle;
      const minX = Math.min(rectangle.start.x, rectangle.end.x);
      const maxX = Math.max(rectangle.start.x, rectangle.end.x);
      const minY = Math.min(rectangle.start.y, rectangle.end.y);
      const maxY = Math.max(rectangle.start.y, rectangle.end.y);
      return {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
      };
    } else if (selected.type === 'circle') {
      const circle = entity as Circle;
      return circle.center;
    }

    return null;
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
   * Rotate the selected entity by the given angle delta
   */
  private rotateSelectedEntity(angleDelta: number) {
    const selected = this.selectedEntity();
    if (!selected) return;

    if (selected.type === 'line') {
      this.lines.update(lines =>
        lines.map(line => {
          if (line.id !== selected.id) return line;
          const currentRotation = line.rotation || 0;
          return { ...line, rotation: currentRotation + angleDelta };
        })
      );
    } else if (selected.type === 'rectangle') {
      this.rectangles.update(rectangles =>
        rectangles.map(rectangle => {
          if (rectangle.id !== selected.id) return rectangle;
          const currentRotation = rectangle.rotation || 0;
          return { ...rectangle, rotation: currentRotation + angleDelta };
        })
      );
    } else if (selected.type === 'circle') {
      this.circles.update(circles =>
        circles.map(circle => {
          if (circle.id !== selected.id) return circle;
          const currentRotation = circle.rotation || 0;
          return { ...circle, rotation: currentRotation + angleDelta };
        })
      );
    }

    this.redrawCanvas();

    // Emit updated properties after rotating
    const selectedEntityInfo = this.selectedEntity();
    if (selectedEntityInfo) {
      this.emitEntitySelection(selectedEntityInfo);
    }
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
    if (!this.appStore.snapEnabled()) {
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
   * Apply snapping for entity-to-entity based on anchor points
   * Returns the offset needed to snap the entity's anchor points to other entities
   */
  private applyEntitySnapping(entityId: string, entityType: 'line' | 'rectangle' | 'circle'): { offset: Point, snapPoint: AnchorPoint | null } | null {
    if (!this.appStore.snapEnabled()) {
      return null;
    }

    const entity = this.getEntityData({ type: entityType, id: entityId });
    if (!entity) return null;

    // Get all anchor points for the moving entity
    let movingEntityAnchors: AnchorPoint[] = [];
    if (entityType === 'line') {
      movingEntityAnchors = AnchorPointCalculator.calculateLineAnchorPoints(entity as Line);
    } else if (entityType === 'rectangle') {
      movingEntityAnchors = AnchorPointCalculator.calculateRectangleAnchorPoints(entity as Rectangle);
    } else if (entityType === 'circle') {
      movingEntityAnchors = AnchorPointCalculator.calculateCircleAnchorPoints(entity as Circle);
    }

    // Get all anchor points from other entities
    const otherAnchors = AnchorPointCalculator.getAllAnchorPoints(
      this.lines(),
      this.rectangles(),
      this.circles()
    ).filter(anchor => anchor.entityId !== entityId);

    // Find the closest pair of anchor points
    let minDistance = AnchorPointCalculator.getSnapDistance();
    let bestMovingAnchor: AnchorPoint | null = null;
    let bestTargetAnchor: AnchorPoint | null = null;

    for (const movingAnchor of movingEntityAnchors) {
      for (const targetAnchor of otherAnchors) {
        const distance = Math.sqrt(
          Math.pow(targetAnchor.point.x - movingAnchor.point.x, 2) +
          Math.pow(targetAnchor.point.y - movingAnchor.point.y, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          bestMovingAnchor = movingAnchor;
          bestTargetAnchor = targetAnchor;
        }
      }
    }

    // If we found a snap, calculate the offset needed
    if (bestMovingAnchor && bestTargetAnchor) {
      return {
        offset: {
          x: bestTargetAnchor.point.x - bestMovingAnchor.point.x,
          y: bestTargetAnchor.point.y - bestMovingAnchor.point.y
        },
        snapPoint: bestTargetAnchor
      };
    }

    return null;
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

    const zoom = this.appStore.zoom();
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
      this.ctx.lineWidth = 1 / zoom;

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
            this.ctx.lineWidth = 1 / zoom;
            this.drawAnchorPoint(anchor.point);

            // Draw a larger blue circle around the hovered anchor point
            this.ctx.strokeStyle = '#007bff';
            this.ctx.lineWidth = 2 / zoom;
            this.ctx.setLineDash([]);

            const radius = 6 / zoom;
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

    const zoom = this.appStore.zoom();
    const size = this.anchorPointSize / zoom;
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

    const zoom = this.appStore.zoom();
    const snapPoint = this.currentSnapPoint();
    if (!snapPoint) return;

    // Draw the anchor point in green for snapped state
    this.ctx.fillStyle = '#00ff00'; // Green for snapped anchor point
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1 / zoom;
    this.drawAnchorPoint(snapPoint.point);

    // Draw a larger highlight circle around the snap point
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2 / zoom;
    this.ctx.setLineDash([]);

    const radius = 8 / zoom;
    this.ctx.beginPath();
    this.ctx.arc(snapPoint.point.x, snapPoint.point.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();

    // Draw cross hair
    const crossSize = 12 / zoom;
    this.ctx.beginPath();
    this.ctx.moveTo(snapPoint.point.x - crossSize, snapPoint.point.y);
    this.ctx.lineTo(snapPoint.point.x + crossSize, snapPoint.point.y);
    this.ctx.moveTo(snapPoint.point.x, snapPoint.point.y - crossSize);
    this.ctx.lineTo(snapPoint.point.x, snapPoint.point.y + crossSize);
    this.ctx.stroke();
  }
}
