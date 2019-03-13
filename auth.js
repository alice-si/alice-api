import Request from 'request-promise-native';
import RandomString from 'randomstring';
import Config from './config';
import Logger from './logger';
import Alert from './alert';

const stateLength = 10;
const stateKeyForLocalStorage = 'aliceState';
const tokenKeyForLocalStorage = 'aliceToken';


let Auth = {};

Auth.getTokenForDonation = async function ({donationType, email}) {
  let token;
  if (donationType == 'Authorized') {
    Logger.debug('Getting token from local storage');
    token = localStorage.getItem(tokenKeyForLocalStorage);
  } else if (donationType == 'Anonymous') {
    Logger.debug(`Registering simple user with email: ${email}`);
    token = await registerEmail(email);
  } else {
    Logger.error(`Donation type ${donationType} is unknown`);
  }
  
  return token;
}

Auth.authorize = async ({
  clientId, // charityCode
  redirectUri
}) => {
  try {
    const state = generateState();
    Logger.debug(`Generated state: ${state}`);
    localStorage.setItem(stateKeyForLocalStorage, state);
    if (!redirectUri) {
      // by default current url is a redirectUri
      redirectUri = location.href;
    }
    let url = getAuthorizationUrl(state, clientId, redirectUri);
    await processAuthorization(url);
    Logger.debug('Authorization finished');
  } catch (err) {
    if (err) {
      Logger.error(err.toString());
    } else {
      Logger.error('Unknown error occured');
    }
  }
};

Auth.isAuthorized = () => {
  let token = localStorage.getItem(tokenKeyForLocalStorage);
  Logger.debug(`Checking isAuthorized, got token: ${token}`);
  return Boolean(token);
};

// This function is called on opened window
Auth.finishAuthorization = async () => {
  try {
    let urlParams = new URLSearchParams(window.location.search);
    let accessCode = urlParams.get('access_code');
    let stateFromUrl = urlParams.get('state');
    let status = urlParams.get('status');
    let stateFromLocalStorage = localStorage.getItem(stateKeyForLocalStorage);
    
    if (status !== 'SUCCEED') {
      throw `Bad status: ${status}`;
    }
    if (stateFromUrl !== stateFromLocalStorage) {
      throw `States are not equal: ${stateFromUrl} and ${stateFromLocalStorage}`;
    }
    
    Logger.debug(`Getting access token using accessCode: ${accessCode}`);
    let token = await getAccessToken(accessCode);
    Logger.debug(`Received token: ${token}`);

    if (opener) {
      Logger.debug('Transfering token to opener');
      opener.finishAuthorization({token});
    }
  } catch (err) {
    Logger.error('finishAuthorization error');
    Logger.error(err);
    opener.finishAuthorization({err});
  }
};

const processAuthorization = async (url) => {
  let newWindow = window.open(url, '_blank', 'height=570,width=520');

  if (!newWindow) {
    Alert.popupDisabled();
    throw 'Authorization requires windows opening';
  }

  await new Promise((resolve, reject) => {
    // This function (finishAuthorization) is called from popup window on the main window using opener
    // It transfers received access token to the main application window
    window.finishAuthorization = async ({token, err}) => {
      newWindow.close();
      if (err) {
        Logger.error('Authorization failed');
        reject(err);
      } else {
        Logger.debug(`Finishing authorization. Token received: ${token}`);
        localStorage.setItem(tokenKeyForLocalStorage, token);
        resolve();
      }
    };
  });
};

const getAccessToken = async (accessCode) => {
  let result = await Request.post(`${Config.API}/oauth2/getAccessToken`, {
    json: {accessCode}
  });
  return result.token;
};

const registerEmail = async (email) => {
  let response = await Request.post(`${Config.API}/registerEmail`, {
      json: {email}
  });
  if (!response.token) {
      throw "Email registering failed";
  }
  return response.token;
}

const getAuthorizationUrl = (state, clientId, redirectUri) =>
  `${Config.URL}/oauth2?state=${state}&client_id=${clientId}&redirect_uri=${redirectUri}`

const generateState = () => RandomString.generate(stateLength);

export default Auth;
