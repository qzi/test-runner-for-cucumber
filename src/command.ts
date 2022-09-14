'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { terminalOutput } from './extension';




const process: any = null;
let terminal: vscode.Terminal | null;
// starts the process of executing command in vs code output window
export const startProcess = (command: string) => {
	// Already running one?
	if (process) {
		const msg = 'There is a command running right now. Terminate it before executing a new command?';
		vscode.window.showWarningMessage(msg, 'Ok', 'Cancel').then((choice: any) => {
			if (choice === 'Ok' && terminalOutput) {
				killActiveProcess(terminalOutput);
			}
		});
		return;
	}

	runShellCommand(command, vscode.workspace.rootPath)
		.then(() => {
			console.log('> Command finished successfully.');
		})
		.catch((reason: any) => {
			console.log('> ERROR: ${reason}');
		});
};

// Tries to kill the active process that is running a command.
export const killActiveProcess = (terminalOutput: vscode.Terminal) => {
	if (!process) return;

	terminalOutput.dispose();
};


// runs the shell command in output window
const runShellCommand = (cmd: string, cwd: string | undefined) => {
	return new Promise<void>((accept, reject) => {
		const opts: any = {};
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
