import request from 'request-promise-native';

// TODO maybe we will move it to other module
// const API = 'https://api.donationsapp.alice.si/api/';
const API = 'http://localhost:8080/api/';

let Alice = {};

Alice.sendAnonymousDonation = async (amount, email) => {
    // TODO
};

Alice.registerEmail = async (email) => {
    try {
        let response = await request.post(API + 'registerEmail', {
            json: {email}
        });
        console.log('Email was registered successfully');
        console.log(response);
    } catch (err) {
        console.error(err);
    }
};

// Test
Alice.registerEmail(`asdasdasd${Date.now()}@mail.ru`);

export default Alice;