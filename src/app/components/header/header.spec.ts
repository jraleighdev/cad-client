import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header';
import { AppStore } from '../../state/app.store';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockAppStore: any;
  let compiled: HTMLElement;

  beforeEach(async () => {
    // Mock AppStore
    mockAppStore = {
      clipboardEntity: signal(null)
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AppStore, useValue: mockAppStore },
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should inject AppStore', () => {
      expect(component['appStore']).toBe(mockAppStore);
    });

    it('should initialize with edit menu closed', () => {
      expect(component['editMenuOpen']()).toBe(false);
    });

    it('should initialize with no selected entity', () => {
      expect(component.hasSelectedEntity()).toBe(false);
    });

    it('should initialize with entity not frozen', () => {
      expect(component.isSelectedEntityFrozen()).toBe(false);
    });

    it('should render header element', () => {
      const header = compiled.querySelector('header');
      expect(header).toBeTruthy();
    });

    it('should render application title', () => {
      const title = compiled.querySelector('h1');
      expect(title?.textContent).toBe('CAD Client');
    });
  });

  describe('Edit Menu Toggle', () => {
    it('should open edit menu when toggle is called', () => {
      component['toggleEditMenu']();
      expect(component['editMenuOpen']()).toBe(true);
    });

    it('should close edit menu when toggle is called twice', () => {
      component['toggleEditMenu']();
      component['toggleEditMenu']();
      expect(component['editMenuOpen']()).toBe(false);
    });

    it('should toggle edit menu multiple times correctly', () => {
      component['toggleEditMenu'](); // Open
      expect(component['editMenuOpen']()).toBe(true);

      component['toggleEditMenu'](); // Close
      expect(component['editMenuOpen']()).toBe(false);

      component['toggleEditMenu'](); // Open
      expect(component['editMenuOpen']()).toBe(true);
    });

    it('should show dropdown menu when edit menu is open', () => {
      component['editMenuOpen'].set(true);
      fixture.detectChanges();

      const dropdownMenu = compiled.querySelector('.dropdown-menu');
      expect(dropdownMenu).toBeTruthy();
    });

    it('should hide dropdown menu when edit menu is closed', () => {
      component['editMenuOpen'].set(false);
      fixture.detectChanges();

      const dropdownMenu = compiled.querySelector('.dropdown-menu');
      expect(dropdownMenu).toBeNull();
    });

    it('should toggle dropdown visibility when Edit button is clicked', () => {
      const editButton = Array.from(compiled.querySelectorAll('.nav-button'))
        .find(btn => btn.textContent === 'Edit') as HTMLElement;

      editButton.click();
      fixture.detectChanges();
      expect(compiled.querySelector('.dropdown-menu')).toBeTruthy();

      editButton.click();
      fixture.detectChanges();
      expect(compiled.querySelector('.dropdown-menu')).toBeNull();
    });
  });

  describe('Close Edit Menu', () => {
    it('should close edit menu when closeEditMenu is called', () => {
      component['editMenuOpen'].set(true);
      component['closeEditMenu']();
      expect(component['editMenuOpen']()).toBe(false);
    });

    it('should keep menu closed if already closed', () => {
      component['editMenuOpen'].set(false);
      component['closeEditMenu']();
      expect(component['editMenuOpen']()).toBe(false);
    });
  });

  describe('Clipboard Content Detection', () => {
    it('should return false when clipboard is empty', () => {
      mockAppStore.clipboardEntity.set(null);
      expect(component['hasClipboardContent']).toBe(false);
    });

    it('should return true when clipboard has content', () => {
      const mockEntity = {
        id: '1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 },
        color: '#000000',
        width: 2
      };
      mockAppStore.clipboardEntity.set(mockEntity);
      expect(component['hasClipboardContent']).toBe(true);
    });

    it('should update when clipboard state changes', () => {
      expect(component['hasClipboardContent']).toBe(false);

      mockAppStore.clipboardEntity.set({ id: '1' });
      expect(component['hasClipboardContent']).toBe(true);

      mockAppStore.clipboardEntity.set(null);
      expect(component['hasClipboardContent']).toBe(false);
    });
  });

  describe('Copy Action', () => {
    it('should emit copy event when onCopy is called', (done) => {
      component.copy.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component['onCopy']();
    });

    it('should close edit menu after copy', () => {
      component['editMenuOpen'].set(true);
      component['onCopy']();
      expect(component['editMenuOpen']()).toBe(false);
    });

    it('should be disabled when no entity is selected', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', false);
      fixture.detectChanges();

      const copyButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Copy')) as HTMLButtonElement;

      expect(copyButton.disabled).toBe(true);
    });

    it('should be enabled when entity is selected', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.detectChanges();

      const copyButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Copy')) as HTMLButtonElement;

      expect(copyButton.disabled).toBe(false);
    });

    it('should emit copy when copy button is clicked', (done) => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.detectChanges();

      component.copy.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const copyButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Copy')) as HTMLButtonElement;
      copyButton.click();
    });
  });

  describe('Paste Action', () => {
    it('should emit paste event when onPaste is called', (done) => {
      component.paste.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component['onPaste']();
    });

    it('should close edit menu after paste', () => {
      component['editMenuOpen'].set(true);
      component['onPaste']();
      expect(component['editMenuOpen']()).toBe(false);
    });

    it('should be disabled when clipboard is empty', () => {
      component['editMenuOpen'].set(true);
      mockAppStore.clipboardEntity.set(null);
      fixture.detectChanges();

      const pasteButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Paste')) as HTMLButtonElement;

      expect(pasteButton.disabled).toBe(true);
    });

    it('should be enabled when clipboard has content', () => {
      component['editMenuOpen'].set(true);
      mockAppStore.clipboardEntity.set({ id: '1' });
      fixture.detectChanges();

      const pasteButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Paste')) as HTMLButtonElement;

      expect(pasteButton.disabled).toBe(false);
    });

    it('should emit paste when paste button is clicked', (done) => {
      component['editMenuOpen'].set(true);
      mockAppStore.clipboardEntity.set({ id: '1' });
      fixture.detectChanges();

      component.paste.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const pasteButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Paste')) as HTMLButtonElement;
      pasteButton.click();
    });
  });

  describe('Delete Action', () => {
    it('should emit delete event when onDelete is called', (done) => {
      component.delete.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component['onDelete']();
    });

    it('should close edit menu after delete', () => {
      component['editMenuOpen'].set(true);
      component['onDelete']();
      expect(component['editMenuOpen']()).toBe(false);
    });

    it('should be disabled when no entity is selected', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', false);
      fixture.detectChanges();

      const deleteButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Delete')) as HTMLButtonElement;

      expect(deleteButton.disabled).toBe(true);
    });

    it('should be enabled when entity is selected', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.detectChanges();

      const deleteButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Delete')) as HTMLButtonElement;

      expect(deleteButton.disabled).toBe(false);
    });

    it('should emit delete when delete button is clicked', (done) => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.detectChanges();

      component.delete.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const deleteButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Delete')) as HTMLButtonElement;
      deleteButton.click();
    });
  });

  describe('Freeze Action', () => {
    it('should emit freeze event when onFreeze is called', (done) => {
      component.freeze.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component['onFreeze']();
    });

    it('should close edit menu after freeze', () => {
      component['editMenuOpen'].set(true);
      component['onFreeze']();
      expect(component['editMenuOpen']()).toBe(false);
    });

    it('should be disabled when no entity is selected', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', false);
      fixture.componentRef.setInput('isSelectedEntityFrozen', false);
      fixture.detectChanges();

      const freezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Freeze')) as HTMLButtonElement;

      expect(freezeButton.disabled).toBe(true);
    });

    it('should be disabled when entity is already frozen', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.componentRef.setInput('isSelectedEntityFrozen', true);
      fixture.detectChanges();

      const freezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Freeze')) as HTMLButtonElement;

      expect(freezeButton.disabled).toBe(true);
    });

    it('should be enabled when entity is selected and not frozen', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.componentRef.setInput('isSelectedEntityFrozen', false);
      fixture.detectChanges();

      const freezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Freeze')) as HTMLButtonElement;

      expect(freezeButton.disabled).toBe(false);
    });

    it('should emit freeze when freeze button is clicked', (done) => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.componentRef.setInput('isSelectedEntityFrozen', false);
      fixture.detectChanges();

      component.freeze.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const freezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Freeze')) as HTMLButtonElement;
      freezeButton.click();
    });
  });

  describe('Unfreeze Action', () => {
    it('should emit unfreeze event when onUnfreeze is called', (done) => {
      component.unfreeze.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component['onUnfreeze']();
    });

    it('should close edit menu after unfreeze', () => {
      component['editMenuOpen'].set(true);
      component['onUnfreeze']();
      expect(component['editMenuOpen']()).toBe(false);
    });

    it('should be disabled when no entity is selected', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', false);
      fixture.componentRef.setInput('isSelectedEntityFrozen', true);
      fixture.detectChanges();

      const unfreezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Unfreeze')) as HTMLButtonElement;

      expect(unfreezeButton.disabled).toBe(true);
    });

    it('should be disabled when entity is not frozen', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.componentRef.setInput('isSelectedEntityFrozen', false);
      fixture.detectChanges();

      const unfreezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Unfreeze')) as HTMLButtonElement;

      expect(unfreezeButton.disabled).toBe(true);
    });

    it('should be enabled when entity is selected and frozen', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.componentRef.setInput('isSelectedEntityFrozen', true);
      fixture.detectChanges();

      const unfreezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Unfreeze')) as HTMLButtonElement;

      expect(unfreezeButton.disabled).toBe(false);
    });

    it('should emit unfreeze when unfreeze button is clicked', (done) => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.componentRef.setInput('isSelectedEntityFrozen', true);
      fixture.detectChanges();

      component.unfreeze.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const unfreezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Unfreeze')) as HTMLButtonElement;
      unfreezeButton.click();
    });
  });

  describe('Input Properties', () => {
    it('should accept hasSelectedEntity input', () => {
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.detectChanges();

      expect(component.hasSelectedEntity()).toBe(true);
    });

    it('should accept isSelectedEntityFrozen input', () => {
      fixture.componentRef.setInput('isSelectedEntityFrozen', true);
      fixture.detectChanges();

      expect(component.isSelectedEntityFrozen()).toBe(true);
    });

    it('should update button states when hasSelectedEntity changes', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', false);
      fixture.detectChanges();

      const copyButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Copy')) as HTMLButtonElement;
      expect(copyButton.disabled).toBe(true);

      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.detectChanges();
      expect(copyButton.disabled).toBe(false);
    });

    it('should update freeze/unfreeze states when isSelectedEntityFrozen changes', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.componentRef.setInput('isSelectedEntityFrozen', false);
      fixture.detectChanges();

      const freezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Freeze') && !btn.textContent?.includes('Unfreeze')) as HTMLButtonElement;
      const unfreezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Unfreeze')) as HTMLButtonElement;

      expect(freezeButton.disabled).toBe(false);
      expect(unfreezeButton.disabled).toBe(true);

      fixture.componentRef.setInput('isSelectedEntityFrozen', true);
      fixture.detectChanges();

      expect(freezeButton.disabled).toBe(true);
      expect(unfreezeButton.disabled).toBe(false);
    });
  });

  describe('Template Structure', () => {
    it('should render header navigation', () => {
      const nav = compiled.querySelector('.header-nav');
      expect(nav).toBeTruthy();
    });

    it('should render File button', () => {
      const fileButton = Array.from(compiled.querySelectorAll('.nav-button'))
        .find(btn => btn.textContent === 'File');
      expect(fileButton).toBeTruthy();
    });

    it('should render Edit button', () => {
      const editButton = Array.from(compiled.querySelectorAll('.nav-button'))
        .find(btn => btn.textContent === 'Edit');
      expect(editButton).toBeTruthy();
    });

    it('should render View button', () => {
      const viewButton = Array.from(compiled.querySelectorAll('.nav-button'))
        .find(btn => btn.textContent === 'View');
      expect(viewButton).toBeTruthy();
    });

    it('should render Tools button', () => {
      const toolsButton = Array.from(compiled.querySelectorAll('.nav-button'))
        .find(btn => btn.textContent === 'Tools');
      expect(toolsButton).toBeTruthy();
    });

    it('should render Help button', () => {
      const helpButton = Array.from(compiled.querySelectorAll('.nav-button'))
        .find(btn => btn.textContent === 'Help');
      expect(helpButton).toBeTruthy();
    });

    it('should render dropdown menu with all items when open', () => {
      component['editMenuOpen'].set(true);
      fixture.detectChanges();

      const menuItems = compiled.querySelectorAll('.dropdown-item');
      expect(menuItems.length).toBe(5); // Copy, Paste, Delete, Freeze, Unfreeze
    });

    it('should render dropdown divider', () => {
      component['editMenuOpen'].set(true);
      fixture.detectChanges();

      const divider = compiled.querySelector('.dropdown-divider');
      expect(divider).toBeTruthy();
    });

    it('should display keyboard shortcuts in menu items', () => {
      component['editMenuOpen'].set(true);
      fixture.detectChanges();

      const copyButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Copy'));
      const pasteButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Paste'));
      const deleteButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Delete'));

      expect(copyButton?.textContent).toContain('Ctrl+C');
      expect(pasteButton?.textContent).toContain('Ctrl+V');
      expect(deleteButton?.textContent).toContain('Ctrl+D');
    });
  });

  describe('CSS Classes', () => {
    it('should apply header class to header element', () => {
      const header = compiled.querySelector('header');
      expect(header?.classList.contains('header')).toBe(true);
    });

    it('should apply header-content class to content div', () => {
      const content = compiled.querySelector('.header-content');
      expect(content).toBeTruthy();
    });

    it('should apply header-nav class to navigation', () => {
      const nav = compiled.querySelector('.header-nav');
      expect(nav).toBeTruthy();
    });

    it('should apply nav-button class to navigation buttons', () => {
      const navButtons = compiled.querySelectorAll('.nav-button');
      expect(navButtons.length).toBeGreaterThan(0);
    });

    it('should apply dropdown class to dropdown container', () => {
      const dropdown = compiled.querySelector('.dropdown');
      expect(dropdown).toBeTruthy();
    });
  });

  describe('ChangeDetectionStrategy.OnPush', () => {
    it('should use OnPush change detection strategy', () => {
      const componentDef = (component.constructor as any).ɵcmp;
      expect(componentDef.onPush).toBeTruthy(); // OnPush strategy
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid menu toggling', () => {
      for (let i = 0; i < 10; i++) {
        component['toggleEditMenu']();
      }
      expect(component['editMenuOpen']()).toBe(false); // Should end closed
    });

    it('should handle calling action methods when menu is closed', () => {
      component['editMenuOpen'].set(false);

      expect(() => component['onCopy']()).not.toThrow();
      expect(() => component['onPaste']()).not.toThrow();
      expect(() => component['onDelete']()).not.toThrow();
      expect(() => component['onFreeze']()).not.toThrow();
      expect(() => component['onUnfreeze']()).not.toThrow();
    });

    it('should handle multiple output subscriptions', (done) => {
      let copyCount = 0;
      let deleteCount = 0;

      component.copy.subscribe(() => copyCount++);
      component.delete.subscribe(() => deleteCount++);

      component['onCopy']();
      component['onDelete']();

      setTimeout(() => {
        expect(copyCount).toBe(1);
        expect(deleteCount).toBe(1);
        done();
      }, 0);
    });
  });

  describe('Integration', () => {
    it('should close menu after any action', () => {
      component['editMenuOpen'].set(true);
      component['onCopy']();
      expect(component['editMenuOpen']()).toBe(false);

      component['editMenuOpen'].set(true);
      component['onPaste']();
      expect(component['editMenuOpen']()).toBe(false);

      component['editMenuOpen'].set(true);
      component['onDelete']();
      expect(component['editMenuOpen']()).toBe(false);

      component['editMenuOpen'].set(true);
      component['onFreeze']();
      expect(component['editMenuOpen']()).toBe(false);

      component['editMenuOpen'].set(true);
      component['onUnfreeze']();
      expect(component['editMenuOpen']()).toBe(false);
    });

    it('should properly enable/disable all actions based on state', () => {
      component['editMenuOpen'].set(true);
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.componentRef.setInput('isSelectedEntityFrozen', false);
      mockAppStore.clipboardEntity.set({ id: '1' });
      fixture.detectChanges();

      const copyButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Copy')) as HTMLButtonElement;
      const pasteButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Paste')) as HTMLButtonElement;
      const deleteButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Delete')) as HTMLButtonElement;
      const freezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Freeze') && !btn.textContent?.includes('Unfreeze')) as HTMLButtonElement;
      const unfreezeButton = Array.from(compiled.querySelectorAll('.dropdown-item'))
        .find(btn => btn.textContent?.includes('Unfreeze')) as HTMLButtonElement;

      expect(copyButton.disabled).toBe(false);
      expect(pasteButton.disabled).toBe(false);
      expect(deleteButton.disabled).toBe(false);
      expect(freezeButton.disabled).toBe(false);
      expect(unfreezeButton.disabled).toBe(true);
    });

    it('should handle complete workflow: select, copy, paste, delete', (done) => {
      const events: string[] = [];

      component.copy.subscribe(() => events.push('copy'));
      component.paste.subscribe(() => events.push('paste'));
      component.delete.subscribe(() => events.push('delete'));

      // Simulate selection
      fixture.componentRef.setInput('hasSelectedEntity', true);
      fixture.detectChanges();

      // Copy
      component['onCopy']();

      // Simulate clipboard content
      mockAppStore.clipboardEntity.set({ id: '1' });

      // Paste
      component['onPaste']();

      // Delete
      component['onDelete']();

      setTimeout(() => {
        expect(events).toEqual(['copy', 'paste', 'delete']);
        done();
      }, 0);
    });
  });
});
