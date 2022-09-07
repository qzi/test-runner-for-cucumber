import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { parseScenario } from './parser';
import { executeCucumberRunnerCommand } from './utils';

const textDecoder = new TextDecoder('utf-8');

// export type MarkdownTestData = TestFile | TestHeading;
export type ScenarioTestData = TestFile | TestCase;

export const testData = new WeakMap<vscode.TestItem, ScenarioTestData>();

let generationCounter = 0;

export interface ScenarioCommand {
	tool: string;
	script: string;
	scenarioCommand: string;
}

export const getContentFromFilesystem = async (uri: vscode.Uri) => {
	try {
		const rawContent = await vscode.workspace.fs.readFile(uri);
		return textDecoder.decode(rawContent);
	} catch (e) {
		console.warn(`Error providing tests for ${uri.fsPath}`, e);
		return '';
	}
};

export class TestFile {
	public didResolve = false;

	public async updateFromDisk(controller: vscode.TestController, item: vscode.TestItem, command: ScenarioCommand) {
		try {
			const content = await getContentFromFilesystem(item.uri!);
			item.error = undefined;
			this.updateFromContents(controller, content, item, command);
		} catch (e) {
			item.error = (e as Error).stack;
		}
	}

	/**
	 * Parses the tests from the input text, and updates the tests contained
	 * by this file to be those from the text,
	 */
	public updateFromContents(controller: vscode.TestController, content: string, item: vscode.TestItem, command: ScenarioCommand) {
		const ancestors = [{ item, children: [] as vscode.TestItem[] }];
		const thisGeneration = generationCounter++;
		this.didResolve = true;

		const ascend = (depth: number) => {
			while (ancestors.length > depth) {
				const finished = ancestors.pop()!;
				finished.item.children.replace(finished.children);
			}
		};

		parseScenario(content, {
			// onTest: (range, a, operator, b, expected) => {
			// 	const parent = ancestors[ancestors.length - 1];
			// const data = new TestCase(a, operator as Operator, b, expected, thisGeneration);
			// 	const id = `${item.uri}/${data.getLabel()}`;


			// 	const tcase = controller.createTestItem(id, data.getLabel(), item.uri);
			// 	testData.set(tcase, data);
			// 	tcase.range = range;
			// 	parent.children.push(tcase);
			// },
			OnScenario: (id, label) => {
				const parent = ancestors[ancestors.length - 1];
				const data = new TestCase(command.script, command.tool, command.scenarioCommand, "tbc", "tbc");
				const tcase = controller.createTestItem((id + 1).toString(), label, item.uri);
				testData.set(tcase, data);
				parent.children.push(tcase);
			},

			// onHeading: (range, name, depth) => {
			// 	ascend(depth);
			// 	const parent = ancestors[ancestors.length - 1];
			// 	const id = `${item.uri}/${name}`;

			// 	const thead = controller.createTestItem(id, name, item.uri);
			// 	thead.range = range;
			// 	testData.set(thead, new TestHeading(thisGeneration));
			// 	parent.children.push(thead);
			// 	ancestors.push({ item: thead, children: [] });
			// },
		});

		ascend(0); // finish and assign children for all remaining items
	}
}

// export class TestHeading {
// 	constructor(public generation: number) { }
// }

// type Operator = '+' | '-' | '*' | '/';

export class TestCase {
	constructor(
		private readonly script: string,
		private readonly tool: string,
		private readonly scenarioCommand: string,
		private readonly expected: string,
		private readonly lineNo: string,
	) { }

	getLabel() {
		return `${this.script} ${this.tool} ${this.scenarioCommand} = ${this.expected}`;
	}

	async run(item: vscode.TestItem, options: vscode.TestRun): Promise<void> {
		const start = Date.now();
		await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
		const actual = this.execTest();
		const duration = Date.now() - start;

		// if (actual === this.expected) {
		// 	options.passed(item, duration);
		// } else {
		// 	const message = vscode.TestMessage.diff(`Expected ${item.label}`, String(this.expected), String(actual));
		// 	message.location = new vscode.Location(item.uri!, item.range!);
		// 	options.failed(item, message, duration);
		// }
	}

	private execTest() {
		// switch (this.operator) {
		// 	case '-':
		// 		return this.a - this.b;
		// 	case '+':
		// 		return this.a + this.b;
		// 	case '/':
		// 		return Math.floor(this.a / this.b);
		// 	case '*':
		// 		return this.a * this.b;
		// }
	}
}
