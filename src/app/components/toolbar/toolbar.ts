import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent {
  protected readonly selectedTool = signal('select');
  
  toolSelected = output<string>();

  protected selectTool(tool: string) {
    this.selectedTool.set(tool);
    this.toolSelected.emit(tool);
  }
}
