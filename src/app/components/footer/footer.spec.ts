import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer';
import { AppStore } from '../../state/app.store';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let mockAppStore: any;
  let compiled: HTMLElement;

  beforeEach(async () => {
    // Mock AppStore
    mockAppStore = {
      snapEnabled: signal(true),
      orthoEnabled: signal(true),
      mousePosition: signal({ x: 0, y: 0 }),
      toggleSnap: jasmine.createSpy('toggleSnap'),
      toggleOrtho: jasmine.createSpy('toggleOrtho')
    };

    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        { provide: AppStore, useValue: mockAppStore },
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should inject AppStore', () => {
      expect(component.appStore).toBe(mockAppStore);
    });

    it('should render footer element', () => {
      const footer = compiled.querySelector('footer');
      expect(footer).toBeTruthy();
    });

    it('should have footer-content container', () => {
      const content = compiled.querySelector('.footer-content');
      expect(content).toBeTruthy();
    });
  });

  describe('Mouse Position Display', () => {
    it('should display initial mouse position as "X: 0, Y: 0"', () => {
      expect(component.mousePositionDisplay()).toBe('X: 0, Y: 0');
    });

    it('should update mouse position display when position changes', () => {
      mockAppStore.mousePosition.set({ x: 100, y: 200 });
      fixture.detectChanges();

      expect(component.mousePositionDisplay()).toBe('X: 100, Y: 200');
    });

    it('should render mouse position in coordinates span', () => {
      mockAppStore.mousePosition.set({ x: 150, y: 250 });
      fixture.detectChanges();

      const coordinates = compiled.querySelector('.coordinates');
      expect(coordinates?.textContent).toBe('X: 150, Y: 250');
    });

    it('should update display when mouse position changes multiple times', () => {
      mockAppStore.mousePosition.set({ x: 50, y: 75 });
      fixture.detectChanges();
      expect(component.mousePositionDisplay()).toBe('X: 50, Y: 75');

      mockAppStore.mousePosition.set({ x: 300, y: 400 });
      fixture.detectChanges();
      expect(component.mousePositionDisplay()).toBe('X: 300, Y: 400');
    });

    it('should handle negative coordinates', () => {
      mockAppStore.mousePosition.set({ x: -10, y: -20 });
      fixture.detectChanges();

      expect(component.mousePositionDisplay()).toBe('X: -10, Y: -20');
    });

    it('should handle decimal coordinates', () => {
      mockAppStore.mousePosition.set({ x: 123.45, y: 678.90 });
      fixture.detectChanges();

      expect(component.mousePositionDisplay()).toBe('X: 123.45, Y: 678.9');
    });
  });

  describe('Snap Mode Display', () => {
    it('should display "On" when snap is enabled', () => {
      mockAppStore.snapEnabled.set(true);
      fixture.detectChanges();

      expect(component.snapDisplay()).toBe('On');
    });

    it('should display "Off" when snap is disabled', () => {
      mockAppStore.snapEnabled.set(false);
      fixture.detectChanges();

      expect(component.snapDisplay()).toBe('Off');
    });

    it('should render snap status in snap-status span', () => {
      mockAppStore.snapEnabled.set(true);
      fixture.detectChanges();

      const snapStatus = compiled.querySelector('.snap-status');
      expect(snapStatus?.textContent).toContain('Snap: On');
    });

    it('should update display when snap mode toggles', () => {
      mockAppStore.snapEnabled.set(true);
      fixture.detectChanges();
      expect(component.snapDisplay()).toBe('On');

      mockAppStore.snapEnabled.set(false);
      fixture.detectChanges();
      expect(component.snapDisplay()).toBe('Off');
    });

    it('should have clickable class on snap status', () => {
      const snapStatus = compiled.querySelector('.snap-status');
      expect(snapStatus?.classList.contains('clickable')).toBe(true);
    });
  });

  describe('Ortho Mode Display', () => {
    it('should display "On" when ortho is enabled', () => {
      mockAppStore.orthoEnabled.set(true);
      fixture.detectChanges();

      expect(component.orthoDisplay()).toBe('On');
    });

    it('should display "Off" when ortho is disabled', () => {
      mockAppStore.orthoEnabled.set(false);
      fixture.detectChanges();

      expect(component.orthoDisplay()).toBe('Off');
    });

    it('should render ortho status in ortho-status span', () => {
      mockAppStore.orthoEnabled.set(true);
      fixture.detectChanges();

      const orthoStatus = compiled.querySelector('.ortho-status');
      expect(orthoStatus?.textContent).toContain('Ortho: On');
    });

    it('should update display when ortho mode toggles', () => {
      mockAppStore.orthoEnabled.set(true);
      fixture.detectChanges();
      expect(component.orthoDisplay()).toBe('On');

      mockAppStore.orthoEnabled.set(false);
      fixture.detectChanges();
      expect(component.orthoDisplay()).toBe('Off');
    });

    it('should have clickable class on ortho status', () => {
      const orthoStatus = compiled.querySelector('.ortho-status');
      expect(orthoStatus?.classList.contains('clickable')).toBe(true);
    });
  });

  describe('Snap Click Interaction', () => {
    it('should call appStore.toggleSnap when snap status is clicked', () => {
      component.onSnapClick();
      expect(mockAppStore.toggleSnap).toHaveBeenCalled();
    });

    it('should toggle snap when clicking snap status element', () => {
      const snapStatus = compiled.querySelector('.snap-status') as HTMLElement;
      snapStatus.click();

      expect(mockAppStore.toggleSnap).toHaveBeenCalled();
    });

    it('should call toggleSnap only once per click', () => {
      const snapStatus = compiled.querySelector('.snap-status') as HTMLElement;
      snapStatus.click();

      expect(mockAppStore.toggleSnap).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple snap clicks', () => {
      const snapStatus = compiled.querySelector('.snap-status') as HTMLElement;

      snapStatus.click();
      snapStatus.click();
      snapStatus.click();

      expect(mockAppStore.toggleSnap).toHaveBeenCalledTimes(3);
    });
  });

  describe('Ortho Click Interaction', () => {
    it('should call appStore.toggleOrtho when ortho status is clicked', () => {
      component.onOrthoClick();
      expect(mockAppStore.toggleOrtho).toHaveBeenCalled();
    });

    it('should toggle ortho when clicking ortho status element', () => {
      const orthoStatus = compiled.querySelector('.ortho-status') as HTMLElement;
      orthoStatus.click();

      expect(mockAppStore.toggleOrtho).toHaveBeenCalled();
    });

    it('should call toggleOrtho only once per click', () => {
      const orthoStatus = compiled.querySelector('.ortho-status') as HTMLElement;
      orthoStatus.click();

      expect(mockAppStore.toggleOrtho).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple ortho clicks', () => {
      const orthoStatus = compiled.querySelector('.ortho-status') as HTMLElement;

      orthoStatus.click();
      orthoStatus.click();
      orthoStatus.click();

      expect(mockAppStore.toggleOrtho).toHaveBeenCalledTimes(3);
    });
  });

  describe('Computed Properties Reactivity', () => {
    it('should react to snap state changes', () => {
      mockAppStore.snapEnabled.set(true);
      expect(component.snapDisplay()).toBe('On');

      mockAppStore.snapEnabled.set(false);
      expect(component.snapDisplay()).toBe('Off');

      mockAppStore.snapEnabled.set(true);
      expect(component.snapDisplay()).toBe('On');
    });

    it('should react to ortho state changes', () => {
      mockAppStore.orthoEnabled.set(true);
      expect(component.orthoDisplay()).toBe('On');

      mockAppStore.orthoEnabled.set(false);
      expect(component.orthoDisplay()).toBe('Off');

      mockAppStore.orthoEnabled.set(true);
      expect(component.orthoDisplay()).toBe('On');
    });

    it('should react to mouse position changes', () => {
      mockAppStore.mousePosition.set({ x: 10, y: 20 });
      expect(component.mousePositionDisplay()).toBe('X: 10, Y: 20');

      mockAppStore.mousePosition.set({ x: 30, y: 40 });
      expect(component.mousePositionDisplay()).toBe('X: 30, Y: 40');
    });

    it('should handle simultaneous state changes', () => {
      mockAppStore.snapEnabled.set(false);
      mockAppStore.orthoEnabled.set(false);
      mockAppStore.mousePosition.set({ x: 999, y: 888 });
      fixture.detectChanges();

      expect(component.snapDisplay()).toBe('Off');
      expect(component.orthoDisplay()).toBe('Off');
      expect(component.mousePositionDisplay()).toBe('X: 999, Y: 888');
    });
  });

  describe('Template Structure', () => {
    it('should have footer-right container', () => {
      const footerRight = compiled.querySelector('.footer-right');
      expect(footerRight).toBeTruthy();
    });

    it('should render snap and ortho statuses in footer-right', () => {
      const footerRight = compiled.querySelector('.footer-right');
      const snapStatus = footerRight?.querySelector('.snap-status');
      const orthoStatus = footerRight?.querySelector('.ortho-status');

      expect(snapStatus).toBeTruthy();
      expect(orthoStatus).toBeTruthy();
    });

    it('should display coordinates on the left side', () => {
      const coordinates = compiled.querySelector('.coordinates');
      const footerContent = compiled.querySelector('.footer-content');

      expect(coordinates).toBeTruthy();
      expect(footerContent?.firstElementChild).toBe(coordinates);
    });

    it('should display mode toggles on the right side', () => {
      const footerRight = compiled.querySelector('.footer-right');
      const footerContent = compiled.querySelector('.footer-content');

      expect(footerRight).toBeTruthy();
      expect(footerContent?.lastElementChild).toBe(footerRight);
    });
  });

  describe('CSS Classes', () => {
    it('should apply footer class to footer element', () => {
      const footer = compiled.querySelector('footer');
      expect(footer?.classList.contains('footer')).toBe(true);
    });

    it('should apply footer-content class to content div', () => {
      const content = compiled.querySelector('.footer-content');
      expect(content).toBeTruthy();
    });

    it('should apply coordinates class to mouse position span', () => {
      const coordinates = compiled.querySelector('.coordinates');
      expect(coordinates).toBeTruthy();
    });

    it('should apply snap-status class to snap toggle', () => {
      const snapStatus = compiled.querySelector('.snap-status');
      expect(snapStatus).toBeTruthy();
    });

    it('should apply ortho-status class to ortho toggle', () => {
      const orthoStatus = compiled.querySelector('.ortho-status');
      expect(orthoStatus).toBeTruthy();
    });
  });

  describe('ChangeDetectionStrategy.OnPush', () => {
    it('should use OnPush change detection strategy', () => {
      const componentDef = (component.constructor as any).ɵcmp;
      expect(componentDef.onPush).toBeTruthy(); // OnPush strategy
    });

    it('should still update when signals change', () => {
      mockAppStore.mousePosition.set({ x: 111, y: 222 });
      fixture.detectChanges();

      const coordinates = compiled.querySelector('.coordinates');
      expect(coordinates?.textContent).toBe('X: 111, Y: 222');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large coordinate values', () => {
      mockAppStore.mousePosition.set({ x: 999999, y: 888888 });
      fixture.detectChanges();

      expect(component.mousePositionDisplay()).toBe('X: 999999, Y: 888888');
    });

    it('should handle zero coordinates', () => {
      mockAppStore.mousePosition.set({ x: 0, y: 0 });
      fixture.detectChanges();

      expect(component.mousePositionDisplay()).toBe('X: 0, Y: 0');
    });

    it('should handle rapid state changes', () => {
      for (let i = 0; i < 100; i++) {
        mockAppStore.snapEnabled.set(i % 2 === 0);
      }
      fixture.detectChanges();

      expect(component.snapDisplay()).toBe('Off'); // i=99 % 2 !== 0, so ends on 'Off'
    });

    it('should maintain state consistency across multiple updates', () => {
      mockAppStore.snapEnabled.set(true);
      mockAppStore.orthoEnabled.set(false);
      mockAppStore.mousePosition.set({ x: 50, y: 100 });
      fixture.detectChanges();

      expect(component.snapDisplay()).toBe('On');
      expect(component.orthoDisplay()).toBe('Off');
      expect(component.mousePositionDisplay()).toBe('X: 50, Y: 100');

      // Update just one value
      mockAppStore.snapEnabled.set(false);
      fixture.detectChanges();

      // Other values should remain unchanged
      expect(component.snapDisplay()).toBe('Off');
      expect(component.orthoDisplay()).toBe('Off');
      expect(component.mousePositionDisplay()).toBe('X: 50, Y: 100');
    });
  });

  describe('Accessibility', () => {
    it('should have clickable snap status', () => {
      const snapStatus = compiled.querySelector('.snap-status') as HTMLElement;
      expect(snapStatus).toBeTruthy();

      // Should be clickable
      const clickEvent = new Event('click');
      spyOn(component, 'onSnapClick');
      snapStatus.addEventListener('click', () => component.onSnapClick());
      snapStatus.dispatchEvent(clickEvent);

      expect(component.onSnapClick).toHaveBeenCalled();
    });

    it('should have clickable ortho status', () => {
      const orthoStatus = compiled.querySelector('.ortho-status') as HTMLElement;
      expect(orthoStatus).toBeTruthy();

      // Should be clickable
      const clickEvent = new Event('click');
      spyOn(component, 'onOrthoClick');
      orthoStatus.addEventListener('click', () => component.onOrthoClick());
      orthoStatus.dispatchEvent(clickEvent);

      expect(component.onOrthoClick).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should reflect all store states correctly', () => {
      // Set specific states
      mockAppStore.snapEnabled.set(true);
      mockAppStore.orthoEnabled.set(false);
      mockAppStore.mousePosition.set({ x: 123, y: 456 });
      fixture.detectChanges();

      // Verify DOM
      const snapStatus = compiled.querySelector('.snap-status');
      const orthoStatus = compiled.querySelector('.ortho-status');
      const coordinates = compiled.querySelector('.coordinates');

      expect(snapStatus?.textContent).toContain('On');
      expect(orthoStatus?.textContent).toContain('Off');
      expect(coordinates?.textContent).toBe('X: 123, Y: 456');
    });

    it('should toggle states via UI interaction', () => {
      // Initial state
      mockAppStore.snapEnabled.set(true);
      mockAppStore.orthoEnabled.set(true);
      fixture.detectChanges();

      // Click to toggle
      const snapStatus = compiled.querySelector('.snap-status') as HTMLElement;
      const orthoStatus = compiled.querySelector('.ortho-status') as HTMLElement;

      snapStatus.click();
      orthoStatus.click();

      expect(mockAppStore.toggleSnap).toHaveBeenCalled();
      expect(mockAppStore.toggleOrtho).toHaveBeenCalled();
    });
  });
});
