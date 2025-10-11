import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CanvasComponent } from './canvas';
import { AppStore } from '../../state/app.store';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { Line, Rectangle, Circle, Point } from '../../types/geometry';
import { EntityPropertyCalculator } from '../../types/entity-properties';
import { AnchorPointCalculator } from '../../types/anchor-points';

describe('CanvasComponent', () => {
  let component: CanvasComponent;
  let fixture: ComponentFixture<CanvasComponent>;
  let mockAppStore: any;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(async () => {
    // Mock AppStore
    mockAppStore = {
      snapEnabled: signal(true),
      orthoEnabled: signal(true),
      mousePosition: signal({ x: 0, y: 0 }),
      clipboardEntity: signal(null),
      deletedEntities: signal([]),
      zoom: signal(1.0),
      panOffset: signal({ x: 0, y: 0 }),
      toggleSnap: jasmine.createSpy('toggleSnap'),
      toggleOrtho: jasmine.createSpy('toggleOrtho'),
      updateMousePosition: jasmine.createSpy('updateMousePosition'),
      copyEntity: jasmine.createSpy('copyEntity'),
      clearClipboard: jasmine.createSpy('clearClipboard'),
      addDeletedEntity: jasmine.createSpy('addDeletedEntity'),
      addDeletedEntities: jasmine.createSpy('addDeletedEntities'),
      setZoom: jasmine.createSpy('setZoom'),
      setPanOffset: jasmine.createSpy('setPanOffset'),
      resetView: jasmine.createSpy('resetView')
    };

    await TestBed.configureTestingModule({
      imports: [CanvasComponent],
      providers: [
        { provide: AppStore, useValue: mockAppStore },
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CanvasComponent);
    component = fixture.componentInstance;

    // Setup canvas element
    canvasElement = fixture.nativeElement.querySelector('canvas');
    if (canvasElement) {
      ctx = canvasElement.getContext('2d')!;
    }

    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize canvas context on AfterViewInit', () => {
      expect(component['ctx']).toBeTruthy();
    });

    it('should initialize with default tool as select', () => {
      expect(component['currentTool']()).toBe('select');
    });

    it('should initialize with empty entity arrays', () => {
      expect(component['lines']()).toEqual([]);
      expect(component['rectangles']()).toEqual([]);
      expect(component['circles']()).toEqual([]);
    });

    it('should setup keyboard listeners', () => {
      expect(component['keyboardListener']).toBeDefined();
    });

    it('should setup resize observer', () => {
      expect(component['resizeObserver']).toBeTruthy();
    });
  });

  describe('Tool Selection', () => {
    it('should set tool to line', () => {
      component.setTool('line');
      expect(component['currentTool']()).toBe('line');
    });

    it('should set tool to rectangle', () => {
      component.setTool('rectangle');
      expect(component['currentTool']()).toBe('rectangle');
    });

    it('should set tool to circle', () => {
      component.setTool('circle');
      expect(component['currentTool']()).toBe('circle');
    });

    it('should set tool to select', () => {
      component.setTool('select');
      expect(component['currentTool']()).toBe('select');
    });
  });

  describe('Drawing Lines', () => {
    beforeEach(() => {
      component.setTool('line');
    });

    it('should start drawing a line on mouse down', () => {
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100
      });

      component['onMouseDown'](mouseEvent);

      expect(component['isDrawing']()).toBe(true);
      expect(component['currentLine']()).toBeTruthy();
    });

    it('should complete line on mouse up', () => {
      // Start drawing
      const downEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      component['onMouseDown'](downEvent);

      // Finish drawing
      const upEvent = new MouseEvent('mouseup', { clientX: 200, clientY: 200 });
      component['onMouseUp'](upEvent);

      expect(component['isDrawing']()).toBe(false);
      expect(component['lines']().length).toBe(1);
      expect(component['currentLine']()).toBeNull();
    });

    it('should create line with correct properties', () => {
      const downEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const upEvent = new MouseEvent('mouseup', { clientX: 200, clientY: 200 });

      component['onMouseDown'](downEvent);
      component['onMouseUp'](upEvent);

      const line = component['lines']()[0];
      expect(line).toBeDefined();
      expect(line.color).toBe('#000000');
      expect(line.width).toBe(2);
      expect(line.start).toBeDefined();
      expect(line.end).toBeDefined();
    });
  });

  describe('Drawing Rectangles', () => {
    beforeEach(() => {
      component.setTool('rectangle');
    });

    it('should start drawing a rectangle on mouse down', () => {
      const mouseEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      component['onMouseDown'](mouseEvent);

      expect(component['isDrawing']()).toBe(true);
      expect(component['currentRectangle']()).toBeTruthy();
    });

    it('should complete rectangle on mouse up', () => {
      const downEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const upEvent = new MouseEvent('mouseup', { clientX: 200, clientY: 200 });

      component['onMouseDown'](downEvent);
      component['onMouseUp'](upEvent);

      expect(component['isDrawing']()).toBe(false);
      expect(component['rectangles']().length).toBe(1);
      expect(component['currentRectangle']()).toBeNull();
    });

    it('should create rectangle with correct properties', () => {
      const downEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const upEvent = new MouseEvent('mouseup', { clientX: 200, clientY: 200 });

      component['onMouseDown'](downEvent);
      component['onMouseUp'](upEvent);

      const rectangle = component['rectangles']()[0];
      expect(rectangle).toBeDefined();
      expect(rectangle.color).toBe('#000000');
      expect(rectangle.width).toBe(2);
      expect(rectangle.fillColor).toBe('transparent');
    });
  });

  describe('Drawing Circles', () => {
    beforeEach(() => {
      component.setTool('circle');
    });

    it('should start drawing a circle on mouse down', () => {
      const mouseEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      component['onMouseDown'](mouseEvent);

      expect(component['isDrawing']()).toBe(true);
      expect(component['currentCircle']()).toBeTruthy();
    });

    it('should complete circle on mouse up', () => {
      const downEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const upEvent = new MouseEvent('mouseup', { clientX: 200, clientY: 200 });

      component['onMouseDown'](downEvent);
      component['onMouseUp'](upEvent);

      expect(component['isDrawing']()).toBe(false);
      expect(component['circles']().length).toBe(1);
      expect(component['currentCircle']()).toBeNull();
    });

    it('should create circle with correct radius', () => {
      const downEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const upEvent = new MouseEvent('mouseup', { clientX: 200, clientY: 100 });

      component['onMouseDown'](downEvent);
      component['onMouseUp'](upEvent);

      const circle = component['circles']()[0];
      expect(circle.radius).toBe(100); // Distance from (100,100) to (200,100)
    });
  });

  describe('Entity Selection', () => {
    beforeEach(() => {
      component.setTool('select');
    });

    it('should select a line when clicked', () => {
      // Add a line
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);

      // Click near the line
      spyOn<any>(component, 'findEntityAtPoint').and.returnValue({ type: 'line', id: '1' });
      const mouseEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 150 });
      component['onMouseDown'](mouseEvent);

      expect(component['selectedEntity']()).toEqual({ type: 'line', id: '1' });
    });

    it('should deselect entity when clicking empty space', () => {
      component['selectedEntity'].set({ type: 'line', id: '1' });

      spyOn<any>(component, 'findEntityAtPoint').and.returnValue(null);
      const mouseEvent = new MouseEvent('mousedown', { clientX: 50, clientY: 50 });
      component['onMouseDown'](mouseEvent);

      expect(component['selectedEntity']()).toBeNull();
    });

    it('should emit entity selection event', (done) => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);

      component.entitySelected.subscribe((properties) => {
        expect(properties).toBeTruthy();
        done();
      });

      spyOn<any>(component, 'findEntityAtPoint').and.returnValue({ type: 'line', id: '1' });
      const mouseEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 150 });
      component['onMouseDown'](mouseEvent);
    });
  });

  describe('Hit Testing', () => {
    it('should detect hit on line', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };

      const hit = component['hitTestLine']({ x: 150, y: 150 }, line, 10);
      expect(hit).toBe(true);
    });

    it('should not detect hit far from line', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };

      const hit = component['hitTestLine']({ x: 300, y: 300 }, line, 10);
      expect(hit).toBe(false);
    });

    it('should detect hit on rectangle edge', () => {
      const rectangle: Rectangle = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };

      const hit = component['hitTestRectangle']({ x: 100, y: 150 }, rectangle, 10);
      expect(hit).toBe(true);
    });

    it('should detect hit on circle circumference', () => {
      const circle: Circle = {
        id: '1',
        center: { x: 100, y: 100 },
        radius: 50,
        color: '#000000',
        width: 2
      };

      const hit = component['hitTestCircle']({ x: 150, y: 100 }, circle, 10);
      expect(hit).toBe(true);
    });
  });

  describe('Entity Dragging', () => {
    beforeEach(() => {
      component.setTool('select');
    });

    it('should set dragging state when dragging entity', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);
      component['selectedEntity'].set({ type: 'line', id: '1' });

      spyOn<any>(component, 'findEntityAtPoint').and.returnValue({ type: 'line', id: '1' });
      const mouseEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 150 });
      component['onMouseDown'](mouseEvent);

      expect(component['isDragging']()).toBe(true);
    });

    it('should not allow dragging frozen entity', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2,
        frozen: true
      };
      component['lines'].set([line]);
      component['selectedEntity'].set({ type: 'line', id: '1' });

      spyOn<any>(component, 'findEntityAtPoint').and.returnValue({ type: 'line', id: '1' });
      const mouseEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 150 });
      component['onMouseDown'](mouseEvent);

      expect(component['isDragging']()).toBe(false);
    });

    it('should clear dragging state on mouse up', () => {
      component['isDragging'].set(true);
      component['onMouseUp'](new MouseEvent('mouseup'));

      expect(component['isDragging']()).toBe(false);
    });
  });

  describe('Selection Box', () => {
    beforeEach(() => {
      component.setTool('select');
    });

    it('should start drawing selection box on empty space click', () => {
      spyOn<any>(component, 'findEntityAtPoint').and.returnValue(null);
      const mouseEvent = new MouseEvent('mousedown', { clientX: 50, clientY: 50 });
      component['onMouseDown'](mouseEvent);

      expect(component['isDrawingSelectionBox']()).toBe(true);
      expect(component['selectionBoxStart']()).toBeTruthy();
    });

    it('should update selection box on mouse move', () => {
      component['isDrawingSelectionBox'].set(true);
      component['selectionBoxStart'].set({ x: 50, y: 50 });

      const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 150 });
      component['onMouseMove'](moveEvent);

      expect(component['selectionBoxEnd']()).toBeTruthy();
    });

    it('should select entities within selection box', () => {
      const line: Line = {
        id: '1',
        start: { x: 60, y: 60 },
        end: { x: 80, y: 80 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);

      component['selectionBoxStart'].set({ x: 50, y: 50 });
      component['selectionBoxEnd'].set({ x: 100, y: 100 });
      component['isDrawingSelectionBox'].set(true);

      const upEvent = new MouseEvent('mouseup');
      component['onMouseUp'](upEvent);

      expect(component['selectedEntities']().length).toBeGreaterThan(0);
    });
  });

  describe('Copy/Paste/Delete', () => {
    it('should copy selected entity to clipboard', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);
      component['selectedEntity'].set({ type: 'line', id: '1' });

      component.copySelectedEntity();

      expect(mockAppStore.copyEntity).toHaveBeenCalledWith(line);
    });

    it('should not copy when no entity selected', () => {
      component['selectedEntity'].set(null);
      component.copySelectedEntity();

      expect(mockAppStore.copyEntity).not.toHaveBeenCalled();
    });

    it('should paste entity from clipboard', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      mockAppStore.clipboardEntity.set(line);

      component.pasteEntity();

      expect(component['lines']().length).toBe(1);
    });

    it('should delete selected entities', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);
      component['selectedEntities'].set([{ type: 'line', id: '1' }]);

      component.deleteSelectedEntities();

      expect(component['lines']().length).toBe(0);
      expect(mockAppStore.addDeletedEntities).toHaveBeenCalled();
    });

    it('should not delete when no entities selected', () => {
      component['selectedEntities'].set([]);
      component.deleteSelectedEntities();

      expect(mockAppStore.addDeletedEntities).not.toHaveBeenCalled();
    });
  });

  describe('Freeze/Unfreeze', () => {
    it('should freeze selected entity', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2,
        frozen: false
      };
      component['lines'].set([line]);
      component['selectedEntity'].set({ type: 'line', id: '1' });

      component.freezeSelectedEntity();

      const updatedLine = component['lines']()[0];
      expect(updatedLine.frozen).toBe(true);
    });

    it('should unfreeze selected entity', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2,
        frozen: true
      };
      component['lines'].set([line]);
      component['selectedEntity'].set({ type: 'line', id: '1' });

      component.unfreezeSelectedEntity();

      const updatedLine = component['lines']()[0];
      expect(updatedLine.frozen).toBe(false);
    });
  });

  describe('Rotation', () => {
    it('should set rotating state when dragging rotation handle', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);
      component['selectedEntity'].set({ type: 'line', id: '1' });

      spyOn<any>(component, 'isPointNearRotationHandle').and.returnValue(true);
      const mouseEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 50 });
      component['onMouseDown'](mouseEvent);

      expect(component['isRotating']()).toBe(true);
    });

    it('should not allow rotation of frozen entity', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2,
        frozen: true
      };
      component['lines'].set([line]);
      component['selectedEntity'].set({ type: 'line', id: '1' });

      spyOn<any>(component, 'isPointNearRotationHandle').and.returnValue(true);
      const mouseEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 50 });
      component['onMouseDown'](mouseEvent);

      expect(component['isRotating']()).toBe(false);
    });
  });

  describe('Resizing', () => {
    it('should set resizing state when dragging resize handle', () => {
      const rectangle: Rectangle = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['rectangles'].set([rectangle]);
      component['selectedEntity'].set({ type: 'rectangle', id: '1' });

      spyOn<any>(component, 'getHandleAtPoint').and.returnValue('rect-bottom-right');
      const mouseEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 200 });
      component['onMouseDown'](mouseEvent);

      expect(component['isResizing']()).toBe(true);
    });

    it('should not allow resizing frozen entity', () => {
      const rectangle: Rectangle = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2,
        frozen: true
      };
      component['rectangles'].set([rectangle]);
      component['selectedEntity'].set({ type: 'rectangle', id: '1' });

      spyOn<any>(component, 'getHandleAtPoint').and.returnValue('rect-bottom-right');
      const mouseEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 200 });
      component['onMouseDown'](mouseEvent);

      expect(component['isResizing']()).toBe(false);
    });
  });

  describe('Snap and Ortho Modes', () => {
    it('should toggle snap mode', () => {
      component.toggleSnap();
      expect(mockAppStore.toggleSnap).toHaveBeenCalled();
    });

    it('should toggle ortho mode', () => {
      component.toggleOrtho();
      expect(mockAppStore.toggleOrtho).toHaveBeenCalled();
    });

    it('should apply ortho constraint to horizontal line', () => {
      mockAppStore.orthoEnabled.set(true);
      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 200, y: 110 };

      const constrained = component['applyOrthoConstraint'](start, end);

      expect(constrained.y).toBe(start.y); // Should constrain to horizontal
    });

    it('should apply ortho constraint to vertical line', () => {
      mockAppStore.orthoEnabled.set(true);
      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 110, y: 200 };

      const constrained = component['applyOrthoConstraint'](start, end);

      expect(constrained.x).toBe(start.x); // Should constrain to vertical
    });

    it('should not apply ortho constraint when disabled', () => {
      mockAppStore.orthoEnabled.set(false);
      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 200, y: 200 };

      const constrained = component['applyOrthoConstraint'](start, end);

      expect(constrained).toEqual(end);
    });
  });

  describe('Mouse Position Tracking', () => {
    it('should update mouse position in store on mouse move', () => {
      const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 150 });
      component['onMouseMove'](moveEvent);

      expect(mockAppStore.updateMousePosition).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should toggle snap on Ctrl+B', () => {
      const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'b' });
      spyOn(event, 'preventDefault');

      if (component['keyboardListener']) {
        component['keyboardListener'](event);
      }

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockAppStore.toggleSnap).toHaveBeenCalled();
    });

    it('should toggle ortho on F8', () => {
      const event = new KeyboardEvent('keydown', { key: 'F8' });
      spyOn(event, 'preventDefault');

      if (component['keyboardListener']) {
        component['keyboardListener'](event);
      }

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockAppStore.toggleOrtho).toHaveBeenCalled();
    });

    it('should copy on Ctrl+C', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);
      component['selectedEntity'].set({ type: 'line', id: '1' });

      const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'c' });
      spyOn(event, 'preventDefault');

      if (component['keyboardListener']) {
        component['keyboardListener'](event);
      }

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockAppStore.copyEntity).toHaveBeenCalled();
    });

    it('should delete on Ctrl+D', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);
      component['selectedEntities'].set([{ type: 'line', id: '1' }]);

      const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'd' });
      spyOn(event, 'preventDefault');

      if (component['keyboardListener']) {
        component['keyboardListener'](event);
      }

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component['lines']().length).toBe(0);
    });
  });

  describe('Entity Property Updates', () => {
    it('should update line properties', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);

      const update = {
        entityId: '1',
        entityType: 'line' as const,
        rotation: 45
      };

      component.updateEntityFromProperties(update);

      const updatedLine = component['lines']()[0];
      expect(updatedLine.rotation).toBe(45);
    });

    it('should update rectangle properties', () => {
      const rectangle: Rectangle = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['rectangles'].set([rectangle]);

      const update = {
        entityId: '1',
        entityType: 'rectangle' as const,
        frozen: true
      };

      component.updateEntityFromProperties(update);

      const updatedRectangle = component['rectangles']()[0];
      expect(updatedRectangle.frozen).toBe(true);
    });

    it('should update circle properties', () => {
      const circle: Circle = {
        id: '1',
        center: { x: 100, y: 100 },
        radius: 50,
        color: '#000000',
        width: 2
      };
      component['circles'].set([circle]);

      const update = {
        entityId: '1',
        entityType: 'circle' as const,
        rotation: 90
      };

      component.updateEntityFromProperties(update);

      const updatedCircle = component['circles']()[0];
      expect(updatedCircle.rotation).toBe(90);
    });
  });

  describe('Cleanup', () => {
    it('should disconnect resize observer on destroy', () => {
      const disconnectSpy = jasmine.createSpy('disconnect');
      component['resizeObserver'] = { disconnect: disconnectSpy } as any;

      component.ngOnDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should remove keyboard listeners on destroy', () => {
      spyOn(document, 'removeEventListener');

      component.ngOnDestroy();

      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', jasmine.any(Function));
    });
  });

  describe('Helper Methods', () => {
    it('should get entity data for line', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);

      const entityData = component['getEntityData']({ type: 'line', id: '1' });

      expect(entityData).toEqual(line);
    });

    it('should get entity data for rectangle', () => {
      const rectangle: Rectangle = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['rectangles'].set([rectangle]);

      const entityData = component['getEntityData']({ type: 'rectangle', id: '1' });

      expect(entityData).toEqual(rectangle);
    });

    it('should get entity data for circle', () => {
      const circle: Circle = {
        id: '1',
        center: { x: 100, y: 100 },
        radius: 50,
        color: '#000000',
        width: 2
      };
      component['circles'].set([circle]);

      const entityData = component['getEntityData']({ type: 'circle', id: '1' });

      expect(entityData).toEqual(circle);
    });

    it('should return null for non-existent entity', () => {
      const entityData = component['getEntityData']({ type: 'line', id: 'nonexistent' });

      expect(entityData).toBeNull();
    });

    it('should calculate entity center for line', () => {
      const line: Line = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['lines'].set([line]);
      component['selectedEntity'].set({ type: 'line', id: '1' });

      const center = component['getEntityCenter']();

      expect(center).toEqual({ x: 150, y: 150 });
    });

    it('should calculate entity center for rectangle', () => {
      const rectangle: Rectangle = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      component['rectangles'].set([rectangle]);
      component['selectedEntity'].set({ type: 'rectangle', id: '1' });

      const center = component['getEntityCenter']();

      expect(center).toEqual({ x: 150, y: 150 });
    });

    it('should calculate entity center for circle', () => {
      const circle: Circle = {
        id: '1',
        center: { x: 100, y: 100 },
        radius: 50,
        color: '#000000',
        width: 2
      };
      component['circles'].set([circle]);
      component['selectedEntity'].set({ type: 'circle', id: '1' });

      const center = component['getEntityCenter']();

      expect(center).toEqual({ x: 100, y: 100 });
    });

    it('should rotate point correctly', () => {
      const point: Point = { x: 100, y: 0 };
      const center: Point = { x: 0, y: 0 };
      const angle = 90;

      const rotated = component['rotatePoint'](point, center, angle);

      expect(Math.round(rotated.x)).toBe(0);
      expect(Math.round(rotated.y)).toBe(100);
    });
  });

  describe('Cursor Management', () => {
    it('should set cursor for different handles', () => {
      expect(component['cursorForHandle']('rect-top-left')).toBe('nwse-resize');
      expect(component['cursorForHandle']('rect-top-right')).toBe('nesw-resize');
      expect(component['cursorForHandle']('circle-left')).toBe('ew-resize');
      expect(component['cursorForHandle']('circle-top')).toBe('ns-resize');
      expect(component['cursorForHandle']('line-start')).toBe('grab');
    });
  });
});
