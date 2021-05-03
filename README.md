

## Developing

First, `npm install`.

In VS Code, open the command patellete, then select **Debug: Toggle Auto-Attach** so that any new NodeJS application will attach the VS Code debugger.

Then, from the VS Code terminal, invoke the CLI tool by running it against a cluster.

``` bash
npm start -- -g <cluster resource group> -n <cluster name>
```