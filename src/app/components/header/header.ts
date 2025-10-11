import { Component, ChangeDetectionStrategy, signal, inject, output, input } from '@angular/core';
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
  protected readonly dimensionMenuOpen = signal(false);

  hasSelectedEntity = input<boolean>(false);
  isSelectedEntityFrozen = input<boolean>(false);

  copy = output<void>();
  paste = output<void>();
  delete = output<void>();
  freeze = output<void>();
  unfreeze = output<void>();
  selectDimensionTool = output<void>();

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

  protected onDelete() {
    this.delete.emit();
    this.closeEditMenu();
  }

  protected onFreeze() {
    this.freeze.emit();
    this.closeEditMenu();
  }

  protected onUnfreeze() {
    this.unfreeze.emit();
    this.closeEditMenu();
  }

  protected toggleDimensionMenu() {
    this.dimensionMenuOpen.update(isOpen => !isOpen);
  }

  protected closeDimensionMenu() {
    this.dimensionMenuOpen.set(false);
  }

  protected onSelectDimensionTool() {
    this.selectDimensionTool.emit();
    this.closeDimensionMenu();
  }
}
