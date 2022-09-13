'use strict';

import * as vscode from 'vscode';
import { TestFile, testData, TestCase, CommandWrap } from './testTree';
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

	// run Scenario Test
	const testController: vscode.TestController = vscode.tests.createTestController('CucumberTests', 'Cucumber Tests');
	context.subscriptions.push(testController);

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(updateNodeForDocument),
		vscode.workspace.onDidChangeTextDocument(e => updateNodeForDocument(e.document)),
	);

	let execCommand: CommandWrap;
	function updateNodeForDocument(e: vscode.TextDocument) {
		if (e.uri.scheme !== 'file') {
			return;
		}

		if (!e.uri.path.endsWith('.feature')) {
			return;
		}

		// command execution preparation

		const cucumberRunnerObject = getCucumberRunnerObject();
		if (Object.keys(cucumberRunnerObject).length != 0) {
			const cucumberRunnerScript: string = getCucumberRunnerScript(cucumberRunnerObject);
			// TO DO
			// const currentScenarioName: string = " ";
			// const currentScenarioName: string = getScenarioName();
			const toolUsed: string = getCucumberRunnerTool(cucumberRunnerObject);
			const scenarioCommand: string = createCommandToExecuteScenario(cucumberRunnerObject, "", toolUsed);

			let commandWrap: CommandWrap = new CommandWrap(toolUsed, cucumberRunnerScript, scenarioCommand);
			// TO DO: seperate the file info 
			const { file, data } = getOrCreateFile(testController, e.uri);
			data.updateFromContents(testController, e.getText(), file, commandWrap);
		}

	}
	// run the tests

	const runHandler = (
		request: vscode.TestRunRequest,
		cancellation: vscode.CancellationToken
	) => {


		const run = testController.createTestRun(request);

		const queue: { test: vscode.TestItem; data: TestCase }[] = [];



		// map of file uris to statments on each line:
		// const coveredLines = new Map</* file uri */ string, (vscode.StatementCoverage | undefined)[]>();

		const discoverTests = async (tests: Iterable<vscode.TestItem>) => {

			for (const test of tests) {
				if (request.exclude?.includes(test)) {
					continue;
				}
				const data = testData.get(test);
				if (data instanceof TestCase) {
					run.enqueued(test);
					queue.push({ test, data });
				} else {
					if (data instanceof TestFile && !data.didResolve) {
						await data.updateFromDisk(testController, test, execCommand);
					}
					await discoverTests(gatherTestItems(test.children));
				}

			}

		}

		const runTestQueue = async () => {


			for (const { test, data } of queue) {
				run.appendOutput(`Running ${test.id}\r\n`);
				if (cancellation.isCancellationRequested) {
					run.skipped(test);
				} else {
					run.started(test);
					await data.run(test, run);
				}

				const lineNo = test.range!.start.line;
				// const fileCoverage = coveredLines.get(test.uri!.toString());
				// if (fileCoverage) {
				// 	fileCoverage[lineNo]!.executionCount++;
				// }

				run.appendOutput(`Completed ${test.id}\r\n`);
			}

			run.end();
		};

		discoverTests(request.include ?? gatherTestItems(testController.items)).then(runTestQueue);

	}

	// const runProfile = testController.createRunProfile(
	// 	'Run',
	// 	vscode.TestRunProfileKind.Run,
	// 	(request, token) => {
	// 		runHandler(false, request, token);
	// 	}
	// );

	testController.createRunProfile('Run Tests', vscode.TestRunProfileKind.Run, runHandler, true);

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

const logErrorIfOutputNotDefined = () => {
	vscode.window.showErrorMessage(
		`vs code output terminal not defined. Please ensure all required configuration. If npt solved, raise an issue here: `
	);
	throw new Error('vs code output terminal not defined. Please ensure all required configuration.');
};



function gatherTestItems(collection: vscode.TestItemCollection) {
	const items: vscode.TestItem[] = [];
	collection.forEach(item => items.push(item));
	return items;
}