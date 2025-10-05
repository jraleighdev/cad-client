import { Component, ChangeDetectionStrategy, signal, HostListener, input, computed, output } from '@angular/core';
import { EntityProperties, PropertyUpdate } from '../../types/entity-properties';

@Component({
  selector: 'app-properties-panel',
  imports: [],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertiesPanelComponent {
  // Input from parent component
  selectedEntity = input<EntityProperties | null>(null);

  // Output events
  propertyChanged = output<PropertyUpdate>();

  protected readonly panelWidth = signal(300);
  protected readonly isResizing = signal(false);
  protected readonly minWidth = 200;
  protected readonly maxWidth = 600;
  protected readonly isNarrow = signal(false);

  // Computed properties for display
  protected readonly entityType = computed(() => {
    const entity = this.selectedEntity();
    if (!entity?.type) return 'None Selected';

    switch (entity.type) {
      case 'line': return 'Line';
      case 'rectangle': return 'Rectangle';
      case 'circle': return 'Circle';
      default: return 'Unknown';
    }
  });

  protected readonly positionX = computed(() => {
    const entity = this.selectedEntity();
    return entity?.position?.x ?? '';
  });

  protected readonly positionY = computed(() => {
    const entity = this.selectedEntity();
    return entity?.position?.y ?? '';
  });

  protected readonly dimensionPrimary = computed(() => {
    const entity = this.selectedEntity();
    if (!entity?.dimensions) return '';

    switch (entity.type) {
      case 'line': return entity.dimensions.length ?? '';
      case 'rectangle': return entity.dimensions.width ?? '';
      case 'circle': return entity.dimensions.diameter ?? '';
      default: return '';
    }
  });

  protected readonly dimensionSecondary = computed(() => {
    const entity = this.selectedEntity();
    if (!entity?.dimensions) return '';

    switch (entity.type) {
      case 'rectangle': return entity.dimensions.height ?? '';
      case 'circle': return entity.dimensions.radius ?? '';
      default: return '';
    }
  });

  protected readonly primaryDimensionLabel = computed(() => {
    const entity = this.selectedEntity();
    switch (entity?.type) {
      case 'line': return 'Length';
      case 'rectangle': return 'Width';
      case 'circle': return 'Diameter';
      default: return 'Width';
    }
  });

  protected readonly secondaryDimensionLabel = computed(() => {
    const entity = this.selectedEntity();
    switch (entity?.type) {
      case 'rectangle': return 'Height';
      case 'circle': return 'Radius';
      default: return 'Height';
    }
  });

  protected readonly hasSecondaryDimension = computed(() => {
    const entity = this.selectedEntity();
    return entity?.type === 'rectangle' || entity?.type === 'circle';
  });

  protected readonly hasEntity = computed(() => {
    return this.selectedEntity() !== null;
  });

  protected readonly rotation = computed(() => {
    const entity = this.selectedEntity();
    return entity?.rotation ?? 0;
  });

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isResizing()) {
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

  // Property change handlers
  protected onPositionXChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);

    if (isNaN(value)) return;

    this.emitPropertyUpdate({ position: { x: value, y: this.positionY() as number } });
  }

  protected onPositionYChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);

    if (isNaN(value)) return;

    this.emitPropertyUpdate({ position: { x: this.positionX() as number, y: value } });
  }

  protected onPrimaryDimensionChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);

    if (isNaN(value) || value <= 0) return;

    const entity = this.selectedEntity();
    if (!entity) return;

    const dimensions: any = {};

    switch (entity.type) {
      case 'line':
        dimensions.length = value;
        break;
      case 'rectangle':
        dimensions.width = value;
        dimensions.height = this.dimensionSecondary() as number;
        break;
      case 'circle':
        dimensions.diameter = value;
        dimensions.radius = value / 2;
        break;
    }

    this.emitPropertyUpdate({ dimensions });
  }

  protected onSecondaryDimensionChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);

    if (isNaN(value) || value <= 0) return;

    const entity = this.selectedEntity();
    if (!entity) return;

    const dimensions: any = {};

    switch (entity.type) {
      case 'rectangle':
        dimensions.width = this.dimensionPrimary() as number;
        dimensions.height = value;
        break;
      case 'circle':
        dimensions.radius = value;
        dimensions.diameter = value * 2;
        break;
    }

    this.emitPropertyUpdate({ dimensions });
  }

  protected onRotationChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);

    if (isNaN(value)) return;

    this.emitPropertyUpdate({ rotation: value });
  }

  private emitPropertyUpdate(update: Partial<Pick<EntityProperties, 'position' | 'dimensions' | 'rotation'>>) {
    const entity = this.selectedEntity();
    if (!entity?.id || !entity?.type) return;

    const propertyUpdate: PropertyUpdate = {
      entityId: entity.id,
      entityType: entity.type,
      ...update
    };

    this.propertyChanged.emit(propertyUpdate);
  }
}
