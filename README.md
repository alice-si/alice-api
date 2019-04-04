# alice-api

### What is it
This is a JS library which could be used to enable Alice donations on a charity website.
To integrate this API to your page please [contact us](mailto:alice@alice.si)

### How to use
- Load script from https://s3.eu-west-2.amazonaws.com/alice-si-api/prod/alice.js to your html page
```html
<script src='https://s3.eu-west-2.amazonaws.com/alice-si-api/prod/alice.js'></script>
```
- Now you should have access to Alice object
```js
// To check avaliable functions
conosole.log(Alice);
```

You can see an example of usage in [examples/example.html](./examples/example.html) or on our [s3 bucket](https://s3.eu-west-2.amazonaws.com/alice-si-api/stage/examples/example.html)


## For Alice developers

### To test this API locally
```bash
npm install
# make sure that alice-web is running on localhost:8080
npm run dev
```
go to [localhost:9000/examples/example.html](http://localhost:9000/examples/example.html)


### Npm tasks
```
npm install # install dependencies
npm run build-<MODE> # build js code (to dist folder) for selected mode (stage, local or prod)
npm run build # build js code (for prod)
npm run dev-<MODE> # run dev server using selected mode (stage, local or prod)
npm run dev # run dev server on localhost:9000 (using stage)
npm run eslint-check # to check js code with eslint
```

### Deploy
To deploy alice-api please use alice-deployment project


### TODOs ¯\\_(ツ)_/¯
- replace request-promise-native as it takes 60% of size after bundling
- describe all exported functions