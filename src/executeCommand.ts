'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { commandOutput, terminalOutput } from './extension';




let process: any = null;
let terminal: vscode.Terminal | null;
// starts the process of executing command in vs code output window
export const startProcess = (command: string) => {
	// Already running one?
	if (process) {
		const msg = 'There is a command running right now. Terminate it before executing a new command?';
		vscode.window.showWarningMessage(msg, 'Ok', 'Cancel').then((choice: any) => {
			if (choice === 'Ok' && commandOutput) {
				killActiveProcess(commandOutput);
			}
		});
		return;
	}


	commandOutput?.appendLine(`> Running command: ${command}`);

	runShellCommand(command, vscode.workspace.rootPath)
		.then(() => {
			commandOutput?.appendLine(`> Command finished successfully.`);
		})
		.catch((reason: any) => {
			commandOutput?.appendLine(`> ERROR: ${reason}`);
		});
};

// Tries to kill the active process that is running a command.
export const killActiveProcess = (commandOutput: vscode.OutputChannel) => {
	if (!process) return;

	commandOutput.appendLine(`> Killing PID ${process.pid}...`);

};

// prints command output
const printOutputDelegate = (data: any) => {
	commandOutput?.append(data.toString());
};

// runs the shell command in output window
const runShellCommand = (cmd: string, cwd: string | undefined) => {
	return new Promise<void>((accept, reject) => {
		var opts: any = {};
		if (vscode.workspace) {
			opts.cwd = cwd;
		}
		if (terminalOutput) {
			terminalOutput!.sendText(cmd);
			terminalOutput?.show();
		}
		else {
			console.log(' terminalOutput is null or undefined');
		}

	});
};
