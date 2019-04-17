import Request from 'request-promise-native';
import RandomString from 'randomstring';
import Config from './config';
import Logger from './logger';
import Alert from './alert';
import Errors from './errors';

const stateLength = 10;
const stateKeyForLocalStorage = 'aliceState';
const tokenKeyForLocalStorage = 'aliceToken';


let Auth = {};

Auth.getTokenForDonation = async function ({
  donationType,
  email,
  allowAnonymousDonationsForFullUsers
}) {
  let token;
  if (donationType == 'Authenticated') {
    Logger.debug('Getting token from local storage');
    token = localStorage.getItem(tokenKeyForLocalStorage);
  } else if (donationType == 'Anonymous') {
    if (allowAnonymousDonationsForFullUsers) {
      Logger.debug(`Getting token for email: ${email}`);
      token = await getDonationTokenForEmail(email);
    } else {
      Logger.debug(`Registering simple user with email: ${email}`);
      token = await registerEmail(email);
    }
  } else {
    Logger.error(`Donation type ${donationType} is unknown`);
  }
  
  return token;
}

Auth.authenticate = async ({
  clientId, // charityId
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
    let url = getAuthenticationUrl(state, clientId, redirectUri);
    await processAuthentication(url);
    Logger.debug('Authentication finished');
  } catch (err) {
    if (err) {
      Logger.error(err.toString());
    } else {
      Logger.error('Unknown error occured');
    }
  }
};

Auth.isAuthenticated = () => {
  let token = localStorage.getItem(tokenKeyForLocalStorage);
  Logger.debug(`Checking isAuthenticated, got token: ${token}`);
  return Boolean(token);
};

// This function is called on opened window
Auth.finishAuthentication = async () => {
  try {
    let urlParams = new URLSearchParams(window.location.search);
    let accessCode = urlParams.get('access_code');
    let stateFromUrl = urlParams.get('state');
    let status = urlParams.get('status');
    let err = urlParams.get('err');
    let stateFromLocalStorage = localStorage.getItem(stateKeyForLocalStorage);
    
    if (status !== 'SUCCEED') {
      throw `Bad status: ${status}. Err: ${err}`;
    }
    if (stateFromUrl !== stateFromLocalStorage) {
      throw `States are not equal: ${stateFromUrl} and ${stateFromLocalStorage}`;
    }
    
    Logger.debug(`Getting access token using accessCode: ${accessCode}`);
    let token = await getAccessToken(accessCode);
    Logger.debug(`Received token: ${token}`);

    if (opener) {
      Logger.debug('Transfering token to opener');
      opener.finishAuthentication({token});
    }
  } catch (err) {
    Logger.error('finishAuthentication error');
    Logger.error(err);
    opener.finishAuthentication({err});
  }
};

const processAuthentication = async (url) => {
  let newWindow = window.open(url, '_blank', 'height=570,width=520');

  if (!newWindow) {
    Alert.popupDisabled();
    throw Errors.windowsOpeningRequired;
  }

  await new Promise((resolve, reject) => {
    // This function (finishAuthentication) is called from popup window on the main window using opener
    // It transfers received access token to the main application window
    window.finishAuthentication = async ({token, err}) => {
      newWindow.close();
      if (err) {
        Logger.error('Authentication failed');
        reject(err);
      } else {
        Logger.debug(`Finishing authentication. Token received: ${token}`);
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
  try {
    let response = await Request.post(`${Config.API}/registerEmail`, {
      json: {email}
    });
    if (!response.token) {
      throw Errors.emailRegisteringFailed;
    }
    return response.token;
  } catch (err) {
    if (err.statusCode == Config.emailRequiresAuthStatusCode) {
      Logger.error('Passed email requires authentication');
      throw Errors.authenticationRequired;
    }
    throw err;
  }
}

const getDonationTokenForEmail = async (email) => {
  let response = await Request.post(`${Config.API}/getTokenForAnonymousDonation`, {
    json: {email}
  });
  if (!response.token) {
    throw Errors.tokenGettingFailed;
  }
  return response.token;
}

const getAuthenticationUrl = (state, clientId, redirectUri) =>
  `${Config.URL}/oauth2?state=${state}&client_id=${clientId}&redirect_uri=${redirectUri}`

const generateState = () => RandomString.generate(stateLength);

export default Auth;
