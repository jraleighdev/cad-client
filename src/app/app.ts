import { Component, signal } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';
import { CanvasComponent } from './components/canvas/canvas';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel';
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
  protected readonly title = signal('cad-client');
}
