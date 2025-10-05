import { Component, ChangeDetectionStrategy, signal, inject, output } from '@angular/core';
import { AppStore } from '../../state/app.store';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  private appStore = inject(AppStore);

  protected readonly editMenuOpen = signal(false);

  copy = output<void>();
  paste = output<void>();

  protected get hasClipboardContent(): boolean {
    return this.appStore.clipboardEntity() !== null;
  }

  protected toggleEditMenu() {
    this.editMenuOpen.update(isOpen => !isOpen);
  }

  protected closeEditMenu() {
    this.editMenuOpen.set(false);
  }

  protected onCopy() {
    this.copy.emit();
    this.closeEditMenu();
  }

  protected onPaste() {
    this.paste.emit();
    this.closeEditMenu();
  }
}
