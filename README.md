# alice-api

### What is it
This is a JS library which could be used to enable Alice donations on a charity website.
To integrate this API to your page please [contact us](mailto:alice@alice.si)

### Usage
- Load script from https://clientapi.alice.si/alice.js to your html page (in head tag)
```html
<script src='https://clientapi.alice.si/alice.js'></script>
```
- Insert the following script to your page (in body tag - in the end)
Don't forget to replace <--YOUR-PROJECT-CODE--> with your real project code!
The following code assumes that you have inputs with corresponding ids (to get payment details)
and DONATE button with id: `donate-button`
```html
<script>
  async function donate() {
    try {
      let email = document.getElementById('email').value;
      let cvc = document.getElementById('cvv').value;
      let expirationDate = document.getElementById('exp-date').value;
      let number = document.getElementById('cc-number').value;
      let amount = parseInt(document.getElementById('amount').value);

      await Alice.sendDonation({
        email,
        type: 'Anonymous',
        projectCode: '<--YOUR-PROJECT-CODE-->',
        amount: amount * 100,
        cardData: {
            number,
            expirationDate,
            cvc
        },
        allowAnonymousDonationsForFullUsers: true
      });
      alert('Successfully donated');
    } catch (err) {
      alert('Donation failed :(');
      console.error(err);
    }
  }
  document.getElementById('donate-button').addEventListener('click', donate, false);
</script>
```

[See minimal example of the implementation](./examples/minimal-example.html)


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


### Potential improvements
- replace request-promise-native as it takes 60% of size after bundling
- describe all exported functions