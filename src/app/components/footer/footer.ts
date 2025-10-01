import { Component, ChangeDetectionStrategy, input, output, inject, computed } from '@angular/core';
import { AppStore } from '../../state/app.store';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  appStore = inject(AppStore);

  mousePositionDisplay = computed(() => 
    `X: ${this.appStore.mousePosition().x}, Y: ${this.appStore.mousePosition().y}`
  );
  snapDisplay = computed(() => 
    this.appStore.snapEnabled() ? 'On' : 'Off'
  );
  orthoDisplay = computed(() => 
    this.appStore.orthoEnabled() ? 'On' : 'Off'
  );

  onSnapClick() {
    this.appStore.toggleSnap();
  }

  onOrthoClick() {
    this.appStore.toggleOrtho();
  }
}
