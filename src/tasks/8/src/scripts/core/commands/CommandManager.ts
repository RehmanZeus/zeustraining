import { Command } from "./Command";

export class CommandManager {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];

    executeCommand(cmd: Command) {
        cmd.execute();
        this.undoStack.push(cmd);
        this.redoStack = [];
    }

    undo() {
        const cmd = this.undoStack.pop();
        if (cmd) {
            cmd.undo();
            this.redoStack.push(cmd);
        }
    }

    redo() {
        const cmd = this.redoStack.pop();
        if (cmd) {
            cmd.redo();
            this.undoStack.push(cmd);
        }
    }
}