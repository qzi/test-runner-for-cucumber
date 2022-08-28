# Test Runner for Cucumber

This vscode extension intend to run the Cucumber program easily.
                    

## Features

Currently this extension support to run the `.feature` of Cucumber only using `cucumber-js` and javascript.
      
    
## Usage

Press `command+shift+p` to call command palete  
and then choose `Cucumber Runner: runCurrentFeature.  
     


## Pre-requisites
This experimental extension is designed for cucumber-js only currently,  
 so you need to install `cucumber-js` before you use it.
 ```shell
 > npm install @cucumber/cucumber npx
 ```
add `.vscode/settings.json` like this below: 
```json
{
	"test-runner-for-cucumber": {
		"tool": "cucumberjs",
		"script": "npx cucumber-js -c cucumber.js src/test/resources/features/**/*.feature"
	}
}
```


​        
## To do list
* support run by scenario
* support run other languages like java if possible

    
	
## References

Gherkin Reference.  
<https://cucumber.io/docs/gherkin/reference/>  
snippets-for-cucumber  
<https://marketplace.visualstudio.com/items?itemName=agilelog-org.snippets-for-cucumber>  
Agile Log.  
<https://agilelog.org>
