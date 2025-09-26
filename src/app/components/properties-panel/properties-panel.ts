import { Component, ChangeDetectionStrategy, signal, ElementRef, HostListener, inject, Input, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Circle } from '../../types/circle';
import { Line } from '../../types/line';
import { Rectangle } from '../../types/rectangle';
import { SelectedEntity, Entity } from '../../types/entity';

@Component({
  selector: 'app-properties-panel',
  imports: [DecimalPipe],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class PropertiesPanelComponent {
  private elementRef = inject(ElementRef);
  
  selectedEntity = input<SelectedEntity | null>(null);
  entities = input<{ lines: Line[], rectangles: Rectangle[], circles: Circle[] }>({ lines: [], rectangles: [], circles: [] });
  
  protected readonly panelWidth = signal(300);
  protected readonly isResizing = signal(false);
  protected readonly minWidth = 200;
  protected readonly maxWidth = 600;
  protected readonly isNarrow = signal(false);

  protected readonly currentEntity = computed<Entity | null>(() => {
    if (!this.selectedEntity()) return null;
    
    const { type, id } = this.selectedEntity()!;
    if (!type) return null;
    
    try {
      const entityList = this.entities()[`${type}s` as const];
      const found = entityList.find(e => e.id === id);
      return found || null;
    } catch (error) {
      console.error('Error finding entity:', error);
      return null;
    }
  });

  protected readonly entityType = computed<string>(() => {
    if (!this.selectedEntity() || !this.selectedEntity()?.type) return 'None';
    return this.selectedEntity()!.type!.charAt(0).toUpperCase() + this.selectedEntity()!.type!.slice(1);
  });

  protected readonly position = computed<{x: number, y: number} | null>(() => {
    const entity = this.currentEntity();
    if (!entity) return null;

    try {
      if ('center' in entity) {
        // Circle - use center point
        return { x: entity.center.x, y: entity.center.y };
      } else if ('start' in entity && 'end' in entity) {
        // Line or Rectangle - find point closest to origin (0,0)
        const startDist = Math.hypot(entity.start.x, entity.start.y);
        const endDist = Math.hypot(entity.end.x, entity.end.y);
        return startDist <= endDist ? 
          { x: entity.start.x, y: entity.start.y } : 
          { x: entity.end.x, y: entity.end.y };
      }
    } catch (error) {
      console.error('Error calculating position:', error);
    }
    
    return null;
  });

  protected readonly dimensions = computed<{width?: number, height?: number, radius?: number, length?: number} | null>(() => {
    const entity = this.currentEntity();
    if (!entity) return null;

    try {
      if ('radius' in entity) {
        // Circle - show radius
        return { radius: entity.radius };
      } else if ('start' in entity && 'end' in entity) {
        if ('fillColor' in entity) {
          // Rectangle - show width and height
          const width = Math.abs(entity.end.x - entity.start.x);
          const height = Math.abs(entity.end.y - entity.start.y);
          return { width, height };
        } else {
          // Line - show length
          const dx = entity.end.x - entity.start.x;
          const dy = entity.end.y - entity.start.y;
          const length = Math.hypot(dx, dy);
          return { length };
        }
      }
    } catch (error) {
      console.error('Error calculating dimensions:', error);
    }
    
    return null;
  });

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isResizing()) {
      const containerRect = this.elementRef.nativeElement.parentElement.getBoundingClientRect();
      const newWidth = window.innerWidth - event.clientX;
      const clampedWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
      this.panelWidth.set(clampedWidth);
      this.isNarrow.set(clampedWidth < 280);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isResizing.set(false);
  }

  protected onResizeStart(event: MouseEvent) {
    event.preventDefault();
    this.isResizing.set(true);
  }
}
