import * as vscode from 'vscode';
import * as fs from 'fs';
import { startProcess } from './command';

const workspaceFolder: vscode.Uri | any = vscode.window.activeTextEditor?.document.uri;

interface CucumberRunnerConfiguration {
	language: string;
	tool: string;
	script: string;

}


const getProjectRoot = () => {
	let editor = vscode.window.activeTextEditor;
	let currentDocument = editor?.document.uri;
	let currentPath = vscode.workspace.getWorkspaceFolder(currentDocument!)?.uri.fsPath;
	return currentPath;
};

/**
 * Collect Test Runner for Cucumber configuration object from .vscode/settings.json
 */
export const getCucumberRunnerObject = (): CucumberRunnerConfiguration => {
	let defaultSettings: string = '{ "test-runner-for-cucumber": {} }';
	let cucumberRunnerConfiguration: CucumberRunnerConfiguration = JSON.parse(defaultSettings)["test-runner-for-cucumber"];



	let currentPath = getProjectRoot();
	console.log('Current Path: ', currentPath);
	let file = `${currentPath}/.vscode/settings.json`;
	// skipped if setting is not correct
	let isSkipped: boolean = true;
	// Check that the file exists locally
	if (!fs.existsSync(file)) {
		if (!isSkipped) { throw new Error('Test Runner for Cucumber: .vscode/settings.json is not found \n'); }

	} else {
		try {
			defaultSettings = fs.readFileSync(
				`${currentPath}/.vscode/settings.json`,
				'utf8'
			);

			try {
				cucumberRunnerConfiguration = JSON.parse(defaultSettings)['test-runner-for-cucumber'];
				return cucumberRunnerConfiguration;
			} catch (err) {
				// vscode.window.showErrorMessage('Cucumber Runner configuration not found in .vscode/settings.json');
				if (!isSkipped) {
					throw new Error('Test Runner for Cucumber: configuration is not correct in .vscode/settings.json \n');
				}
			}

		} catch (err) {
			let message = 'Unknown Error';
			if (err instanceof Error) message = "Test Runner for Cucumber: .vscode/settings.json parse failed: \n" + err.message;
			// vscode.window.showErrorMessage('unable to read cucumber runner configuration', message);
			throw new Error(message);
		}

	}

	return cucumberRunnerConfiguration;
};

/**
 * get script information from cucumber runner configuration
 * @param cucumberRunnerConfig
 */
export const getCucumberRunnerScript = (cucumberRunnerConfig: CucumberRunnerConfiguration): string =>
	cucumberRunnerConfig.script;

/**
 * get tool information from cucumber runner configuration
 * @param cucumberRunnerConfig
 */
export const getCucumberRunnerTool = (cucumberRunnerConfig: CucumberRunnerConfiguration): string =>
	cucumberRunnerConfig.tool;

/**
 * execute the command in the active vscode terminal
 * @param script
 * @param command
 * @param tool
 */
export const executeCucumberRunnerCommand = (script: string, command: string, tool?: string) => {
	// const terminal = getActiveTerminal();
	// terminal?.show();
	const executableCommand: string = (tool == 'cucumber-js') ? `${command}` : `${script} ${command}`;
	const terminal = getActiveTerminal();
	if (tool == 'cucumber-js') {
		terminal?.show();
		terminal.sendText(executableCommand);
	} else {
		// startProcess(executableCommand);
		terminal.sendText('clear');
	}
};

/**
 * create active terminal if not exists
 */
const getActiveTerminal = () => {
	return vscode.window.activeTerminal ? vscode.window.activeTerminal : vscode.window.createTerminal('Cucumber Runner');
};

/**
 * This method helps to determine if the selected text is a valid scenario name
 * This method will throw error if user selects any line except Scenario or Scenario outline
 */
