# Test Runner for Cucumber

This vscode extension intend to run the Cucumber program easily.
​        
    
## Features
Currently this extension support `cucumber-js` and javascript/typescript only     

| command                           | remark                                                     |
|:----------------------------------|:-----------------------------------------------------------|
| cucumberRunner.runCurrentFeature  | run the current feature file                               |
| cucumberRunner.runCurrentScenario | run the cucumber scenario which line your mice is pointing |




## Usage

Press `command+shift+p` to call command palete  
and then choose `Cucumber Runner: runCurrentFeature   
     
​        

## Pre-requisites
This experimental extension is designed for cucumber-js only currently,  
 so you need to install `cucumber-js` before you use it.
 ```shell
 > npm install @cucumber/cucumber npx
 ```
add `.vscode/settings.json` like this defalut setting(if no settings.json): 
```json
{
	"test-runner-for-cucumber": {
		"tool": "cucumberjs",
		"script": "npx cucumber-js -c cucumber.js src/test/resources/features/**/*.feature"
	}
}
```
​        
### Configuration of cucumber-js 
The configuration of cucumber-js itself can refer to the official guide  
https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md 

```json
// sample configuration of cucumber.js
export default {
  import: ["src/test/**/*.js"],
  // paths: ["src/test/**/*.feature"],
  // strict: true,
  publishQuiet: true,
  forceExit: true
};
```
​        

## Shortcut configuration
Navigate to the `Code` -> `Preference` ->​ `Shortcut`,  
search the command `Cucumber Runner: runCurrentFeature`  
and then assign the shortcut to the command  

​       

​        
	
## References

Gherkin Reference.  
<https://cucumber.io/docs/gherkin/reference/>  
snippets-for-cucumber  
<https://marketplace.visualstudio.com/items?itemName=agilelog-org.snippets-for-cucumber>  
Agile Log.  
<https://agilelog.org>
