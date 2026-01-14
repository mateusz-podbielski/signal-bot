

# SignalBotBackend

This project was generated using [Nx](https://nx.dev).

## Adding capabilities to your workspace

Nx supports many plugins which add capabilities for developing different types of applications and different tools.
These capabilities include generating applications, libraries, etc as well as the devtools to test, and build projects as well.

- [Express](https://expressjs.com)
  - `npm install --save-dev @nrwl/express`
- [Node](https://nodejs.org)
  - `npm install --save-dev @nrwl/node`

There are also many [community plugins](https://nx.dev/nx-community) you could add.

## Generate an application

Run `nx g @nrwl/express:app my-app` to generate an application.

Run `nx g @nrwl/express:lib my-lib` to generate an library.

When using Nx, you can create multiple applications and libraries in the same workspace.
Libraries are shareable across libraries and applications. They can be imported from `@signalbot-backend/mylib`.

## How to build and run the SignalBot backend application
To build and run the application the docker images are used.

1. Run `npm install` to install all dependencies
2. Run `./docker-build.sh` script to start building the apps docker images.
3. Go to signalbot-system project and run `docker-compose up` - it will build SignalBot environment.
   
Please remember about all settings located in .env file in signalbot-system root.
