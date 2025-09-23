import { Component, ChangeDetectionStrategy, signal, ElementRef, HostListener, inject } from '@angular/core';

@Component({
  selector: 'app-properties-panel',
  imports: [],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertiesPanelComponent {
  private elementRef = inject(ElementRef);
  
  protected readonly panelWidth = signal(300);
  protected readonly isResizing = signal(false);
  protected readonly minWidth = 200;
  protected readonly maxWidth = 600;
  protected readonly isNarrow = signal(false);

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
