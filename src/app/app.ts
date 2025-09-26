import { Component, signal, ViewChild, computed } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';
import { CanvasComponent, Line, Rectangle, Circle } from './components/canvas/canvas';
import { PropertiesPanelComponent, SelectedEntity } from './components/properties-panel/properties-panel';
import { ToolbarComponent } from './components/toolbar/toolbar';

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
  @ViewChild('propertiesPanel') propertiesPanel!: PropertiesPanelComponent;
  
  protected readonly title = signal('cad-client');
  protected readonly selectedEntity = signal<SelectedEntity | null>(null);

  protected onToolSelected(tool: string) {
    if (this.canvasComponent) {
      this.canvasComponent.setTool(tool);
    }
  }

  protected onEntitySelected(entity: SelectedEntity | null) {
    this.selectedEntity.set(entity);
  }

  protected get entities() {
    return {
      lines: this.canvasComponent?.lines() || [],
      rectangles: this.canvasComponent?.rectangles() || [],
      circles: this.canvasComponent?.circles() || []
    };
  }
}
