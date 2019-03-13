# alice-api

### How to use this API - TODO
- Load script from https://s3.eu-west-2.amazonaws.com/alice-si-api/stage/alice.js
- Now you should have access to Alice object

You can see an example of usage in examples/example.html

### To test this API locally
```
npm install
npm run dev
```

### Npm tasks
```
npm install # install dependencies
npm run build-<MODE> # build js code (to dist folder) for selected mode (stage, local or prod)
npm run build # build js code (for prod)
npm run dev-<MODE> # run dev server using selected mode (stage, local or prod)
npm run dev # run dev server on localhost:9000 (using stage)
npm run eslint-check # to check js code with eslint
```

### TODOs ¯\\_(ツ)_/¯
- replace request-promise-native as it takes 60% of size after bundling
- TODO describe Alice.sendDonation
- TODO describe Alice.authenticate
- TODO describe Alice.isAuthenticated
- TODO add and describe Alice.on.successfulAuthentication
- TODO add and describe Alice.on.failedAuthentication