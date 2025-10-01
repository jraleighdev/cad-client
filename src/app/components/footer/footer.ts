import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  snapEnabled = input<boolean>(true);
  mousePosition = input<{x: number, y: number}>({x: 0, y: 0});

  snapToggled = output<void>();

  onSnapClick() {
    console.log('hello');
    this.snapToggled.emit();
  }
}
