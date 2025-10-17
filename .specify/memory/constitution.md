# CAD Client Constitution

## Core Principles

### I. Standalone Components
All components must be standalone (no NgModules). Each component should be self-contained, independently testable, and use Angular 20+ standalone APIs. Clear separation of concerns required - components handle UI, services handle business logic.

### II. Signal-Based State Management
All state must use Angular signals and NgRx Signals store for reactive updates. Local component state stored in signals; global application state managed through AppStore. Use `update()` method for immutable state changes; `computed()` for derived state.

### III. Canvas-First Architecture
Core CAD operations built on HTML5 Canvas 2D context. Layered rendering: grid → entities → selection highlights → resize handles. Real-time preview during drawing operations. Hit testing algorithms must provide precise entity selection with appropriate tolerance.

### IV. Entity System Integrity
Each entity has unique ID (timestamp-based). Entities stored in type-specific signal arrays. All entities support rotation property. Selection system tracks entity type and ID for manipulation. Immutable updates using signal `update()` method.

### V. Modern Angular Patterns
Prefer `input()` and `output()` functions over decorators. Use native control flow (`@if`, `@for`, `@switch`) instead of structural directives. Use `ChangeDetectionStrategy.OnPush` for performance. Use `inject()` for dependency injection. Protected methods for template binding, private for internal logic.

## Technical Stack Requirements

**Framework**: Angular 20+ with standalone components

**State Management**: Angular signals and NgRx Signals store

**Rendering**: HTML5 Canvas 2D context

**Entity Types**: Line, Rectangle, Circle with common properties (id, color, width, rotation, optional fillColor)

**Global State**: AppStore manages clipboard, snap/ortho modes, mouse position, deleted entities history (max 10)

**Component Architecture**: Inline templates for small components, separate files for complex ones. CSS files co-located with components.

## Development Workflow

**Testing**: Use `ng test` for unit tests. All new features require corresponding tests.

**Build**: Use `ng build` for production, `ng build --watch --configuration development` for development.

**Component Generation**: Use `ng generate component component-name` for consistency.

**State Updates**: Always use signal `update()` for immutable changes. Never mutate state directly.

**Event Communication**: Parent app component coordinates cross-component communication via event emitters. Use AppStore for truly global state only.

**Hit Testing**: Line (distance to segment), Rectangle (edge proximity), Circle (distance to circumference), all with appropriate tolerance.

## Governance

This constitution supersedes all other development practices for the CAD Client application. Any amendments require documentation and approval. All new features and changes must comply with these principles.

All code reviews must verify:
- Standalone component architecture
- Signal-based state management
- Proper entity system usage
- Modern Angular patterns
- Canvas rendering best practices

Refer to [CLAUDE.md](../CLAUDE.md) for detailed runtime development guidance and architecture documentation.

**Version**: 1.0.0 | **Ratified**: 2025-10-16 | **Last Amended**: 2025-10-16
