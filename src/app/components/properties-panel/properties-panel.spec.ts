import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertiesPanelComponent } from './properties-panel';
import { EntityProperties, PropertyUpdate } from '../../types/entity-properties';

describe('PropertiesPanelComponent', () => {
  let component: PropertiesPanelComponent;
  let fixture: ComponentFixture<PropertiesPanelComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertiesPanelComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(PropertiesPanelComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default panel width', () => {
      expect(component['panelWidth']()).toBe(300);
    });

    it('should initialize with isResizing as false', () => {
      expect(component['isResizing']()).toBe(false);
    });

    it('should initialize with no selected entity', () => {
      expect(component.selectedEntity()).toBeNull();
    });

    it('should set correct min and max width', () => {
      expect(component['minWidth']).toBe(200);
      expect(component['maxWidth']).toBe(600);
    });

    it('should render properties panel container', () => {
      const panel = compiled.querySelector('.properties-panel');
      expect(panel).toBeTruthy();
    });

    it('should render properties title', () => {
      const title = compiled.querySelector('h3');
      expect(title?.textContent).toBe('Properties');
    });

    it('should render resize handle', () => {
      const resizeHandle = compiled.querySelector('.resize-handle');
      expect(resizeHandle).toBeTruthy();
    });
  });

  describe('Entity Type Display', () => {
    it('should display "None Selected" when no entity is selected', () => {
      expect(component['entityType']()).toBe('None Selected');
    });

    it('should display "Line" for line entity', () => {
      const lineEntity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', lineEntity);
      fixture.detectChanges();

      expect(component['entityType']()).toBe('Line');
    });

    it('should display "Rectangle" for rectangle entity', () => {
      const rectEntity: EntityProperties = {
        type: 'rectangle',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', rectEntity);
      fixture.detectChanges();

      expect(component['entityType']()).toBe('Rectangle');
    });

    it('should display "Circle" for circle entity', () => {
      const circleEntity: EntityProperties = {
        type: 'circle',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { radius: 50, diameter: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', circleEntity);
      fixture.detectChanges();

      expect(component['entityType']()).toBe('Circle');
    });
  });

  describe('Position Display', () => {
    it('should display empty string when no entity is selected', () => {
      expect(component['positionX']()).toBe('');
      expect(component['positionY']()).toBe('');
    });

    it('should display position coordinates for selected entity', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['positionX']()).toBe(100);
      expect(component['positionY']()).toBe(200);
    });

    it('should display decimal positions', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 123.45, y: 678.90 },
        dimensions: { length: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['positionX']()).toBe(123.45);
      expect(component['positionY']()).toBe(678.90);
    });

    it('should disable position inputs when no entity is selected', () => {
      fixture.detectChanges();

      const inputs = compiled.querySelectorAll('.position-inputs input') as NodeListOf<HTMLInputElement>;
      inputs.forEach(input => {
        expect(input.disabled).toBe(true);
      });
    });

    it('should enable position inputs when entity is selected', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      const inputs = compiled.querySelectorAll('.position-inputs input') as NodeListOf<HTMLInputElement>;
      inputs.forEach(input => {
        expect(input.disabled).toBe(false);
      });
    });
  });

  describe('Dimension Display', () => {
    it('should display length for line entity', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 150.5 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['dimensionPrimary']()).toBe(150.5);
      expect(component['primaryDimensionLabel']()).toBe('Length');
    });

    it('should display width and height for rectangle entity', () => {
      const entity: EntityProperties = {
        type: 'rectangle',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['dimensionPrimary']()).toBe(100);
      expect(component['dimensionSecondary']()).toBe(50);
      expect(component['primaryDimensionLabel']()).toBe('Width');
      expect(component['secondaryDimensionLabel']()).toBe('Height');
      expect(component['hasSecondaryDimension']()).toBe(true);
    });

    it('should display diameter and radius for circle entity', () => {
      const entity: EntityProperties = {
        type: 'circle',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { diameter: 100, radius: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['dimensionPrimary']()).toBe(100);
      expect(component['dimensionSecondary']()).toBe(50);
      expect(component['primaryDimensionLabel']()).toBe('Diameter');
      expect(component['secondaryDimensionLabel']()).toBe('Radius');
      expect(component['hasSecondaryDimension']()).toBe(true);
    });

    it('should not show secondary dimension for line entity', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['hasSecondaryDimension']()).toBe(false);
    });

    it('should render secondary dimension input for rectangle', () => {
      const entity: EntityProperties = {
        type: 'rectangle',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      const propertyGroups = compiled.querySelectorAll('.property-group');
      const dimensionsGroup = Array.from(propertyGroups).find(group =>
        group.querySelector('label')?.textContent === 'Dimensions:'
      );
      const inputs = dimensionsGroup?.querySelectorAll('input');
      expect(inputs?.length).toBe(2); // Width and Height
    });

    it('should render only one dimension input for line', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      const propertyGroups = compiled.querySelectorAll('.property-group');
      const dimensionsGroup = Array.from(propertyGroups).find(group =>
        group.querySelector('label')?.textContent === 'Dimensions:'
      );
      const inputs = dimensionsGroup?.querySelectorAll('input');
      expect(inputs?.length).toBe(1); // Length only
    });
  });

  describe('Rotation Display', () => {
    it('should display 0 when no entity is selected', () => {
      expect(component['rotation']()).toBe(0);
    });

    it('should display rotation value for selected entity', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 },
        rotation: 45
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['rotation']()).toBe(45);
    });

    it('should display 0 when rotation is not set', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['rotation']()).toBe(0);
    });
  });

  describe('Frozen State Display', () => {
    it('should display false when no entity is selected', () => {
      expect(component['frozen']()).toBe(false);
    });

    it('should display frozen value for selected entity', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 },
        frozen: true
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['frozen']()).toBe(true);
    });

    it('should check frozen checkbox when entity is frozen', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 },
        frozen: true
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      const checkbox = compiled.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should uncheck frozen checkbox when entity is not frozen', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 },
        frozen: false
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      const checkbox = compiled.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('Position Change Handlers', () => {
    it('should emit property update when X position changes', (done) => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      component.propertyChanged.subscribe((update: PropertyUpdate) => {
        expect(update.entityId).toBe('1');
        expect(update.entityType).toBe('line');
        expect(update.position?.x).toBe(150);
        expect(update.position?.y).toBe(200);
        done();
      });

      const event = { target: { value: '150' } } as any;
      component['onPositionXChange'](event);
    });

    it('should emit property update when Y position changes', (done) => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      component.propertyChanged.subscribe((update: PropertyUpdate) => {
        expect(update.entityId).toBe('1');
        expect(update.entityType).toBe('line');
        expect(update.position?.x).toBe(100);
        expect(update.position?.y).toBe(250);
        done();
      });

      const event = { target: { value: '250' } } as any;
      component['onPositionYChange'](event);
    });

    it('should ignore invalid X position values', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      spyOn(component.propertyChanged, 'emit');

      const event = { target: { value: 'invalid' } } as any;
      component['onPositionXChange'](event);

      expect(component.propertyChanged.emit).not.toHaveBeenCalled();
    });

    it('should ignore invalid Y position values', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      spyOn(component.propertyChanged, 'emit');

      const event = { target: { value: 'abc' } } as any;
      component['onPositionYChange'](event);

      expect(component.propertyChanged.emit).not.toHaveBeenCalled();
    });
  });

  describe('Dimension Change Handlers', () => {
    it('should emit property update when line length changes', (done) => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      component.propertyChanged.subscribe((update: PropertyUpdate) => {
        expect(update.dimensions?.length).toBe(150);
        done();
      });

      const event = { target: { value: '150' } } as any;
      component['onPrimaryDimensionChange'](event);
    });

    it('should emit property update when rectangle width changes', (done) => {
      const entity: EntityProperties = {
        type: 'rectangle',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      component.propertyChanged.subscribe((update: PropertyUpdate) => {
        expect(update.dimensions?.width).toBe(200);
        expect(update.dimensions?.height).toBe(50);
        done();
      });

      const event = { target: { value: '200' } } as any;
      component['onPrimaryDimensionChange'](event);
    });

    it('should emit property update when rectangle height changes', (done) => {
      const entity: EntityProperties = {
        type: 'rectangle',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      component.propertyChanged.subscribe((update: PropertyUpdate) => {
        expect(update.dimensions?.width).toBe(100);
        expect(update.dimensions?.height).toBe(75);
        done();
      });

      const event = { target: { value: '75' } } as any;
      component['onSecondaryDimensionChange'](event);
    });

    it('should emit property update when circle diameter changes', (done) => {
      const entity: EntityProperties = {
        type: 'circle',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { diameter: 100, radius: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      component.propertyChanged.subscribe((update: PropertyUpdate) => {
        expect(update.dimensions?.diameter).toBe(200);
        expect(update.dimensions?.radius).toBe(100);
        done();
      });

      const event = { target: { value: '200' } } as any;
      component['onPrimaryDimensionChange'](event);
    });

    it('should emit property update when circle radius changes', (done) => {
      const entity: EntityProperties = {
        type: 'circle',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { diameter: 100, radius: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      component.propertyChanged.subscribe((update: PropertyUpdate) => {
        expect(update.dimensions?.radius).toBe(75);
        expect(update.dimensions?.diameter).toBe(150);
        done();
      });

      const event = { target: { value: '75' } } as any;
      component['onSecondaryDimensionChange'](event);
    });

    it('should ignore zero or negative dimension values', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      spyOn(component.propertyChanged, 'emit');

      let event = { target: { value: '0' } } as any;
      component['onPrimaryDimensionChange'](event);
      expect(component.propertyChanged.emit).not.toHaveBeenCalled();

      event = { target: { value: '-10' } } as any;
      component['onPrimaryDimensionChange'](event);
      expect(component.propertyChanged.emit).not.toHaveBeenCalled();
    });

    it('should ignore invalid dimension values', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      spyOn(component.propertyChanged, 'emit');

      const event = { target: { value: 'invalid' } } as any;
      component['onPrimaryDimensionChange'](event);

      expect(component.propertyChanged.emit).not.toHaveBeenCalled();
    });
  });

  describe('Rotation Change Handler', () => {
    it('should emit property update when rotation changes', (done) => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 },
        rotation: 0
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      component.propertyChanged.subscribe((update: PropertyUpdate) => {
        expect(update.rotation).toBe(45);
        done();
      });

      const event = { target: { value: '45' } } as any;
      component['onRotationChange'](event);
    });

    it('should accept negative rotation values', (done) => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      component.propertyChanged.subscribe((update: PropertyUpdate) => {
        expect(update.rotation).toBe(-90);
        done();
      });

      const event = { target: { value: '-90' } } as any;
      component['onRotationChange'](event);
    });

    it('should ignore invalid rotation values', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      spyOn(component.propertyChanged, 'emit');

      const event = { target: { value: 'invalid' } } as any;
      component['onRotationChange'](event);

      expect(component.propertyChanged.emit).not.toHaveBeenCalled();
    });
  });

  describe('Frozen Change Handler', () => {
    it('should emit property update when frozen state changes to true', (done) => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 },
        frozen: false
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      component.propertyChanged.subscribe((update: PropertyUpdate) => {
        expect(update.frozen).toBe(true);
        done();
      });

      const event = { target: { checked: true } } as any;
      component['onFrozenChange'](event);
    });

    it('should emit property update when frozen state changes to false', (done) => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 },
        frozen: true
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      component.propertyChanged.subscribe((update: PropertyUpdate) => {
        expect(update.frozen).toBe(false);
        done();
      });

      const event = { target: { checked: false } } as any;
      component['onFrozenChange'](event);
    });
  });

  describe('Panel Resizing', () => {
    it('should set isResizing to true when resize starts', () => {
      const event = new MouseEvent('mousedown');
      spyOn(event, 'preventDefault');

      component['onResizeStart'](event);

      expect(component['isResizing']()).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should set isResizing to false on mouse up', () => {
      component['isResizing'].set(true);
      component['onMouseUp']();

      expect(component['isResizing']()).toBe(false);
    });

    it('should update panel width on mouse move when resizing', () => {
      component['isResizing'].set(true);

      const event = new MouseEvent('mousemove', { clientX: 1000 });
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1500);

      component['onMouseMove'](event);

      expect(component['panelWidth']()).toBe(500); // 1500 - 1000
    });

    it('should not update panel width when not resizing', () => {
      component['isResizing'].set(false);
      const initialWidth = component['panelWidth']();

      const event = new MouseEvent('mousemove', { clientX: 1000 });
      component['onMouseMove'](event);

      expect(component['panelWidth']()).toBe(initialWidth);
    });

    it('should clamp panel width to minimum', () => {
      component['isResizing'].set(true);

      const event = new MouseEvent('mousemove', { clientX: 1450 });
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1500);

      component['onMouseMove'](event);

      expect(component['panelWidth']()).toBe(200); // Minimum width
    });

    it('should clamp panel width to maximum', () => {
      component['isResizing'].set(true);

      const event = new MouseEvent('mousemove', { clientX: 800 });
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1500);

      component['onMouseMove'](event);

      expect(component['panelWidth']()).toBe(600); // Maximum width
    });

    it('should set isNarrow flag when width is less than 280', () => {
      component['isResizing'].set(true);

      const event = new MouseEvent('mousemove', { clientX: 1250 });
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1500);

      component['onMouseMove'](event);

      expect(component['isNarrow']()).toBe(true); // 250 < 280
    });

    it('should clear isNarrow flag when width is 280 or more', () => {
      component['isResizing'].set(true);

      const event = new MouseEvent('mousemove', { clientX: 1200 });
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1500);

      component['onMouseMove'](event);

      expect(component['isNarrow']()).toBe(false); // 300 >= 280
    });

    it('should apply narrow class when panel is narrow', () => {
      component['isNarrow'].set(true);
      fixture.detectChanges();

      const positionInputs = compiled.querySelector('.position-inputs');
      expect(positionInputs?.classList.contains('narrow')).toBe(true);
    });
  });

  describe('hasEntity Computed Property', () => {
    it('should return false when no entity is selected', () => {
      expect(component['hasEntity']()).toBe(false);
    });

    it('should return true when entity is selected', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['hasEntity']()).toBe(true);
    });
  });

  describe('Property Update Validation', () => {
    it('should not emit update when entity has no id', () => {
      const entity: EntityProperties = {
        type: 'line',
        id: null,
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      spyOn(component.propertyChanged, 'emit');

      const event = { target: { value: '45' } } as any;
      component['onRotationChange'](event);

      expect(component.propertyChanged.emit).not.toHaveBeenCalled();
    });

    it('should not emit update when entity has no type', () => {
      const entity: EntityProperties = {
        type: null,
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      spyOn(component.propertyChanged, 'emit');

      const event = { target: { value: '45' } } as any;
      component['onRotationChange'](event);

      expect(component.propertyChanged.emit).not.toHaveBeenCalled();
    });
  });

  describe('ChangeDetectionStrategy.OnPush', () => {
    it('should use OnPush change detection strategy', () => {
      const componentDef = (component.constructor as any).ɵcmp;
      expect(componentDef.onPush).toBeTruthy(); // OnPush strategy
    });
  });

  describe('Template Integration', () => {
    it('should update displayed values when entity changes', () => {
      const entity1: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 100, y: 200 },
        dimensions: { length: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', entity1);
      fixture.detectChanges();

      let typeDisplay = compiled.querySelector('.property-value');
      expect(typeDisplay?.textContent?.trim()).toBe('Line');

      const entity2: EntityProperties = {
        type: 'rectangle',
        id: '2',
        position: { x: 300, y: 400 },
        dimensions: { width: 100, height: 75 }
      };
      fixture.componentRef.setInput('selectedEntity', entity2);
      fixture.detectChanges();

      typeDisplay = compiled.querySelector('.property-value');
      expect(typeDisplay?.textContent?.trim()).toBe('Rectangle');
    });

    it('should disable all inputs when no entity is selected', () => {
      fixture.detectChanges();

      const allInputs = compiled.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
      allInputs.forEach(input => {
        if (input.type !== 'checkbox' || input !== compiled.querySelector('input[type="checkbox"]')) {
          expect(input.disabled).toBe(true);
        }
      });
    });

    it('should apply resizing class to resize handle when resizing', () => {
      component['isResizing'].set(false);
      fixture.detectChanges();

      let resizeHandle = compiled.querySelector('.resize-handle');
      expect(resizeHandle?.classList.contains('resizing')).toBe(false);

      component['isResizing'].set(true);
      fixture.detectChanges();

      resizeHandle = compiled.querySelector('.resize-handle');
      expect(resizeHandle?.classList.contains('resizing')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle entity with missing position', () => {
      const entity: any = {
        type: 'line',
        id: '1',
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['positionX']()).toBe('');
      expect(component['positionY']()).toBe('');
    });

    it('should handle entity with missing dimensions', () => {
      const entity: any = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 }
      };
      fixture.componentRef.setInput('selectedEntity', entity);
      fixture.detectChanges();

      expect(component['dimensionPrimary']()).toBe('');
    });

    it('should handle rapid entity changes', () => {
      for (let i = 0; i < 10; i++) {
        const entity: EntityProperties = {
          type: 'line',
          id: `${i}`,
          position: { x: i * 10, y: i * 20 },
          dimensions: { length: i * 5 }
        };
        fixture.componentRef.setInput('selectedEntity', entity);
        fixture.detectChanges();
      }

      expect(component['positionX']()).toBe(90);
      expect(component['positionY']()).toBe(180);
    });

    it('should handle switching between entity types', () => {
      const lineEntity: EntityProperties = {
        type: 'line',
        id: '1',
        position: { x: 0, y: 0 },
        dimensions: { length: 100 }
      };
      fixture.componentRef.setInput('selectedEntity', lineEntity);
      fixture.detectChanges();

      expect(component['hasSecondaryDimension']()).toBe(false);

      const rectEntity: EntityProperties = {
        type: 'rectangle',
        id: '2',
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 50 }
      };
      fixture.componentRef.setInput('selectedEntity', rectEntity);
      fixture.detectChanges();

      expect(component['hasSecondaryDimension']()).toBe(true);
    });
  });
});
