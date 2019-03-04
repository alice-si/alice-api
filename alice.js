import Request from 'request-promise-native';
import Config from './config/config';
import Logger from './logger';
import MangoPay from 'mangopay-cardregistration-js-kit';

let Alice = {};

/*
    TODO think about:
        - error recording (we have a special endpoint for it)
        - Read about hidden passsword and start implementing
        - Read about webpack server and tests
        - Remove card name from alice-web front side
*/


/*
    -- Donation options --
    type: enum ["Anonymous", "Authorized"],
    email: (string) required if type == "Anonymous"
    projectCode: (string) Code of project you want to donate to
    giftAid: (boolean)
    amount: (number) value in GBP
    cardData: {
        number: '1111222233334444'
        expirationDate: 'MMYY'
        cvc: 'xxx',
        name
    }
*/
Alice.sendDonation = async ({
    type,
    email,
    projectCode,
    giftAid,
    amount,
    cardData
}) => {
    try {
        if (type) {
            // TODO implement Authorized donations
            throw 'We do not support type option yet';
        }

        let projectDetails = await getProjectDetails(projectCode);
        let projectId = projectDetails._id;
        Logger.debug(`Got project id: ${projectId}`);

        let token = await registerEmail(email);
        Logger.debug(`Got token: ${token}`);
        
        let preregistrationCardData = await preRegisterCard(token);
        Logger.debug('Card preregistration completed');

        let registrationCardData = await registerCard(preregistrationCardData, cardData);
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

const getProjectDetails = async (projectCode) => {
    let response = await Request.get(`${Config.API}/getProjectDetails/${projectCode}`);
    return JSON.parse(response);
};

const registerEmail = async (email) => {
    let response = await Request.post(`${Config.API}/registerEmail`, {
        json: {email}
    });
    if (!response.success) {
        throw "Email registering failed";
    }
    return response.token;
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

    await new Promise((resolve, reject) => {
        const timeout = 3000;
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

            if (newWindow) {
                // Checking donation status
                let status = await checkDonationStatus(donationId, token);
                Logger.debug(`Donation status: ${status}`);
                switch (status) {
                    case 'CREATED':
                        return finish(resolve);
                    case 'FAILED':
                        return finish(reject);
                    default:
                        break;
                }
            } else {
                Logger.error('3DS verification failed, user may have disabled pop-ups in settings');
                alert('Unfortunatelly 3DS verification was failed.'
                    + ' Please allow pop-up windows opening for current page in you browser preferences.');
                finish(() => {
                    reject('Window was not opened');
                });
            }
        }, timeout);
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
});