export const getScenarioName = () => {
	const selectedLine: string | undefined = vscode.window.activeTextEditor?.document.lineAt(
		vscode.window.activeTextEditor.selection.active.line
	).text;
	console.log('selectedLine:', selectedLine);

	if (selectedLine?.includes('Scenario')) {
		return selectedLine
			.replace(/(Scenario:|Scenario Outline:)/, '')
			.replace(/^\s\s*/, '')
			.replace(/\s\s*$/, '');
	} else if (selectedLine?.includes('@')) {
		return selectedLine.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	} else {
		vscode.window.showErrorMessage(
			`Incorrect line selected: ${selectedLine}.\n Please select Scenario or Scenario Outline`
		);
		throw new Error('Scenario Name incorrect. Please select scenario');
	}
};

/**
 * create command needed for specific scenario execution
 * @param cucumberRunnerConfiguration
 * @param scenarioName
 */
export const createCommandToExecuteScenario = (cucumberRunnerConfiguration: CucumberRunnerConfiguration, scenarioName: string, tool: string): string => {

	const currentFeatureFilePath: string | undefined = vscode.window.activeTextEditor?.document.uri.fsPath;

	if (typeof currentFeatureFilePath == undefined || typeof tool == undefined || cucumberRunnerConfiguration == undefined)
		return "";
	else {
		const toolCommands: Map<string, string> = new Map();

		if (cucumberRunnerConfiguration.tool == "cucumber-js" && cucumberRunnerConfiguration.language == "javascript" || cucumberRunnerConfiguration.language == "typescript") {
			toolCommands.set('cucumber-js', getCucumberJsScenarioExecutable(cucumberRunnerConfiguration,
				` --name "${scenarioName}"`, currentFeatureFilePath!));
			let commandeToExecuteScenario: string | undefined = toolCommands.get(cucumberRunnerConfiguration.tool);
			return (typeof commandeToExecuteScenario !== 'undefined') ? commandeToExecuteScenario : "";
		} else {
			vscode.window.showErrorMessage(
				`un-supported tool found: ${tool}.Cucumber runner configuration tool only accept: cucumber-js.`
			);
			throw new Error('Scenario Name incorrect. Please select scenario');
		}

	}

};

/**
 * create command needed for specific feature execution
 * @param cucumberRunnerConfiguration
 */
export const createCommandToExecuteFeature = (cucumberRunnerConfiguration: CucumberRunnerConfiguration): string => {
	const currentFeatureFilePath: string | undefined = vscode.window.activeTextEditor?.document.uri.fsPath;
	// const currentRootFolderName: string | undefined = vscode.workspace.getWorkspaceFolder(workspaceFolder)?.name;

	const toolCommands = new Map()
		.set('cucumber-js', getCucumberJsFeatureExecutable(cucumberRunnerConfiguration, currentFeatureFilePath));


	if (currentFeatureFilePath === undefined && toolCommands.get(cucumberRunnerConfiguration.tool) === undefined) {
		vscode.window.showErrorMessage(
			`un-supported tool found: ${cucumberRunnerConfiguration.tool}.Cucumber runner configuration tool only accept: protractor/webdriverio/cypress/cucumberjs.`
		);
		throw new Error('Scenario Name incorrect. Please select scenario');
	}
	return toolCommands.get(cucumberRunnerConfiguration.tool);
};

/**
 *
 * @param cucumberRunnerConfiguration
 * @param currentFeatureFilePath
 */
const getCucumberJsFeatureExecutable = (
	cucumberRunnerConfiguration: CucumberRunnerConfiguration,
	currentFeatureFilePath: string | undefined
) => {
	const splitter = cucumberRunnerConfiguration.script.split(' ');
	splitter[4] = `"${currentFeatureFilePath}"`;
	return splitter.join(' ');
};

/**
 *
 * @param cucumberRunnerConfiguration
 * @param currentScenarioName
 * @param currentFeatureFilePath
 */
const getCucumberJsScenarioExecutable = (
	cucumberRunnerConfiguration: CucumberRunnerConfiguration,
	currentScenarioName: string,
	currentFeatureFilePath: string
): string => {
	const splitter: string[] = cucumberRunnerConfiguration.script.split(' ');
	splitter[4] = `"${currentScenarioName}"`;
	splitter[5] = `"${currentFeatureFilePath}"`;
	return splitter.join(' ');
};

