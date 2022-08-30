'use strict';

import * as vscode from 'vscode';
import {
	getCucumberRunnerObject,
	createCommandToExecuteFeature,
	executeCucumberRunnerCommand,
	createCommandToExecuteScenario,
	getScenarioName,
	getCucumberRunnerScript,
	getCucumberRunnerTool,
} from './utils';

export let terminalOutput: vscode.Terminal | null = null;


export function activate(context: vscode.ExtensionContext) {

	terminalOutput = vscode.window.createTerminal('Cucumber Runner');
	context.subscriptions.push(runFeatureDisposable);
	context.subscriptions.push(runScenarioDisposable);

}

const runScenarioDisposable = vscode.commands.registerCommand('cucumberRunner.runCurrentScenario', () => {
	vscode.window.showInformationMessage('Running the current scenario');

	const cucumberRunnerObject = getCucumberRunnerObject();
	const cucumberRunnerScript: string = getCucumberRunnerScript(cucumberRunnerObject);
	const currentScenarioName: string = getScenarioName();
	const toolUsed: string = getCucumberRunnerTool(cucumberRunnerObject);
	const scenarioCommand: string = createCommandToExecuteScenario(cucumberRunnerObject, currentScenarioName, toolUsed);

	if (terminalOutput) {
		executeCucumberRunnerCommand(cucumberRunnerScript, scenarioCommand, toolUsed);
	} else {
		logErrorIfOutputNotDefined();
	}
});

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
