export interface Action {
  type: 'place' | 'remove' | 'clear';
  x: number;
  y: number;
  z: number;
  color?: string;
  previousColor?: string;
}

export class UndoManager {
  private undoStack: Action[] = [];
  private redoStack: Action[] = [];
  private maxHistorySize = 100;

  push(action: Action): void {
    this.undoStack.push(action);
    this.redoStack = [];

    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }

  undo(): Action | null {
    const action = this.undoStack.pop();
    if (action) {
      this.redoStack.push(action);
    }
    return action || null;
  }

  redo(): Action | null {
    const action = this.redoStack.pop();
    if (action) {
      this.undoStack.push(action);
    }
    return action || null;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  getStats() {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
    };
  }
}
