import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { App } from './app';
import { EntityProperties, PropertyUpdate } from './types/entity-properties';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the app', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with title signal', () => {
      expect(component['title']()).toBe('cad-client');
    });

    it('should initialize with no selected entity properties', () => {
      expect(component['selectedEntityProperties']()).toBeNull();
    });

    it('should render app container', () => {
      const container = compiled.querySelector('.app-container');
      expect(container).toBeTruthy();
    });

    it('should render header component', () => {
      const header = compiled.querySelector('app-header');
      expect(header).toBeTruthy();
    });

    it('should render footer component', () => {
      const footer = compiled.querySelector('app-footer');
      expect(footer).toBeTruthy();
    });

    it('should render toolbar component', () => {
      const toolbar = compiled.querySelector('app-toolbar');
      expect(toolbar).toBeTruthy();
    });

    it('should render canvas component', () => {
      const canvas = compiled.querySelector('app-canvas');
      expect(canvas).toBeTruthy();
    });

    it('should render properties panel component', () => {
      const panel = compiled.querySelector('app-properties-panel');
      expect(panel).toBeTruthy();
    });

    it('should have canvas component ViewChild reference', () => {
      expect(component.canvasComponent).toBeDefined();
    });
  });

  describe('Template Structure', () => {
    it('should have main content area', () => {
      const mainContent = compiled.querySelector('.main-content');
      expect(mainContent).toBeTruthy();
    });

    it('should have left panel for toolbar', () => {
      const leftPanel = compiled.querySelector('.left-panel');
      expect(leftPanel).toBeTruthy();
    });

    it('should have center panel for canvas', () => {
      const centerPanel = compiled.querySelector('.center-panel');
      expect(centerPanel).toBeTruthy();
    });

    it('should have right panel for properties', () => {
      const rightPanel = compiled.querySelector('.right-panel');
      expect(rightPanel).toBeTruthy();
    });

    it('should render toolbar inside left panel', () => {
      const leftPanel = compiled.querySelector('.left-panel');
      const toolbar = leftPanel?.querySelector('app-toolbar');
      expect(toolbar).toBeTruthy();
    });

    it('should render canvas inside center panel', () => {
      const centerPanel = compiled.querySelector('.center-panel');
      const canvas = centerPanel?.querySelector('app-canvas');
      expect(canvas).toBeTruthy();
    });

    it('should render properties panel inside right panel', () => {
      const rightPanel = compiled.querySelector('.right-panel');
      const panel = rightPanel?.querySelector('app-properties-panel');
      expect(panel).toBeTruthy();
    });
  });

  describe('Tool Selection', () => {
    it('should call canvas setTool when tool is selected', () => {
      spyOn(component.canvasComponent, 'setTool');

      component['onToolSelected']('line');

      expect(component.canvasComponent.setTool).toHaveBeenCalledWith('line');
    });

    it('should handle select tool', () => {
      spyOn(component.canvasComponent, 'setTool');

      component['onToolSelected']('select');

      expect(component.canvasComponent.setTool).toHaveBeenCalledWith('select');
    });

    it('should handle rectangle tool', () => {
      spyOn(component.canvasComponent, 'setTool');

      component['onToolSelected']('rectangle');

      expect(component.canvasComponent.setTool).toHaveBeenCalledWith('rectangle');
    });

    it('should handle circle tool', () => {
      spyOn(component.canvasComponent, 'setTool');

      component['onToolSelected']('circle');

      expect(component.canvasComponent.setTool).toHaveBeenCalledWith('circle');
    });

    it('should not throw if canvasComponent is not available', () => {
      (component as any).canvasComponent = undefined;

      expect(() => component['onToolSelected']('line')).not.toThrow();
    });
  });

  describe('Entity Selection', () => {
    it('should update selectedEntityProperties when entity is selected', () => {
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 }
      };

      component['onEntitySelected'](properties);

      expect(component['selectedEntityProperties']()).toEqual(properties);
    });

    it('should handle null entity selection', () => {
      // First select an entity
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 }
      };
      component['onEntitySelected'](properties);

      // Then deselect
      component['onEntitySelected'](null);

      expect(component['selectedEntityProperties']()).toBeNull();
    });

    it('should update properties when different entity is selected', () => {
      const properties1: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 }
      };

      const properties2: EntityProperties = {
        type: 'rectangle',
        id: '2',
        position: { x: 50, y: 75 },
        dimensions: { width: 100, height: 50 }
      };

      component['onEntitySelected'](properties1);
      expect(component['selectedEntityProperties']()).toEqual(properties1);

      component['onEntitySelected'](properties2);
      expect(component['selectedEntityProperties']()).toEqual(properties2);
    });

    it('should handle circle entity selection', () => {
      const properties: EntityProperties = {
        type: 'circle',
        id: '3',
        position: { x: 100, y: 100 },
        dimensions: { radius: 50, diameter: 100 }
      };

      component['onEntitySelected'](properties);

      expect(component['selectedEntityProperties']()).toEqual(properties);
    });

    it('should handle entity with rotation property', () => {
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 },
        rotation: 45
      };

      component['onEntitySelected'](properties);

      expect(component['selectedEntityProperties']()?.rotation).toBe(45);
    });

    it('should handle entity with frozen property', () => {
      const properties: EntityProperties = {
        type: 'rectangle',
        id: '2',
        position: { x: 50, y: 75 },
        dimensions: { width: 100, height: 50 },
        frozen: true
      };

      component['onEntitySelected'](properties);

      expect(component['selectedEntityProperties']()?.frozen).toBe(true);
    });
  });

  describe('Property Updates', () => {
    it('should call canvas updateEntityFromProperties when property changes', () => {
      spyOn(component.canvasComponent, 'updateEntityFromProperties');

      const update: PropertyUpdate = {
        entityId: '1',
        entityType: 'line',
        rotation: 45
      };

      component['onPropertyChanged'](update);

      expect(component.canvasComponent.updateEntityFromProperties).toHaveBeenCalledWith(update);
    });

    it('should handle position property update', () => {
      spyOn(component.canvasComponent, 'updateEntityFromProperties');

      const update: PropertyUpdate = {
        entityId: '1',
        entityType: 'line',
        position: { x: 200, y: 300 }
      };

      component['onPropertyChanged'](update);

      expect(component.canvasComponent.updateEntityFromProperties).toHaveBeenCalledWith(update);
    });

    it('should handle dimension property update', () => {
      spyOn(component.canvasComponent, 'updateEntityFromProperties');

      const update: PropertyUpdate = {
        entityId: '2',
        entityType: 'rectangle',
        dimensions: { width: 150, height: 75 }
      };

      component['onPropertyChanged'](update);

      expect(component.canvasComponent.updateEntityFromProperties).toHaveBeenCalledWith(update);
    });

    it('should handle frozen property update', () => {
      spyOn(component.canvasComponent, 'updateEntityFromProperties');

      const update: PropertyUpdate = {
        entityId: '1',
        entityType: 'line',
        frozen: true
      };

      component['onPropertyChanged'](update);

      expect(component.canvasComponent.updateEntityFromProperties).toHaveBeenCalledWith(update);
    });

    it('should not throw if canvasComponent is not available', () => {
      (component as any).canvasComponent = undefined;

      const update: PropertyUpdate = {
        entityId: '1',
        entityType: 'line',
        rotation: 45
      };

      expect(() => component['onPropertyChanged'](update)).not.toThrow();
    });
  });

  describe('Copy Operation', () => {
    it('should call canvas copySelectedEntity when copy is triggered', () => {
      spyOn(component.canvasComponent, 'copySelectedEntity');

      component['onCopy']();

      expect(component.canvasComponent.copySelectedEntity).toHaveBeenCalled();
    });

    it('should not throw if canvasComponent is not available', () => {
      (component as any).canvasComponent = undefined;

      expect(() => component['onCopy']()).not.toThrow();
    });
  });

  describe('Paste Operation', () => {
    it('should call canvas pasteEntity when paste is triggered', () => {
      spyOn(component.canvasComponent, 'pasteEntity');

      component['onPaste']();

      expect(component.canvasComponent.pasteEntity).toHaveBeenCalled();
    });

    it('should not throw if canvasComponent is not available', () => {
      (component as any).canvasComponent = undefined;

      expect(() => component['onPaste']()).not.toThrow();
    });
  });

  describe('Delete Operation', () => {
    it('should call canvas deleteSelectedEntities when delete is triggered', () => {
      spyOn(component.canvasComponent, 'deleteSelectedEntities');

      component['onDelete']();

      expect(component.canvasComponent.deleteSelectedEntities).toHaveBeenCalled();
    });

    it('should not throw if canvasComponent is not available', () => {
      (component as any).canvasComponent = undefined;

      expect(() => component['onDelete']()).not.toThrow();
    });
  });

  describe('Freeze Operation', () => {
    it('should call canvas freezeSelectedEntity when freeze is triggered', () => {
      spyOn(component.canvasComponent, 'freezeSelectedEntity');

      component['onFreeze']();

      expect(component.canvasComponent.freezeSelectedEntity).toHaveBeenCalled();
    });

    it('should not throw if canvasComponent is not available', () => {
      (component as any).canvasComponent = undefined;

      expect(() => component['onFreeze']()).not.toThrow();
    });
  });

  describe('Unfreeze Operation', () => {
    it('should call canvas unfreezeSelectedEntity when unfreeze is triggered', () => {
      spyOn(component.canvasComponent, 'unfreezeSelectedEntity');

      component['onUnfreeze']();

      expect(component.canvasComponent.unfreezeSelectedEntity).toHaveBeenCalled();
    });

    it('should not throw if canvasComponent is not available', () => {
      (component as any).canvasComponent = undefined;

      expect(() => component['onUnfreeze']()).not.toThrow();
    });
  });

  describe('hasSelectedEntity Getter', () => {
    it('should return false when no entity is selected', () => {
      component['selectedEntityProperties'].set(null);

      expect(component['hasSelectedEntity']).toBe(false);
    });

    it('should return true when entity is selected', () => {
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 }
      };

      component['selectedEntityProperties'].set(properties);

      expect(component['hasSelectedEntity']).toBe(true);
    });

    it('should update when entity selection changes', () => {
      expect(component['hasSelectedEntity']).toBe(false);

      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 }
      };

      component['onEntitySelected'](properties);
      expect(component['hasSelectedEntity']).toBe(true);

      component['onEntitySelected'](null);
      expect(component['hasSelectedEntity']).toBe(false);
    });
  });

  describe('isSelectedEntityFrozen Getter', () => {
    it('should return false when no entity is selected', () => {
      component['selectedEntityProperties'].set(null);

      expect(component['isSelectedEntityFrozen']).toBe(false);
    });

    it('should return false when selected entity is not frozen', () => {
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 },
        frozen: false
      };

      component['selectedEntityProperties'].set(properties);

      expect(component['isSelectedEntityFrozen']).toBe(false);
    });

    it('should return true when selected entity is frozen', () => {
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 },
        frozen: true
      };

      component['selectedEntityProperties'].set(properties);

      expect(component['isSelectedEntityFrozen']).toBe(true);
    });

    it('should return false when frozen property is undefined', () => {
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 }
      };

      component['selectedEntityProperties'].set(properties);

      expect(component['isSelectedEntityFrozen']).toBe(false);
    });

    it('should update when entity frozen state changes', () => {
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 },
        frozen: false
      };

      component['selectedEntityProperties'].set(properties);
      expect(component['isSelectedEntityFrozen']).toBe(false);

      const frozenProperties: EntityProperties = {
        ...properties,
        frozen: true
      };

      component['selectedEntityProperties'].set(frozenProperties);
      expect(component['isSelectedEntityFrozen']).toBe(true);
    });
  });

  describe('Component Integration', () => {
    it('should complete full workflow: select tool, select entity, update property', () => {
      spyOn(component.canvasComponent, 'setTool');
      spyOn(component.canvasComponent, 'updateEntityFromProperties');

      // Select line tool
      component['onToolSelected']('line');
      expect(component.canvasComponent.setTool).toHaveBeenCalledWith('line');

      // Simulate entity selection
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 }
      };
      component['onEntitySelected'](properties);
      expect(component['selectedEntityProperties']()).toEqual(properties);

      // Update property
      const update: PropertyUpdate = {
        entityId: '1',
        entityType: 'line',
        rotation: 45
      };
      component['onPropertyChanged'](update);
      expect(component.canvasComponent.updateEntityFromProperties).toHaveBeenCalledWith(update);
    });

    it('should complete copy-paste workflow', () => {
      spyOn(component.canvasComponent, 'copySelectedEntity');
      spyOn(component.canvasComponent, 'pasteEntity');

      // Select entity
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 }
      };
      component['onEntitySelected'](properties);

      // Copy
      component['onCopy']();
      expect(component.canvasComponent.copySelectedEntity).toHaveBeenCalled();

      // Paste
      component['onPaste']();
      expect(component.canvasComponent.pasteEntity).toHaveBeenCalled();
    });

    it('should complete freeze-unfreeze workflow', () => {
      spyOn(component.canvasComponent, 'freezeSelectedEntity');
      spyOn(component.canvasComponent, 'unfreezeSelectedEntity');

      // Select entity
      const properties: EntityProperties = {
        type: 'rectangle',
        id: '2',
        position: { x: 50, y: 75 },
        dimensions: { width: 100, height: 50 },
        frozen: false
      };
      component['onEntitySelected'](properties);
      expect(component['isSelectedEntityFrozen']).toBe(false);

      // Freeze
      component['onFreeze']();
      expect(component.canvasComponent.freezeSelectedEntity).toHaveBeenCalled();

      // Simulate frozen state update
      component['selectedEntityProperties'].set({ ...properties, frozen: true });
      expect(component['isSelectedEntityFrozen']).toBe(true);

      // Unfreeze
      component['onUnfreeze']();
      expect(component.canvasComponent.unfreezeSelectedEntity).toHaveBeenCalled();
    });

    it('should handle delete operation and clear selection', () => {
      spyOn(component.canvasComponent, 'deleteSelectedEntities');

      // Select entity
      const properties: EntityProperties = {
        type: 'circle',
        id: '3',
        position: { x: 100, y: 100 },
        dimensions: { radius: 50, diameter: 100 }
      };
      component['onEntitySelected'](properties);
      expect(component['hasSelectedEntity']).toBe(true);

      // Delete
      component['onDelete']();
      expect(component.canvasComponent.deleteSelectedEntities).toHaveBeenCalled();

      // Simulate deselection after delete
      component['onEntitySelected'](null);
      expect(component['hasSelectedEntity']).toBe(false);
    });
  });

  describe('Header Component Bindings', () => {
    it('should pass hasSelectedEntity to header component', () => {
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 }
      };

      component['onEntitySelected'](properties);
      fixture.detectChanges();

      expect(component['hasSelectedEntity']).toBe(true);
    });

    it('should pass isSelectedEntityFrozen to header component', () => {
      const properties: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 },
        frozen: true
      };

      component['onEntitySelected'](properties);
      fixture.detectChanges();

      expect(component['isSelectedEntityFrozen']).toBe(true);
    });
  });

  describe('Properties Panel Bindings', () => {
    it('should pass selectedEntityProperties to properties panel', () => {
      const properties: EntityProperties = {
        type: 'rectangle',
        id: '2',
        position: { x: 50, y: 75 },
        dimensions: { width: 100, height: 50 }
      };

      component['onEntitySelected'](properties);
      fixture.detectChanges();

      expect(component['selectedEntityProperties']()).toEqual(properties);
    });

    it('should pass null to properties panel when no entity is selected', () => {
      component['onEntitySelected'](null);
      fixture.detectChanges();

      expect(component['selectedEntityProperties']()).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid tool changes', () => {
      spyOn(component.canvasComponent, 'setTool');

      const tools = ['select', 'line', 'rectangle', 'circle', 'select'];
      tools.forEach(tool => component['onToolSelected'](tool));

      expect(component.canvasComponent.setTool).toHaveBeenCalledTimes(5);
    });

    it('should handle rapid entity selection changes', () => {
      const properties1: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 150 }
      };

      const properties2: EntityProperties = {
        type: 'rectangle',
        id: '2',
        position: { x: 50, y: 75 },
        dimensions: { width: 100, height: 50 }
      };

      component['onEntitySelected'](properties1);
      component['onEntitySelected'](properties2);
      component['onEntitySelected'](null);
      component['onEntitySelected'](properties1);

      expect(component['selectedEntityProperties']()).toEqual(properties1);
    });

    it('should handle multiple property updates in sequence', () => {
      spyOn(component.canvasComponent, 'updateEntityFromProperties');

      const updates: PropertyUpdate[] = [
        { entityId: '1', entityType: 'line', rotation: 45 },
        { entityId: '1', entityType: 'line', position: { x: 200, y: 300 } },
        { entityId: '1', entityType: 'line', frozen: true }
      ];

      updates.forEach(update => component['onPropertyChanged'](update));

      expect(component.canvasComponent.updateEntityFromProperties).toHaveBeenCalledTimes(3);
    });

    it('should handle operations when canvas component becomes available after delay', () => {
      (component as any).canvasComponent = undefined;

      // Try operations when canvas is not available
      expect(() => component['onToolSelected']('line')).not.toThrow();
      expect(() => component['onCopy']()).not.toThrow();

      // Simulate canvas becoming available
      const mockCanvas = jasmine.createSpyObj('CanvasComponent', [
        'setTool',
        'copySelectedEntity'
      ]);
      (component as any).canvasComponent = mockCanvas;

      // Now operations should work
      component['onToolSelected']('rectangle');
      expect(mockCanvas.setTool).toHaveBeenCalledWith('rectangle');

      component['onCopy']();
      expect(mockCanvas.copySelectedEntity).toHaveBeenCalled();
    });
  });
});
