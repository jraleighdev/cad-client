# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
ng serve

# Build for production
ng build

# Build and watch for changes
ng build --watch --configuration development

# Run tests
ng test

# Generate new component
ng generate component component-name
```

## Architecture Overview

This is an Angular 20+ CAD client application built with:

- **Standalone Components**: No NgModules, all components are standalone
- **Signal-based State Management**: Uses Angular signals and NgRx Signals store for reactive state
- **Canvas-based Drawing**: HTML5 Canvas with 2D rendering context for CAD operations
- **Entity System**: Geometric shapes (lines, rectangles, circles) with selection, manipulation, and rotation support
- **Global State**: NgRx Signals store manages clipboard, snap/ortho modes, mouse position, and deleted entities history

## Core Components

### App Component ([src/app/app.ts](src/app/app.ts))

- Main application shell coordinating header, footer, toolbar, canvas, and properties panel
- Uses @ViewChild to access canvas component imperatively
- Manages selected entity properties signal
- Handles communication between child components via event emitters
- Coordinates copy/paste/delete operations

### Canvas Component ([src/app/components/canvas/canvas.ts](src/app/components/canvas/canvas.ts))

- Core drawing surface using HTML5 Canvas 2D context
- Implements drawing tools (line, rectangle, circle, select)
- Entity manipulation: selection, dragging, resizing with visual handles, rotation support
- Hit testing algorithms for precise entity selection
- Grid rendering and visual feedback systems
- Copy/paste/delete functionality with clipboard integration

### Header Component ([src/app/components/header/header.ts](src/app/components/header/header.ts))

- Application header with Edit menu
- Copy/Paste/Delete commands with keyboard shortcuts display
- Integrates with global AppStore for clipboard state
- Emits events to parent app component

### Footer Component ([src/app/components/footer/footer.ts](src/app/components/footer/footer.ts))

- Displays real-time mouse position from AppStore
- Shows snap/ortho mode status with toggle buttons
- Uses computed signals for reactive display updates

### Toolbar Component ([src/app/components/toolbar/toolbar.ts](src/app/components/toolbar/toolbar.ts))

- Tool selection interface (select, line, rectangle, circle)
- Emits tool changes to parent app component
- Uses signal for selected tool state

### Properties Panel ([src/app/components/properties-panel/properties-panel.ts](src/app/components/properties-panel/properties-panel.ts))

- Displays selected entity properties (position, dimensions, rotation, styling)
- Resizable panel with computed properties for dynamic content
- Uses input signals to receive entity data
- Emits property updates back to canvas component

## Entity System

### Core Types

#### [geometry.ts](src/app/types/geometry.ts)

- **Point**: `{x: number, y: number}`
- **Line**: `{id, start, end, color, width, rotation?}`
- **Rectangle**: `{id, start, end, color, width, fillColor?, rotation?}`
- **Circle**: `{id, center, radius, color, width, fillColor?, rotation?}`

#### [entity-properties.ts](src/app/types/entity-properties.ts)

- **EntityProperties**: Normalized view of entity data for properties panel
- **PropertyUpdate**: Structure for property changes from UI

#### [anchor-points.ts](src/app/types/anchor-points.ts)

- Anchor point definitions for entity manipulation

### Entity Management

- Each entity has unique string ID (timestamp-based)
- Stored in separate signal arrays by type in CanvasComponent: `lines()`, `rectangles()`, `circles()`
- Selection system tracks entity type and ID for manipulation operations
- All entities support optional rotation property (in degrees)

## Key Features

### Clipboard Operations

- **Copy**: Stores selected entity to AppStore clipboard
- **Paste**: Creates new entity from clipboard at mouse position
- **Delete**: Removes selected entities and stores in deletion history

### Drawing Modes

- **Snap Mode**: Snaps coordinates to grid (20px increments)
- **Ortho Mode**: Constrains drawing to orthogonal angles
- Both modes toggled via footer buttons and managed in AppStore

### Entity Rotation

- All entity types support rotation property (degrees)
- Displayed and editable in properties panel
- Applied via canvas context transformations during rendering

## Canvas Architecture

### Drawing System

- Uses HTML5 Canvas 2D context with proper canvas sizing
- Grid background (20px spacing) for visual reference
- Real-time preview during drawing operations using dashed strokes
- Layered rendering: grid → entities → selection highlights → resize handles

### Interaction System

- **Tool Modes**: select, line, rectangle, circle
- **Selection**: Hit testing with tolerance for precise entity picking
- **Manipulation**: Drag to move, resize handles for scaling
- **Visual Feedback**: Selection highlights, resize handles, cursor changes

### Hit Testing

- Line: Distance to line segment with tolerance
- Rectangle: Edge proximity detection within bounds
- Circle: Distance to circumference with tolerance
- Handles: Point distance for resize grip detection

## Angular Patterns

### Modern Angular Features

- Prefer `input()` and `output()` functions over decorators (though @ViewChild/HostListener still used where necessary)
- Native control flow: `@if`, `@for`, `@switch` instead of structural directives
- `computed()` for derived state calculations
- `ChangeDetectionStrategy.OnPush` for performance
- `inject()` for dependency injection (e.g., AppStore)

### Signal-based State

- Local component state stored in signals
- Use `update()` method for immutable state updates
- `computed()` signals for derived calculations (positions, dimensions)
- Event emitters for parent-child communication

### Component Structure

- Inline templates for small components, separate files for complex ones
- CSS files co-located with components
- Protected methods for template binding, private for internal logic

## State Management Patterns

### Entity State

- Canvas component maintains entity arrays as signals
- Immutable updates using signal `update()` method
- Selection state tracked separately from entity data
- Parent app coordinates cross-component communication

### UI State

- Tool selection managed by toolbar component
- Drawing state (isDrawing, currentTool) local to canvas
- Resize/drag state managed with boolean signals and position tracking

### Global App State ([src/app/state/app.store.ts](src/app/state/app.store.ts))

NgRx Signals store manages shared application state:

- **snapEnabled**: Grid snapping toggle
- **orthoEnabled**: Orthogonal drawing mode toggle
- **mousePosition**: Current mouse coordinates
- **clipboardEntity**: Copied entity for paste operations
- **deletedEntities**: History of last 10 deleted entities (for potential undo)

Store methods:

- `toggleSnap()`, `toggleOrtho()`: Toggle drawing modes
- `updateMousePosition(Point)`: Update mouse position
- `copyEntity(entity)`, `clearClipboard()`: Clipboard operations
- `addDeletedEntity(entity)`, `addDeletedEntities(entities[])`: Track deletions
