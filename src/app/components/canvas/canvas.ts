import { Component, ChangeDetectionStrategy, signal, ElementRef, ViewChild, AfterViewInit, inject } from '@angular/core';

export interface Point {
  x: number;
  y: number;
}

export interface Line {
  id: string;
  start: Point;
  end: Point;
  color: string;
  width: number;
}

export interface Rectangle {
  id: string;
  start: Point;
  end: Point;
  color: string;
  width: number;
  fillColor?: string;
}

export interface Circle {
  id: string;
  center: Point;
  radius: number;
  color: string;
  width: number;
  fillColor?: string;
}

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvasElement', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;
  
  private elementRef = inject(ElementRef);
  
  protected readonly isDrawing = signal(false);
  protected readonly currentTool = signal('select');
  protected readonly lines = signal<Line[]>([]);
  protected readonly rectangles = signal<Rectangle[]>([]);
  protected readonly circles = signal<Circle[]>([]);
  protected readonly currentLine = signal<Partial<Line> | null>(null);
  protected readonly currentRectangle = signal<Partial<Rectangle> | null>(null);
  protected readonly currentCircle = signal<Partial<Circle> | null>(null);
  
  private ctx: CanvasRenderingContext2D | null = null;
  private startPoint: Point | null = null;

  ngAfterViewInit() {
    this.initializeCanvas();
  }

  private initializeCanvas() {
    const canvas = this.canvasElement.nativeElement;
    this.ctx = canvas.getContext('2d');
    
    if (this.ctx) {
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
    
    this.resizeCanvas();
    this.drawGrid();
  }

  private resizeCanvas() {
    const canvas = this.canvasElement.nativeElement;
    const container = canvas.parentElement;
    
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  }

  private drawGrid() {
    if (!this.ctx) return;
    
    const canvas = this.canvasElement.nativeElement;
    const gridSize = 20;
    
    this.ctx.strokeStyle = '#bdc3c7';
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.3;
    
    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, canvas.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(canvas.width, y);
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
  }

  protected onMouseDown(event: MouseEvent) {
    const tool = this.currentTool();
    if (tool !== 'line' && tool !== 'rectangle' && tool !== 'circle') return;
    
    const rect = this.canvasElement.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.startPoint = { x, y };
    this.isDrawing.set(true);
    
    if (tool === 'line') {
      const newLine: Partial<Line> = {
        id: Date.now().toString(),
        start: { x, y },
        color: '#000000',
        width: 2
      };
      this.currentLine.set(newLine);
    } else if (tool === 'rectangle') {
      const newRectangle: Partial<Rectangle> = {
        id: Date.now().toString(),
        start: { x, y },
        color: '#000000',
        width: 2,
        fillColor: 'transparent'
      };
      this.currentRectangle.set(newRectangle);
    } else if (tool === 'circle') {
      const newCircle: Partial<Circle> = {
        id: Date.now().toString(),
        center: { x, y },
        color: '#000000',
        width: 2,
        fillColor: 'transparent'
      };
      this.currentCircle.set(newCircle);
    }
  }

  protected onMouseMove(event: MouseEvent) {
    if (!this.isDrawing() || !this.startPoint) return;
    
    const rect = this.canvasElement.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.redrawCanvas();
    
    const tool = this.currentTool();
    if (tool === 'line') {
      this.drawPreviewLine(this.startPoint, { x, y });
    } else if (tool === 'rectangle') {
      this.drawPreviewRectangle(this.startPoint, { x, y });
    } else if (tool === 'circle') {
      this.drawPreviewCircle(this.startPoint, { x, y });
    }
  }

  protected onMouseUp(event: MouseEvent) {
    if (!this.isDrawing() || !this.startPoint) return;
    
    const rect = this.canvasElement.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const tool = this.currentTool();
    
    if (tool === 'line') {
      const completedLine: Line = {
        id: this.currentLine()?.id || Date.now().toString(),
        start: this.startPoint,
        end: { x, y },
        color: this.currentLine()?.color || '#000000',
        width: this.currentLine()?.width || 2
      };
      this.lines.update(lines => [...lines, completedLine]);
      this.currentLine.set(null);
    } else if (tool === 'rectangle') {
      const completedRectangle: Rectangle = {
        id: this.currentRectangle()?.id || Date.now().toString(),
        start: this.startPoint,
        end: { x, y },
        color: this.currentRectangle()?.color || '#000000',
        width: this.currentRectangle()?.width || 2,
        fillColor: this.currentRectangle()?.fillColor || 'transparent'
      };
      this.rectangles.update(rectangles => [...rectangles, completedRectangle]);
      this.currentRectangle.set(null);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(x - this.startPoint.x, 2) + Math.pow(y - this.startPoint.y, 2)
      );
      const completedCircle: Circle = {
        id: this.currentCircle()?.id || Date.now().toString(),
        center: this.startPoint,
        radius: radius,
        color: this.currentCircle()?.color || '#000000',
        width: this.currentCircle()?.width || 2,
        fillColor: this.currentCircle()?.fillColor || 'transparent'
      };
      this.circles.update(circles => [...circles, completedCircle]);
      this.currentCircle.set(null);
    }
    
    this.isDrawing.set(false);
    this.startPoint = null;
    this.redrawCanvas();
  }

  private drawPreviewLine(start: Point, end: Point) {
    if (!this.ctx) return;
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
  }

  private drawPreviewRectangle(start: Point, end: Point) {
    if (!this.ctx) return;
    
    const width = end.x - start.x;
    const height = end.y - start.y;
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.strokeRect(start.x, start.y, width, height);
    
    this.ctx.setLineDash([]);
  }

  private drawPreviewCircle(center: Point, end: Point) {
    if (!this.ctx) return;
    
    const radius = Math.sqrt(
      Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2)
    );
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
  }

  private redrawCanvas() {
    if (!this.ctx) return;
    
    const canvas = this.canvasElement.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    this.drawGrid();
    this.drawAllLines();
    this.drawAllRectangles();
    this.drawAllCircles();
  }

  private drawAllLines() {
    if (!this.ctx) return;
    
    this.lines().forEach(line => {
      this.ctx!.strokeStyle = line.color;
      this.ctx!.lineWidth = line.width;
      this.ctx!.setLineDash([]);
      
      this.ctx!.beginPath();
      this.ctx!.moveTo(line.start.x, line.start.y);
      this.ctx!.lineTo(line.end.x, line.end.y);
      this.ctx!.stroke();
    });
  }

  private drawAllRectangles() {
    if (!this.ctx) return;
    
    this.rectangles().forEach(rectangle => {
      const width = rectangle.end.x - rectangle.start.x;
      const height = rectangle.end.y - rectangle.start.y;
      
      // Draw fill if specified
      if (rectangle.fillColor && rectangle.fillColor !== 'transparent') {
        this.ctx!.fillStyle = rectangle.fillColor;
        this.ctx!.fillRect(rectangle.start.x, rectangle.start.y, width, height);
      }
      
      // Draw stroke
      this.ctx!.strokeStyle = rectangle.color;
      this.ctx!.lineWidth = rectangle.width;
      this.ctx!.setLineDash([]);
      this.ctx!.strokeRect(rectangle.start.x, rectangle.start.y, width, height);
    });
  }

  private drawAllCircles() {
    if (!this.ctx) return;
    
    this.circles().forEach(circle => {
      // Draw fill if specified
      if (circle.fillColor && circle.fillColor !== 'transparent') {
        this.ctx!.fillStyle = circle.fillColor;
        this.ctx!.beginPath();
        this.ctx!.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
        this.ctx!.fill();
      }
      
      // Draw stroke
      this.ctx!.strokeStyle = circle.color;
      this.ctx!.lineWidth = circle.width;
      this.ctx!.setLineDash([]);
      this.ctx!.beginPath();
      this.ctx!.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
      this.ctx!.stroke();
    });
  }

  setTool(tool: string) {
    this.currentTool.set(tool);
  }
}
