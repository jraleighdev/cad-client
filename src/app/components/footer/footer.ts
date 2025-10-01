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
  orthoEnabled = input<boolean>(false);
  mousePosition = input<{x: number, y: number}>({x: 0, y: 0});

  snapToggled = output<void>();
  orthoToggled = output<void>();

  onSnapClick() {
    console.log('hello');
    this.snapToggled.emit();
  }

  onOrthoClick() {
    this.orthoToggled.emit();
  }
}
