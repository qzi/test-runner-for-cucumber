'use strict';

import * as vscode from 'vscode';
import {
	getCucumberRunnerObject,
	createCommandToExecuteFeature,
	executeCucumberRunnerCommand,
	// createCommandToExecuteScenario,
	// getScenarioName,
	getCucumberRunnerScript,
	getCucumberRunnerTool,
} from './utils';

export let commandOutput: vscode.OutputChannel | null = null;
export let terminalOutput: vscode.Terminal | null = null;


export function activate(context: vscode.ExtensionContext) {
	let NEXT_TERM_ID = 1;

	// console.log("Terminals: " + (<any>vscode.window).terminals.length);
	// runner for cucumber
	commandOutput = vscode.window.createOutputChannel('Cucumber Runner');
	terminalOutput = vscode.window.createTerminal('Cucumber Runner');
	// context.subscriptions.push(runFeatureDisposable);

	context.subscriptions.push(vscode.commands.registerCommand('cucumberRunner.notify', () => {
		// vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`);
		vscode.window.showInformationMessage('Hello World 2!');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cucumberRunner.createAndSend', () => {
		const terminal = vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`);
		terminal.sendText("ls -la");
		terminal.show();
		setTimeout(() => {
			terminal.dispose();
		}, 10000);

	}));

}

const runFeatureDisposable = vscode.commands.registerCommand('cucumberRunner.runCurrentFeature', () => {
	vscode.window.showInformationMessage('Running the current feature');

	const cucumberRunnerObject = getCucumberRunnerObject();
	const cucumberRunnerScript: string = getCucumberRunnerScript(cucumberRunnerObject);
	const featureCommand: string = createCommandToExecuteFeature(cucumberRunnerObject);
	const toolUsed: string = getCucumberRunnerTool(cucumberRunnerObject);

	if (terminalOutput) {
		executeCucumberRunnerCommand(cucumberRunnerScript, featureCommand, toolUsed);
	} else {
		logErrorIfOutputNotDefined();
	}
});

const logErrorIfOutputNotDefined = () => {
	vscode.window.showErrorMessage(
		`vs code output terminal not defined. Please ensure all required configuration. If npt solved, raise an issue here: `
	);
	throw new Error('vs code output terminal not defined. Please ensure all required configuration.');
};
