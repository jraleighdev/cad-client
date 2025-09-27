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
}
