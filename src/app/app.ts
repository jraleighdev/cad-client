import { Component, signal, ViewChild } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';
import { CanvasComponent } from './components/canvas/canvas';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel';
import { ToolbarComponent } from './components/toolbar/toolbar';
import { EntityProperties, PropertyUpdate } from './types/entity-properties';

@Component({
  selector: 'app-root',
  imports: [
    HeaderComponent,
    FooterComponent,
    CanvasComponent,
    PropertiesPanelComponent,
    ToolbarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild('canvasComponent') canvasComponent!: CanvasComponent;

  protected readonly title = signal('cad-client');
  protected readonly selectedEntityProperties = signal<EntityProperties | null>(null);

  protected onToolSelected(tool: string) {
    if (this.canvasComponent) {
      this.canvasComponent.setTool(tool);
    }
  }

  protected onEntitySelected(properties: EntityProperties | null) {
    this.selectedEntityProperties.set(properties);
  }

  protected onPropertyChanged(update: PropertyUpdate) {
    if (this.canvasComponent) {
      this.canvasComponent.updateEntityFromProperties(update);
    }
  }

  protected onCopy() {
    if (this.canvasComponent) {
      this.canvasComponent.copySelectedEntity();
    }
  }

  protected onPaste() {
    if (this.canvasComponent) {
      this.canvasComponent.pasteEntity();
    }
  }

  protected onDelete() {
    if (this.canvasComponent) {
      this.canvasComponent.deleteSelectedEntities();
    }
  }

  protected onFreeze() {
    if (this.canvasComponent) {
      this.canvasComponent.freezeSelectedEntity();
    }
  }

  protected onUnfreeze() {
    if (this.canvasComponent) {
      this.canvasComponent.unfreezeSelectedEntity();
    }
  }

  protected get hasSelectedEntity(): boolean {
    return this.selectedEntityProperties() !== null;
  }

  protected get isSelectedEntityFrozen(): boolean {
    return this.selectedEntityProperties()?.frozen ?? false;
  }
}
