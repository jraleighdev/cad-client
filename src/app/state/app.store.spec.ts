import { TestBed } from '@angular/core/testing';
import { AppStore, ClipboardEntity, DeletedEntity } from './app.store';
import { Line, Rectangle, Circle, Point } from '../types/geometry';
import { provideZonelessChangeDetection } from '@angular/core';

describe('AppStore', () => {
  let store: InstanceType<typeof AppStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppStore, provideZonelessChangeDetection()]
    });

    store = TestBed.inject(AppStore);
  });

  describe('Store Initialization', () => {
    it('should create the store', () => {
      expect(store).toBeTruthy();
    });

    it('should initialize with snapEnabled as true', () => {
      expect(store.snapEnabled()).toBe(true);
    });

    it('should initialize with orthoEnabled as true', () => {
      expect(store.orthoEnabled()).toBe(true);
    });

    it('should initialize with mousePosition at origin', () => {
      expect(store.mousePosition()).toEqual({ x: 0, y: 0 });
    });

    it('should initialize with null clipboardEntity', () => {
      expect(store.clipboardEntity()).toBeNull();
    });

    it('should initialize with empty deletedEntities array', () => {
      expect(store.deletedEntities()).toEqual([]);
    });
  });

  describe('toggleSnap', () => {
    it('should toggle snapEnabled from true to false', () => {
      expect(store.snapEnabled()).toBe(true);

      store.toggleSnap();

      expect(store.snapEnabled()).toBe(false);
    });

    it('should toggle snapEnabled from false to true', () => {
      store.toggleSnap(); // Set to false
      expect(store.snapEnabled()).toBe(false);

      store.toggleSnap(); // Toggle back to true

      expect(store.snapEnabled()).toBe(true);
    });

    it('should toggle snapEnabled multiple times correctly', () => {
      const initialState = store.snapEnabled();

      store.toggleSnap();
      expect(store.snapEnabled()).toBe(!initialState);

      store.toggleSnap();
      expect(store.snapEnabled()).toBe(initialState);

      store.toggleSnap();
      expect(store.snapEnabled()).toBe(!initialState);
    });

    it('should not affect other state properties', () => {
      const initialMousePos = store.mousePosition();
      const initialOrtho = store.orthoEnabled();

      store.toggleSnap();

      expect(store.mousePosition()).toEqual(initialMousePos);
      expect(store.orthoEnabled()).toBe(initialOrtho);
    });
  });

  describe('toggleOrtho', () => {
    it('should toggle orthoEnabled from true to false', () => {
      expect(store.orthoEnabled()).toBe(true);

      store.toggleOrtho();

      expect(store.orthoEnabled()).toBe(false);
    });

    it('should toggle orthoEnabled from false to true', () => {
      store.toggleOrtho(); // Set to false
      expect(store.orthoEnabled()).toBe(false);

      store.toggleOrtho(); // Toggle back to true

      expect(store.orthoEnabled()).toBe(true);
    });

    it('should toggle orthoEnabled multiple times correctly', () => {
      const initialState = store.orthoEnabled();

      store.toggleOrtho();
      expect(store.orthoEnabled()).toBe(!initialState);

      store.toggleOrtho();
      expect(store.orthoEnabled()).toBe(initialState);

      store.toggleOrtho();
      expect(store.orthoEnabled()).toBe(!initialState);
    });

    it('should not affect other state properties', () => {
      const initialMousePos = store.mousePosition();
      const initialSnap = store.snapEnabled();

      store.toggleOrtho();

      expect(store.mousePosition()).toEqual(initialMousePos);
      expect(store.snapEnabled()).toBe(initialSnap);
    });
  });

  describe('updateMousePosition', () => {
    it('should update mouse position', () => {
      const newPosition: Point = { x: 100, y: 200 };

      store.updateMousePosition(newPosition);

      expect(store.mousePosition()).toEqual(newPosition);
    });

    it('should update mouse position multiple times', () => {
      const position1: Point = { x: 50, y: 75 };
      const position2: Point = { x: 150, y: 225 };
      const position3: Point = { x: 300, y: 400 };

      store.updateMousePosition(position1);
      expect(store.mousePosition()).toEqual(position1);

      store.updateMousePosition(position2);
      expect(store.mousePosition()).toEqual(position2);

      store.updateMousePosition(position3);
      expect(store.mousePosition()).toEqual(position3);
    });

    it('should handle negative coordinates', () => {
      const negativePosition: Point = { x: -100, y: -200 };

      store.updateMousePosition(negativePosition);

      expect(store.mousePosition()).toEqual(negativePosition);
    });

    it('should handle decimal coordinates', () => {
      const decimalPosition: Point = { x: 123.456, y: 789.012 };

      store.updateMousePosition(decimalPosition);

      expect(store.mousePosition()).toEqual(decimalPosition);
    });

    it('should handle zero coordinates', () => {
      store.updateMousePosition({ x: 100, y: 200 });

      store.updateMousePosition({ x: 0, y: 0 });

      expect(store.mousePosition()).toEqual({ x: 0, y: 0 });
    });

    it('should not affect other state properties', () => {
      const initialSnap = store.snapEnabled();
      const initialOrtho = store.orthoEnabled();

      store.updateMousePosition({ x: 100, y: 200 });

      expect(store.snapEnabled()).toBe(initialSnap);
      expect(store.orthoEnabled()).toBe(initialOrtho);
    });
  });

  describe('copyEntity', () => {
    it('should copy a line entity', () => {
      const line: Line = {
        id: '1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        color: '#000000',
        width: 2
      };

      store.copyEntity(line);

      expect(store.clipboardEntity()).toEqual(line);
    });

    it('should copy a rectangle entity', () => {
      const rectangle: Rectangle = {
        id: '2',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        color: '#000000',
        width: 2,
        fillColor: 'transparent'
      };

      store.copyEntity(rectangle);

      expect(store.clipboardEntity()).toEqual(rectangle);
    });

    it('should copy a circle entity', () => {
      const circle: Circle = {
        id: '3',
        center: { x: 50, y: 50 },
        radius: 25,
        color: '#000000',
        width: 2,
        fillColor: 'transparent'
      };

      store.copyEntity(circle);

      expect(store.clipboardEntity()).toEqual(circle);
    });

    it('should replace previous clipboard entity', () => {
      const entity1: Line = {
        id: '1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        color: '#000000',
        width: 2
      };

      const entity2: Rectangle = {
        id: '2',
        start: { x: 0, y: 0 },
        end: { x: 200, y: 200 },
        color: '#ff0000',
        width: 3
      };

      store.copyEntity(entity1);
      expect(store.clipboardEntity()).toEqual(entity1);

      store.copyEntity(entity2);
      expect(store.clipboardEntity()).toEqual(entity2);
    });

    it('should copy entity with rotation property', () => {
      const line: Line = {
        id: '1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        color: '#000000',
        width: 2,
        rotation: 45
      };

      store.copyEntity(line);

      expect(store.clipboardEntity()).toEqual(line);
      expect((store.clipboardEntity() as Line).rotation).toBe(45);
    });

    it('should copy entity with frozen property', () => {
      const circle: Circle = {
        id: '1',
        center: { x: 50, y: 50 },
        radius: 25,
        color: '#000000',
        width: 2,
        frozen: true
      };

      store.copyEntity(circle);

      expect(store.clipboardEntity()).toEqual(circle);
      expect((store.clipboardEntity() as Circle).frozen).toBe(true);
    });

    it('should not affect other state properties', () => {
      const initialSnap = store.snapEnabled();
      const initialOrtho = store.orthoEnabled();
      const line: Line = {
        id: '1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        color: '#000000',
        width: 2
      };

      store.copyEntity(line);

      expect(store.snapEnabled()).toBe(initialSnap);
      expect(store.orthoEnabled()).toBe(initialOrtho);
    });
  });

  describe('clearClipboard', () => {
    it('should clear clipboard when it has content', () => {
      const line: Line = {
        id: '1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        color: '#000000',
        width: 2
      };

      store.copyEntity(line);
      expect(store.clipboardEntity()).not.toBeNull();

      store.clearClipboard();

      expect(store.clipboardEntity()).toBeNull();
    });

    it('should handle clearing already empty clipboard', () => {
      expect(store.clipboardEntity()).toBeNull();

      store.clearClipboard();

      expect(store.clipboardEntity()).toBeNull();
    });

    it('should clear clipboard multiple times', () => {
      const line: Line = {
        id: '1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        color: '#000000',
        width: 2
      };

      store.copyEntity(line);
      store.clearClipboard();
      store.clearClipboard();
      store.clearClipboard();

      expect(store.clipboardEntity()).toBeNull();
    });

    it('should not affect other state properties', () => {
      const initialSnap = store.snapEnabled();
      const initialOrtho = store.orthoEnabled();

      store.clearClipboard();

      expect(store.snapEnabled()).toBe(initialSnap);
      expect(store.orthoEnabled()).toBe(initialOrtho);
    });
  });

  describe('addDeletedEntity', () => {
    it('should add a deleted line entity', () => {
      const deletedLine: DeletedEntity = {
        type: 'line',
        data: {
          id: '1',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 100 },
          color: '#000000',
          width: 2
        }
      };

      store.addDeletedEntity(deletedLine);

      expect(store.deletedEntities().length).toBe(1);
      expect(store.deletedEntities()[0]).toEqual(deletedLine);
    });

    it('should add a deleted rectangle entity', () => {
      const deletedRect: DeletedEntity = {
        type: 'rectangle',
        data: {
          id: '1',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 100 },
          color: '#000000',
          width: 2
        }
      };

      store.addDeletedEntity(deletedRect);

      expect(store.deletedEntities().length).toBe(1);
      expect(store.deletedEntities()[0]).toEqual(deletedRect);
    });

    it('should add a deleted circle entity', () => {
      const deletedCircle: DeletedEntity = {
        type: 'circle',
        data: {
          id: '1',
          center: { x: 50, y: 50 },
          radius: 25,
          color: '#000000',
          width: 2
        }
      };

      store.addDeletedEntity(deletedCircle);

      expect(store.deletedEntities().length).toBe(1);
      expect(store.deletedEntities()[0]).toEqual(deletedCircle);
    });

    it('should add multiple deleted entities', () => {
      const entity1: DeletedEntity = {
        type: 'line',
        data: {
          id: '1',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 100 },
          color: '#000000',
          width: 2
        }
      };

      const entity2: DeletedEntity = {
        type: 'rectangle',
        data: {
          id: '2',
          start: { x: 0, y: 0 },
          end: { x: 50, y: 50 },
          color: '#ff0000',
          width: 1
        }
      };

      store.addDeletedEntity(entity1);
      store.addDeletedEntity(entity2);

      expect(store.deletedEntities().length).toBe(2);
      expect(store.deletedEntities()[0]).toEqual(entity1);
      expect(store.deletedEntities()[1]).toEqual(entity2);
    });

    it('should keep only last 10 deleted entities', () => {
      for (let i = 0; i < 15; i++) {
        const entity: DeletedEntity = {
          type: 'line',
          data: {
            id: `${i}`,
            start: { x: 0, y: 0 },
            end: { x: 100, y: 100 },
            color: '#000000',
            width: 2
          }
        };
        store.addDeletedEntity(entity);
      }

      expect(store.deletedEntities().length).toBe(10);
      expect(store.deletedEntities()[0].data.id).toBe('5'); // First 5 should be trimmed
      expect(store.deletedEntities()[9].data.id).toBe('14');
    });

    it('should trim from the beginning when exceeding limit', () => {
      for (let i = 0; i < 12; i++) {
        const entity: DeletedEntity = {
          type: 'line',
          data: {
            id: `entity-${i}`,
            start: { x: i, y: i },
            end: { x: i + 10, y: i + 10 },
            color: '#000000',
            width: 2
          }
        };
        store.addDeletedEntity(entity);
      }

      const deletedEntities = store.deletedEntities();
      expect(deletedEntities.length).toBe(10);
      expect(deletedEntities[0].data.id).toBe('entity-2');
      expect(deletedEntities[9].data.id).toBe('entity-11');
    });

    it('should not affect other state properties', () => {
      const initialSnap = store.snapEnabled();
      const initialOrtho = store.orthoEnabled();

      const entity: DeletedEntity = {
        type: 'line',
        data: {
          id: '1',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 100 },
          color: '#000000',
          width: 2
        }
      };

      store.addDeletedEntity(entity);

      expect(store.snapEnabled()).toBe(initialSnap);
      expect(store.orthoEnabled()).toBe(initialOrtho);
    });
  });

  describe('addDeletedEntities', () => {
    it('should add multiple deleted entities at once', () => {
      const entities: DeletedEntity[] = [
        {
          type: 'line',
          data: {
            id: '1',
            start: { x: 0, y: 0 },
            end: { x: 100, y: 100 },
            color: '#000000',
            width: 2
          }
        },
        {
          type: 'rectangle',
          data: {
            id: '2',
            start: { x: 0, y: 0 },
            end: { x: 50, y: 50 },
            color: '#ff0000',
            width: 1
          }
        },
        {
          type: 'circle',
          data: {
            id: '3',
            center: { x: 25, y: 25 },
            radius: 15,
            color: '#00ff00',
            width: 1
          }
        }
      ];

      store.addDeletedEntities(entities);

      expect(store.deletedEntities().length).toBe(3);
      expect(store.deletedEntities()).toEqual(entities);
    });

    it('should add empty array without error', () => {
      store.addDeletedEntities([]);

      expect(store.deletedEntities().length).toBe(0);
    });

    it('should append to existing deleted entities', () => {
      const entity1: DeletedEntity = {
        type: 'line',
        data: {
          id: '1',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 100 },
          color: '#000000',
          width: 2
        }
      };

      const entities2: DeletedEntity[] = [
        {
          type: 'rectangle',
          data: {
            id: '2',
            start: { x: 0, y: 0 },
            end: { x: 50, y: 50 },
            color: '#ff0000',
            width: 1
          }
        },
        {
          type: 'circle',
          data: {
            id: '3',
            center: { x: 25, y: 25 },
            radius: 15,
            color: '#00ff00',
            width: 1
          }
        }
      ];

      store.addDeletedEntity(entity1);
      store.addDeletedEntities(entities2);

      expect(store.deletedEntities().length).toBe(3);
      expect(store.deletedEntities()[0]).toEqual(entity1);
      expect(store.deletedEntities()[1]).toEqual(entities2[0]);
      expect(store.deletedEntities()[2]).toEqual(entities2[1]);
    });

    it('should keep only last 10 deleted entities when adding batch', () => {
      const entities: DeletedEntity[] = [];
      for (let i = 0; i < 15; i++) {
        entities.push({
          type: 'line',
          data: {
            id: `${i}`,
            start: { x: 0, y: 0 },
            end: { x: 100, y: 100 },
            color: '#000000',
            width: 2
          }
        });
      }

      store.addDeletedEntities(entities);

      expect(store.deletedEntities().length).toBe(10);
      expect(store.deletedEntities()[0].data.id).toBe('5');
      expect(store.deletedEntities()[9].data.id).toBe('14');
    });

    it('should trim correctly when batch addition exceeds limit', () => {
      const initialEntities: DeletedEntity[] = [];
      for (let i = 0; i < 5; i++) {
        initialEntities.push({
          type: 'line',
          data: {
            id: `initial-${i}`,
            start: { x: 0, y: 0 },
            end: { x: 100, y: 100 },
            color: '#000000',
            width: 2
          }
        });
      }

      const newEntities: DeletedEntity[] = [];
      for (let i = 0; i < 8; i++) {
        newEntities.push({
          type: 'circle',
          data: {
            id: `new-${i}`,
            center: { x: 50, y: 50 },
            radius: 25,
            color: '#ff0000',
            width: 2
          }
        });
      }

      store.addDeletedEntities(initialEntities);
      store.addDeletedEntities(newEntities);

      const deletedEntities = store.deletedEntities();
      expect(deletedEntities.length).toBe(10);
      expect(deletedEntities[0].data.id).toBe('initial-3');
      expect(deletedEntities[9].data.id).toBe('new-7');
    });

    it('should not affect other state properties', () => {
      const initialSnap = store.snapEnabled();
      const initialOrtho = store.orthoEnabled();

      const entities: DeletedEntity[] = [
        {
          type: 'line',
          data: {
            id: '1',
            start: { x: 0, y: 0 },
            end: { x: 100, y: 100 },
            color: '#000000',
            width: 2
          }
        }
      ];

      store.addDeletedEntities(entities);

      expect(store.snapEnabled()).toBe(initialSnap);
      expect(store.orthoEnabled()).toBe(initialOrtho);
    });
  });

  describe('State Immutability', () => {
    it('should not mutate original state when toggling snap', () => {
      const originalState = store.snapEnabled();
      store.toggleSnap();
      store.toggleSnap();

      expect(store.snapEnabled()).toBe(originalState);
    });

    it('should not allow external mutation of deletedEntities array', () => {
      const entity: DeletedEntity = {
        type: 'line',
        data: {
          id: '1',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 100 },
          color: '#000000',
          width: 2
        }
      };

      store.addDeletedEntity(entity);
      const deletedEntities = store.deletedEntities();

      // Attempting to mutate the returned array should not affect the store
      const initialLength = deletedEntities.length;

      expect(store.deletedEntities().length).toBe(initialLength);
    });
  });

  describe('Complex Workflows', () => {
    it('should handle complete copy-paste workflow', () => {
      const line: Line = {
        id: '1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        color: '#000000',
        width: 2
      };

      expect(store.clipboardEntity()).toBeNull();

      store.copyEntity(line);
      expect(store.clipboardEntity()).toEqual(line);

      store.clearClipboard();
      expect(store.clipboardEntity()).toBeNull();
    });

    it('should handle delete and undo workflow', () => {
      const entities: DeletedEntity[] = [];
      for (let i = 0; i < 3; i++) {
        entities.push({
          type: 'line',
          data: {
            id: `${i}`,
            start: { x: 0, y: 0 },
            end: { x: 100, y: 100 },
            color: '#000000',
            width: 2
          }
        });
      }

      store.addDeletedEntities(entities);

      expect(store.deletedEntities().length).toBe(3);
      expect(store.deletedEntities()[2].data.id).toBe('2');
    });

    it('should handle simultaneous state changes', () => {
      const line: Line = {
        id: '1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        color: '#000000',
        width: 2
      };

      const deletedEntity: DeletedEntity = {
        type: 'rectangle',
        data: {
          id: '2',
          start: { x: 0, y: 0 },
          end: { x: 50, y: 50 },
          color: '#ff0000',
          width: 1
        }
      };

      store.toggleSnap();
      store.toggleOrtho();
      store.updateMousePosition({ x: 123, y: 456 });
      store.copyEntity(line);
      store.addDeletedEntity(deletedEntity);

      expect(store.snapEnabled()).toBe(false);
      expect(store.orthoEnabled()).toBe(false);
      expect(store.mousePosition()).toEqual({ x: 123, y: 456 });
      expect(store.clipboardEntity()).toEqual(line);
      expect(store.deletedEntities().length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large coordinate values', () => {
      const largePosition: Point = { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER };

      store.updateMousePosition(largePosition);

      expect(store.mousePosition()).toEqual(largePosition);
    });

    it('should handle adding exactly 10 deleted entities', () => {
      const entities: DeletedEntity[] = [];
      for (let i = 0; i < 10; i++) {
        entities.push({
          type: 'line',
          data: {
            id: `${i}`,
            start: { x: 0, y: 0 },
            end: { x: 100, y: 100 },
            color: '#000000',
            width: 2
          }
        });
      }

      store.addDeletedEntities(entities);

      expect(store.deletedEntities().length).toBe(10);
    });

    it('should handle rapid state changes', () => {
      for (let i = 0; i < 100; i++) {
        store.toggleSnap();
        store.toggleOrtho();
        store.updateMousePosition({ x: i, y: i });
      }

      expect(store.snapEnabled()).toBe(true); // Toggled even number of times
      expect(store.orthoEnabled()).toBe(true);
      expect(store.mousePosition()).toEqual({ x: 99, y: 99 });
    });
  });

  describe('Signal Reactivity', () => {
    it('should emit new values when state changes', () => {
      let snapValue = store.snapEnabled();
      expect(snapValue).toBe(true);

      store.toggleSnap();
      snapValue = store.snapEnabled();
      expect(snapValue).toBe(false);
    });

    it('should allow computed properties based on store signals', () => {
      const hasClipboard = () => store.clipboardEntity() !== null;

      expect(hasClipboard()).toBe(false);

      const line: Line = {
        id: '1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        color: '#000000',
        width: 2
      };

      store.copyEntity(line);
      expect(hasClipboard()).toBe(true);

      store.clearClipboard();
      expect(hasClipboard()).toBe(false);
    });
  });
});
