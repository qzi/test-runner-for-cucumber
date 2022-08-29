import * as vscode from 'vscode';
import * as fs from 'fs';
import { startProcess } from './executeCommand';

const workspaceFolder: vscode.Uri | any = vscode.window.activeTextEditor?.document.uri;

interface CucumberRunnerConfiguration {
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
	let cucumberRunnerConfiguration: CucumberRunnerConfiguration;
	let currentPath = getProjectRoot();
	console.log('Current Path: ', currentPath);

	try {
		let file = `${currentPath}/.vscode/settings.json`;
		// Check that the file exists locally
		if (!fs.existsSync(file)) {
			console.log("settings.json not found");
			let defaultSettings = '{ "test-runner-for-cucumber": { "tool": "cucumberjs", "script": "npx cucumber-js -c cucumber.js src/test/resources/features/**/*.feature" } }';
			cucumberRunnerConfiguration = JSON.parse(defaultSettings)["test-runner-for-cucumber"];
		} else {
			cucumberRunnerConfiguration = JSON.parse(fs.readFileSync(
				`${currentPath}/.vscode/settings.json`,
				'utf8'
			))['test-runner-for-cucumber'];
		}
	} catch (err) {
		let message = 'Unknown Error';
		if (err instanceof Error) message = "Settings.json parse failed: \n" + err.message
		vscode.window.showErrorMessage('unable to read cucumber-cucumberRunner configuration', message);
		throw new Error(message);
	}

	if (cucumberRunnerConfiguration) {
		return cucumberRunnerConfiguration;
	} else {
		vscode.window.showErrorMessage('Cucumber Runner configuration not found in .vscode/settings.json');
		throw new Error('Cucumber Runner configuration not found in .vscode/settings.json');
	}
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
	const executableCommand: string = tool === 'cucumberjs' ? `${command}` : `${script} ${command}`;

	if (tool === 'cucumberjs') {
		const terminal = getActiveTerminal();
		terminal?.show();
		// terminal.sendText('clear');
		terminal.sendText(executableCommand);
	} else {
		startProcess(executableCommand);
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
export const createCommandToExecuteScenario = (scenarioName: string, tool: string): string => {
	if (tool === 'cypress' && !scenarioName.includes('@')) {
		vscode.window.showErrorMessage(
			`Cypress cucumber preprocessor does not support running scenario by scenario name. Right click on the Tags and press 'Run Cucumber Scenario'`
		);
		throw new Error('Scenario Name incorrect. Please select scenario');
	}
	const toolCommands: Map<any, any> = new Map()
		.set('protractor', `--cucumberOpts.name="${scenarioName}"`)
		.set('webdriverio', `--cucumberOpts.name="${scenarioName}"`)
		.set('cypress', `run -e TAGS="${scenarioName.split(/(\s+)/)[0]}"`)
		.set('cucumberjs', `--name "${scenarioName}"`);

	if (toolCommands.get(tool) === undefined) {
		vscode.window.showErrorMessage(
			`un-supported tool found: ${tool}.Cucumber runner configuration tool only accept: protractor/webdriverio/cypress/cucumberjs.`
		);
		throw new Error('Scenario Name incorrect. Please select scenario');
	}
	return toolCommands.get(tool);
};

/**
 * create command needed for specific feature execution
 * @param cucumberRunnerConfiguration
 */
export const createCommandToExecuteFeature = (cucumberRunnerConfiguration: CucumberRunnerConfiguration): string => {
	const currentFeatureFilePath: string | undefined = vscode.window.activeTextEditor?.document.uri.fsPath;
	const currentRootFolderName: string | undefined = vscode.workspace.getWorkspaceFolder(workspaceFolder)?.name;

	const toolCommands = new Map()
		.set('protractor', `--specs="${currentFeatureFilePath}"`)
		.set('webdriverio', `--spec="${currentFeatureFilePath}"`)
		.set(
			'cypress',
			`run -e GLOB="${currentFeatureFilePath?.replace(new RegExp('.*' + currentRootFolderName), '').substr(1)}"`
		)
		.set('cucumberjs', getCucumberJsFeatureExecutable(cucumberRunnerConfiguration, currentFeatureFilePath));

	// console.log('toolCommands.get(tool):', toolCommands.get(cucumberRunnerConfiguration.tool));

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

