'use strict';

import * as vscode from 'vscode';
import { TestFile, testData } from './testTree';
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


export async function activate(context: vscode.ExtensionContext) {

	terminalOutput = vscode.window.createTerminal('Cucumber Runner');
	context.subscriptions.push(runFeatureDisposable);
	context.subscriptions.push(runScenarioDisposable);


	const ctrl = vscode.tests.createTestController('helloWorldTests', 'Hello World Tests');
	context.subscriptions.push(ctrl);

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(updateNodeForDocument),
		vscode.workspace.onDidChangeTextDocument(e => updateNodeForDocument(e.document)),
	);



	function updateNodeForDocument(e: vscode.TextDocument) {
		if (e.uri.scheme !== 'file') {
			return;
		}

		if (!e.uri.path.endsWith('.feature')) {
			return;
		}

		const { file, data } = getOrCreateFile(ctrl, e.uri);
		data.updateFromContents(ctrl, e.getText(), file);
	}

}



function getOrCreateFile(controller: vscode.TestController, uri: vscode.Uri) {
	const existing = controller.items.get(uri.toString());
	if (existing) {
		return { file: existing, data: testData.get(existing) as TestFile };
	}

	const file = controller.createTestItem(uri.toString(), uri.path.split('/').pop()!, uri);
	controller.items.add(file);

	const data = new TestFile();
	testData.set(file, data);

	file.canResolveChildren = true;
	return { file, data };
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
