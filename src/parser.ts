import * as vscode from 'vscode';

const testRe = /^([0-9]+)\s*([+*/-])\s*([0-9]+)\s*=\s*([0-9]+)/;
const headingRe = /^(#+)\s*(.+)$/;
const GherkinScenarioRe: RegExp = /^\s*(Scenario:)\s*(.+)$/;

export const parseScenario = (text: string, events: {
	// onTest(range: vscode.Range, a: number, operator: string, b: number, expected: number): void;
	// onHeading(range: vscode.Range, name: string, depth: number): void;
	OnScenario(id: number, label: string): void;
}) => {
	const lines = text.split('\n');

	for (let lineNo = 0; lineNo < lines.length; lineNo++) {
		const line = lines[lineNo];

		const test = GherkinScenarioRe.exec(line);

		if (test) {
			events.OnScenario(lineNo, test[2]);
			continue;
		}

		// const heading = headingRe.exec(line);
		// if (heading) {
		// 	const [, pounds, name] = heading;
		// 	const range = new vscode.Range(new vscode.Position(lineNo, 0), new vscode.Position(lineNo, line.length));
		// 	events.onHeading(range, name, pounds.length);
		// }
	}
};
