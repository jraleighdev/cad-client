import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolbarComponent } from './toolbar';
import { provideZonelessChangeDetection } from '@angular/core';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with select tool as default', () => {
      expect(component['selectedTool']()).toBe('select');
    });

    it('should render toolbar container', () => {
      const toolbar = compiled.querySelector('.toolbar');
      expect(toolbar).toBeTruthy();
    });

    it('should render tool groups', () => {
      const toolGroups = compiled.querySelectorAll('.tool-group');
      expect(toolGroups.length).toBe(2);
    });

    it('should render tool separator', () => {
      const separator = compiled.querySelector('.tool-separator');
      expect(separator).toBeTruthy();
    });

    it('should render all drawing tool buttons', () => {
      const buttons = compiled.querySelectorAll('.tool-button');
      expect(buttons.length).toBeGreaterThanOrEqual(4); // At least select, line, rectangle, circle
    });
  });

  describe('Select Tool Button', () => {
    it('should render select tool button', () => {
      const selectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Select Tool');
      expect(selectButton).toBeTruthy();
    });

    it('should have active class by default', () => {
      const selectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Select Tool');
      expect(selectButton?.classList.contains('active')).toBe(true);
    });

    it('should display select tool icon', () => {
      const selectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Select Tool');
      const icon = selectButton?.querySelector('.tool-icon');
      expect(icon?.textContent).toBe('↖');
    });

    it('should emit toolSelected event when clicked', (done) => {
      component['selectedTool'].set('line'); // Set to different tool first
      fixture.detectChanges();

      component.toolSelected.subscribe((tool: string) => {
        expect(tool).toBe('select');
        done();
      });

      const selectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Select Tool') as HTMLElement;
      selectButton.click();
    });

    it('should update selectedTool signal when clicked', () => {
      component['selectedTool'].set('line');
      fixture.detectChanges();

      const selectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Select Tool') as HTMLElement;
      selectButton.click();

      expect(component['selectedTool']()).toBe('select');
    });
  });

  describe('Line Tool Button', () => {
    it('should render line tool button', () => {
      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool');
      expect(lineButton).toBeTruthy();
    });

    it('should not have active class initially', () => {
      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool');
      expect(lineButton?.classList.contains('active')).toBe(false);
    });

    it('should display line tool icon', () => {
      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool');
      const icon = lineButton?.querySelector('.tool-icon');
      expect(icon?.textContent).toBe('/');
    });

    it('should have active class when line tool is selected', () => {
      component['selectTool']('line');
      fixture.detectChanges();

      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool');
      expect(lineButton?.classList.contains('active')).toBe(true);
    });

    it('should emit toolSelected event when clicked', (done) => {
      component.toolSelected.subscribe((tool: string) => {
        expect(tool).toBe('line');
        done();
      });

      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool') as HTMLElement;
      lineButton.click();
    });

    it('should update selectedTool signal when clicked', () => {
      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool') as HTMLElement;
      lineButton.click();

      expect(component['selectedTool']()).toBe('line');
    });
  });

  describe('Rectangle Tool Button', () => {
    it('should render rectangle tool button', () => {
      const rectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Rectangle Tool');
      expect(rectButton).toBeTruthy();
    });

    it('should not have active class initially', () => {
      const rectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Rectangle Tool');
      expect(rectButton?.classList.contains('active')).toBe(false);
    });

    it('should display rectangle tool icon', () => {
      const rectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Rectangle Tool');
      const icon = rectButton?.querySelector('.tool-icon');
      expect(icon?.textContent).toBe('□');
    });

    it('should have active class when rectangle tool is selected', () => {
      component['selectTool']('rectangle');
      fixture.detectChanges();

      const rectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Rectangle Tool');
      expect(rectButton?.classList.contains('active')).toBe(true);
    });

    it('should emit toolSelected event when clicked', (done) => {
      component.toolSelected.subscribe((tool: string) => {
        expect(tool).toBe('rectangle');
        done();
      });

      const rectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Rectangle Tool') as HTMLElement;
      rectButton.click();
    });

    it('should update selectedTool signal when clicked', () => {
      const rectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Rectangle Tool') as HTMLElement;
      rectButton.click();

      expect(component['selectedTool']()).toBe('rectangle');
    });
  });

  describe('Circle Tool Button', () => {
    it('should render circle tool button', () => {
      const circleButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Circle Tool');
      expect(circleButton).toBeTruthy();
    });

    it('should not have active class initially', () => {
      const circleButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Circle Tool');
      expect(circleButton?.classList.contains('active')).toBe(false);
    });

    it('should display circle tool icon', () => {
      const circleButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Circle Tool');
      const icon = circleButton?.querySelector('.tool-icon');
      expect(icon?.textContent).toBe('○');
    });

    it('should have active class when circle tool is selected', () => {
      component['selectTool']('circle');
      fixture.detectChanges();

      const circleButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Circle Tool');
      expect(circleButton?.classList.contains('active')).toBe(true);
    });

    it('should emit toolSelected event when clicked', (done) => {
      component.toolSelected.subscribe((tool: string) => {
        expect(tool).toBe('circle');
        done();
      });

      const circleButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Circle Tool') as HTMLElement;
      circleButton.click();
    });

    it('should update selectedTool signal when clicked', () => {
      const circleButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Circle Tool') as HTMLElement;
      circleButton.click();

      expect(component['selectedTool']()).toBe('circle');
    });
  });

  describe('View Tool Buttons', () => {
    it('should render zoom in button', () => {
      const zoomInButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Zoom In');
      expect(zoomInButton).toBeTruthy();
    });

    it('should render zoom out button', () => {
      const zoomOutButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Zoom Out');
      expect(zoomOutButton).toBeTruthy();
    });

    it('should render fit to screen button', () => {
      const fitButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Fit to Screen');
      expect(fitButton).toBeTruthy();
    });

    it('should display zoom in icon', () => {
      const zoomInButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Zoom In');
      const icon = zoomInButton?.querySelector('.tool-icon');
      expect(icon?.textContent).toBe('+');
    });

    it('should display zoom out icon', () => {
      const zoomOutButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Zoom Out');
      const icon = zoomOutButton?.querySelector('.tool-icon');
      expect(icon?.textContent).toBe('-');
    });

    it('should display fit to screen icon', () => {
      const fitButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Fit to Screen');
      const icon = fitButton?.querySelector('.tool-icon');
      expect(icon?.textContent).toBe('⌂');
    });
  });

  describe('Tool Selection Behavior', () => {
    it('should only have one active tool at a time', () => {
      component['selectTool']('line');
      fixture.detectChanges();

      const activeButtons = compiled.querySelectorAll('.tool-button.active');
      expect(activeButtons.length).toBe(1);
    });

    it('should remove active class from previous tool when new tool is selected', () => {
      component['selectTool']('line');
      fixture.detectChanges();

      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool');
      expect(lineButton?.classList.contains('active')).toBe(true);

      component['selectTool']('rectangle');
      fixture.detectChanges();

      expect(lineButton?.classList.contains('active')).toBe(false);
    });

    it('should add active class to newly selected tool', () => {
      const rectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Rectangle Tool');
      expect(rectButton?.classList.contains('active')).toBe(false);

      component['selectTool']('rectangle');
      fixture.detectChanges();

      expect(rectButton?.classList.contains('active')).toBe(true);
    });

    it('should handle rapid tool changes', () => {
      const tools = ['line', 'rectangle', 'circle', 'select'];

      tools.forEach(tool => {
        component['selectTool'](tool);
        fixture.detectChanges();
        expect(component['selectedTool']()).toBe(tool);
      });

      const activeButtons = compiled.querySelectorAll('.tool-button.active');
      expect(activeButtons.length).toBe(1);
      expect(component['selectedTool']()).toBe('select');
    });

    it('should allow selecting the same tool multiple times', () => {
      let emitCount = 0;

      component.toolSelected.subscribe(() => {
        emitCount++;
      });

      component['selectTool']('line');
      component['selectTool']('line');
      component['selectTool']('line');

      expect(emitCount).toBe(3);
      expect(component['selectedTool']()).toBe('line');
    });
  });

  describe('selectTool Method', () => {
    it('should update selectedTool signal', () => {
      component['selectTool']('line');
      expect(component['selectedTool']()).toBe('line');

      component['selectTool']('rectangle');
      expect(component['selectedTool']()).toBe('rectangle');
    });

    it('should emit toolSelected output', (done) => {
      component.toolSelected.subscribe((tool: string) => {
        expect(tool).toBe('circle');
        done();
      });

      component['selectTool']('circle');
    });

    it('should emit and update signal for each tool', () => {
      const emissions: string[] = [];

      component.toolSelected.subscribe((tool: string) => {
        emissions.push(tool);
      });

      component['selectTool']('select');
      component['selectTool']('line');
      component['selectTool']('rectangle');
      component['selectTool']('circle');

      expect(emissions).toEqual(['select', 'line', 'rectangle', 'circle']);
      expect(component['selectedTool']()).toBe('circle');
    });

    it('should accept any string as tool name', () => {
      component['selectTool']('custom-tool');
      expect(component['selectedTool']()).toBe('custom-tool');
    });
  });

  describe('Template Structure', () => {
    it('should have correct toolbar structure', () => {
      const toolbar = compiled.querySelector('.toolbar');
      expect(toolbar).toBeTruthy();

      const toolGroups = toolbar?.querySelectorAll('.tool-group');
      expect(toolGroups?.length).toBe(2);

      const separator = toolbar?.querySelector('.tool-separator');
      expect(separator).toBeTruthy();
    });

    it('should render tool buttons with tool-icon spans', () => {
      const toolButtons = compiled.querySelectorAll('.tool-button');

      toolButtons.forEach(button => {
        const icon = button.querySelector('.tool-icon');
        expect(icon).toBeTruthy();
      });
    });

    it('should have title attributes on all tool buttons', () => {
      const toolButtons = compiled.querySelectorAll('.tool-button');

      toolButtons.forEach(button => {
        const title = button.getAttribute('title');
        expect(title).toBeTruthy();
        expect(title?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CSS Classes', () => {
    it('should apply toolbar class to container', () => {
      const toolbar = compiled.querySelector('.toolbar');
      expect(toolbar).toBeTruthy();
    });

    it('should apply tool-group class to tool groups', () => {
      const toolGroups = compiled.querySelectorAll('.tool-group');
      expect(toolGroups.length).toBeGreaterThan(0);
    });

    it('should apply tool-separator class to separator', () => {
      const separator = compiled.querySelector('.tool-separator');
      expect(separator).toBeTruthy();
    });

    it('should apply tool-button class to buttons', () => {
      const buttons = compiled.querySelectorAll('.tool-button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should apply tool-icon class to icons', () => {
      const icons = compiled.querySelectorAll('.tool-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should apply active class to selected tool button', () => {
      component['selectTool']('line');
      fixture.detectChanges();

      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool');

      expect(lineButton?.classList.contains('active')).toBe(true);
    });
  });

  describe('ChangeDetectionStrategy.OnPush', () => {
    it('should use OnPush change detection strategy', () => {
      const componentDef = (component.constructor as any).ɵcmp;
      expect(componentDef.onPush).toBeTruthy(); // OnPush strategy
    });

    it('should still update UI when signal changes', () => {
      component['selectedTool'].set('line');
      fixture.detectChanges();

      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool');

      expect(lineButton?.classList.contains('active')).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full tool selection workflow', () => {
      const events: string[] = [];

      component.toolSelected.subscribe((tool: string) => {
        events.push(tool);
      });

      // Click through all tools
      const selectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Select Tool') as HTMLElement;
      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool') as HTMLElement;
      const rectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Rectangle Tool') as HTMLElement;
      const circleButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Circle Tool') as HTMLElement;

      lineButton.click();
      fixture.detectChanges();
      expect(component['selectedTool']()).toBe('line');

      rectButton.click();
      fixture.detectChanges();
      expect(component['selectedTool']()).toBe('rectangle');

      circleButton.click();
      fixture.detectChanges();
      expect(component['selectedTool']()).toBe('circle');

      selectButton.click();
      fixture.detectChanges();
      expect(component['selectedTool']()).toBe('select');

      expect(events).toEqual(['line', 'rectangle', 'circle', 'select']);
    });

    it('should maintain active state correctly across multiple selections', () => {
      const tools = ['select', 'line', 'rectangle', 'circle'];

      tools.forEach(tool => {
        component['selectTool'](tool);
        fixture.detectChanges();

        const activeButtons = compiled.querySelectorAll('.tool-button.active');
        expect(activeButtons.length).toBe(1);
        expect(component['selectedTool']()).toBe(tool);
      });
    });

    it('should handle UI interactions and signal updates synchronously', () => {
      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool') as HTMLElement;

      lineButton.click();
      // Should update immediately without fixture.detectChanges()
      expect(component['selectedTool']()).toBe('line');

      fixture.detectChanges();
      expect(lineButton.classList.contains('active')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string as tool name', () => {
      component['selectTool']('');
      expect(component['selectedTool']()).toBe('');
    });

    it('should handle numeric tool names', () => {
      component['selectTool']('123');
      expect(component['selectedTool']()).toBe('123');
    });

    it('should handle special characters in tool names', () => {
      component['selectTool']('tool-with-special_chars!@#');
      expect(component['selectedTool']()).toBe('tool-with-special_chars!@#');
    });

    it('should handle very long tool names', () => {
      const longName = 'a'.repeat(1000);
      component['selectTool'](longName);
      expect(component['selectedTool']()).toBe(longName);
    });

    it('should handle multiple simultaneous subscriptions', (done) => {
      let count = 0;

      component.toolSelected.subscribe(() => count++);
      component.toolSelected.subscribe(() => count++);
      component.toolSelected.subscribe(() => {
        count++;
        expect(count).toBe(3);
        done();
      });

      component['selectTool']('line');
    });
  });

  describe('Accessibility', () => {
    it('should have title attributes for accessibility', () => {
      const selectButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Select Tool');
      const lineButton = Array.from(compiled.querySelectorAll('.tool-button'))
        .find(btn => btn.getAttribute('title') === 'Line Tool');

      expect(selectButton?.getAttribute('title')).toBe('Select Tool');
      expect(lineButton?.getAttribute('title')).toBe('Line Tool');
    });

    it('should be keyboard accessible through native button elements', () => {
      const buttons = compiled.querySelectorAll('.tool-button');

      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });
});
