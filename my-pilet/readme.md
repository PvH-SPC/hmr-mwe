

This MWE is to explain a bug with websockets and hot reloading in pilets, its not specific to websockets, but demonstrates the issue with the setup function and lifecycle events



mkdir mwe

npm init piral-instance -- --target my-app --defaults

npx piral build --type emulator

select .. webpack5

npm init pilet -- --target my-pilet --source ./my-app/dist/emulator/my-app-1.0.0.tgz --defaults

cd my-pilet

npm install piral-hooks-utils

cd my-pilet

npm start

select webpack5


In browser open http://localhost:1234/page

Once the app runs load the inspector and select the network tab,
Filter to WS connections only

You will see the #pilet-api ws connection - expected
as well as one connection to echo.websocket.org - espected, initated by intex.tsx

Make an EDIT in the code, and save, leave browser as it, will reload


Observe what happens, the connections all drop, and unmount, you can see this in the logs HOWEVER
multiple reestablish, one for each previous version, so after one edit you will see three connectsion to echo.websocket

The original one, dropped - not established

Two new ones, one under index.tsx, and other under the updated bundle...




