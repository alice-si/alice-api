import Request from 'request-promise-native';
import Logger from './logger';
import MangoPay from 'mangopay-cardregistration-js-kit';
import Auth from './auth';
import Alert from './alert';
import Config from './config';

let Alice = {};

Alice.sendDonation = async ({
    type, // enum: ['Authenticated', 'Anonymous']
    email, // required for anonymous donations
    projectCode,
    giftAid,
    amount, // in pences
    cardData: {
        number, // e.g. 1111222233334444
        expirationDate, // MMYY e.g. 1020
        cvc // e.g 123
    }
}) => {
    try {
        if (type === 'Authenticated' && !Auth.isAuthenticated()) {
            throw 'Failed trying to make authenticated donation. There is no token in local storage.';
        }
        if (type === 'Anonymous' && !email) {
            throw 'Email param is required to make donations without registration.';
        }
        if (!['Authenticated', 'Anonymous'].includes(type)) {
            throw `Donation type: ${type} is unsupported`;
        }

        let projectDetails = await getProjectDetails(projectCode);
        let projectId = projectDetails._id;
        Logger.debug(`Got project id: ${projectId}`);

        let token = await Auth.getTokenForDonation({
            donationType: type,
            email
        });
        Logger.debug(`Got token: ${token}`);
        
        let preregistrationCardData = await preRegisterCard(token);
        Logger.debug('Card preregistration completed');

        let registrationCardData = await registerCard(preregistrationCardData, {
            number,
            expirationDate,
            cvc
        });
        Logger.debug('Card registration completed');
    
        let sentDonation = await sendDonationInternal({
            amount,
            giftAid,
            projectId,
            type: 'CARD', // currently alice-api supports only donations by card
            cardId: registrationCardData.CardId
        }, token);

        if (sentDonation.secureModeNeeded) {
            Logger.debug(`Secure mode needed - processing 3DS with url: ${sentDonation.redirectUrl}`);
            await process3DS(sentDonation.redirectUrl, sentDonation.donation._id, token);
            Logger.debug('3DS processing finished');
        }

        Logger.debug('Donation was sent successfully!');
    } catch (err) {
        if (err) {
            Logger.error(err.toString());
        } else {
            Logger.error('Unknown error occured');
        }
    }
};

Alice.authenticate = Auth.authenticate;
Alice.isAuthenticated = Auth.isAuthenticated;

const getProjectDetails = async (projectCode) => {
    let response = await Request.get(`${Config.API}/getProjectDetails/${projectCode}`);
    return JSON.parse(response);
};

const preRegisterCard = async (token) => {
    let response = await Request.get({
        url: `${Config.API}/preRegisterCard`,
        headers: {
            Authorization: token
        }
    });
    return JSON.parse(response);
};

const registerCard = async (preregistrationData, cardData) => {
    // Set MANGOPAY API base URL and Client ID
    MangoPay.cardRegistration.baseURL = Config.MANGO.url;
    MangoPay.cardRegistration.clientId = Config.MANGO.clientId;

    MangoPay.cardRegistration.init({
        cardRegistrationURL: preregistrationData.CardRegistrationURL,
        preregistrationData: preregistrationData.PreregistrationData,
        accessKey: preregistrationData.AccessKey,
        Id: preregistrationData.Id
    });

    let getRegistrationPromise = () => new Promise((resolve, reject) => {
        MangoPay.cardRegistration.registerCard({
            userId: preregistrationData.userId,
            cardType: 'CB_VISA_MASTERCARD',
            cardNumber: cardData.number,
            cardExpirationDate: cardData.expirationDate,
            cardCvx: cardData.cvc
        }, resolve, reject);
    });

    return await getRegistrationPromise();
};

const sendDonationInternal = async (donation, token) => {
    let response = await Request.post({
        url: `${Config.API}/sendDonation`,
        headers: {
            Authorization: token
        },
        json: donation
    });
    return response;
};

const process3DS = async (url, donationId, token) => {
    let newWindow = window.open(url, '_blank', 'height=570,width=520');
    let popupAlertWasAlreadyShown = false;
    const startTime3DS = Date.now();

    await new Promise((resolve, reject) => {
        // Waiting until 3DS verification is finished
        // https://stackoverflow.com/questions/9388380/capture-the-close-event-of-popup-window-in-javascript
        let timer = setInterval(async () => {
            const finish = (cb) => {
                clearInterval(timer);
                if (newWindow) {
                    newWindow.close();
                }
                cb();
            };

            // Checking donation status
            let status = await checkDonationStatus(donationId, token);
            Logger.debug(`Donation status: ${status}`);
            if (status == 'FAILED') {
                Logger.error('Donation failed');
                return finish(reject);
            } else if (status != '3DS') {
                finish(resolve);
            }

            if (!newWindow) {
                if (!popupAlertWasAlreadyShown) {
                    Logger.info('Popup can\'t be opened');
                    popupAlertWasAlreadyShown = true;
                    Alert.popupDisabled();
                }
            }

            if (Date.now() > Config.timeout3DS + startTime3DS) {
                finish(reject);
            }
        }, Config.defaultTimeout);
    });
};

const checkDonationStatus = async (donationId, token) => {
    let response = await Request.get({
        url: `${Config.API}/checkDonationStatus/${donationId}`,
        headers: {
            Authorization: token
        }
    });
    return (JSON.parse(response)).status;
};

window.addEventListener("load", () => {
    window.Alice = Alice;
    Logger.debug('Alice API was loaded');

    // Finishing authentication (sending received access code back to opener)
    if (opener && location.href.includes('access_code')) {
        Auth.finishAuthentication();
    }
});
