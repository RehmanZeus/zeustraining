import { Command } from "./Command";

// CommandManager is responsible for managing the execution, undo, and redo of commands.
export class CommandManager {

    /** Stack of executed commands for undo functionality */
    private undoStack: Command[] = [];
    /** Stack of undone commands for redo functionality */
    private redoStack: Command[] = [];


    /**
     * Executes a command and manages the command history.
     * @param cmd The command to execute.
     */
    executeCommand(cmd: Command) {
        cmd.execute();
        this.undoStack.push(cmd);
        this.redoStack = [];
        console.log("EXec Undo", this.undoStack);
        console.log("Exec Redo", this.redoStack);
    }

    /**
     * Undoes the last executed command.
     * If there are no commands to undo, this method does nothing.
     */
    undo() {
        const cmd = this.undoStack.pop();
        if (cmd) {
            cmd.undo();
            this.redoStack.push(cmd);
        }

        console.log("UndoFn Undo", this.undoStack);
        console.log("UndoFn Redo", this.redoStack);
    }

    /**
     * Redoes the last undone command.
     * If there are no commands to redo, this method does nothing.
     */
    redo() {
        const cmd = this.redoStack.pop();
        if (cmd) {
            cmd.redo();
            this.undoStack.push(cmd);
        }

        console.log("RedoFn Undo", this.undoStack);
        console.log("RedoFn Redo", this.redoStack);
    }
}