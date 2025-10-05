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
- **Signal-based State Management**: Uses Angular signals for reactive state
- **Canvas-based Drawing**: HTML5 Canvas with 2D rendering context for CAD operations
- **Entity System**: Geometric shapes (lines, rectangles, circles) with selection and manipulation

## Core Components

### App Component (`src/app/app.ts`)

- Main application shell coordinating toolbar, canvas, and properties panel
- Manages global state for selected entities
- Handles communication between child components via event emitters

### Canvas Component (`src/app/components/canvas/canvas.ts`)

- Core drawing surface using HTML5 Canvas 2D context
- Implements drawing tools (line, rectangle, circle, select)
- Entity manipulation: selection, dragging, resizing with visual handles
- Hit testing algorithms for precise entity selection
- Grid rendering and visual feedback systems

### Toolbar Component (`src/app/components/toolbar/toolbar.ts`)

- Tool selection interface (select, line, rectangle, circle)
- Emits tool changes to parent app component

### Properties Panel (`src/app/components/properties-panel/properties-panel.ts`)

- Displays selected entity properties (position, dimensions, styling)
- Resizable panel with computed properties for dynamic content
- Uses input signals to receive entity data

## Entity System

### Core Types (`src/app/types/`)

- **Point**: Basic coordinate structure `{x: number, y: number}`
- **Line**: Start/end points with visual properties
- **Rectangle**: Start/end points defining bounds with optional fill
- **Circle**: Center point and radius with optional fill
- **Entity**: Union type with common properties (color, width, fillColor)

### Entity Management

- Each entity has unique string ID (timestamp-based)
- Stored in separate signal arrays by type in CanvasComponent
- Selection system tracks entity type and ID for manipulation operations

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

- Use `input()` and `output()` functions instead of decorators
- Native control flow: `@if`, `@for`, `@switch` instead of structural directives
- `computed()` for derived state calculations
- `ChangeDetectionStrategy.OnPush` for performance

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

### App State

- State Shared among components should be added to the state/app.store.ts
