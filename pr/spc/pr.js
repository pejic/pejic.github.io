/* exported createPaymentCredential */
/* exported onBuyClicked */

/**
 * Creates a payment credential.
 */
async function createPaymentCredential(windowLocalStorageIdentifier) {
  try {
    const publicKeyCredential = await createCredential(/*setPaymentExtension=*/true);
    console.log(publicKeyCredential);
    window.localStorage.setItem(windowLocalStorageIdentifier,
      arrayBufferToBase64(publicKeyCredential.rawId));
    info(windowLocalStorageIdentifier + ' enrolled: ' + objectToString(
      publicKeyCredential) + '\n' + 'Extensions: ' +
      extensionsOutputToString(publicKeyCredential));
  } catch (err) {
    error(err);
  }
}

/**
 * Launches payment request for SPC.
 */
async function onBuyClicked(windowLocalStorageIdentifier) {
  try {
    const request = await createSPCPaymentRequest({
      credentialIds: [base64ToArray(window.localStorage.getItem(windowLocalStorageIdentifier))],
    });

    try {
      const canMakePayment = await request.canMakePayment();
      info(`canMakePayment result: ${canMakePayment}`);
    } catch (err) {
      error(`Error from canMakePayment: ${error.message}`);
    }

    const instrumentResponse = await request.show();
    await instrumentResponse.complete('success')
    console.log(instrumentResponse);
    info(windowLocalStorageIdentifier + ' payment response: ' +
      objectToString(instrumentResponse) + '\n' + 'Extensions: ' +
      extensionsOutputToString(instrumentResponse.details));
  } catch (err) {
    error(err);
  }
}

async function webAuthnGet(windowLocalStorageIdentifier) {
  try {
    const publicKey = {
      challenge: new TextEncoder().encode('Authentication challenge'),
      userVerification: 'required',
      allowCredentials: [{
        transports: ['internal'],
        type: 'public-key',
        id: base64ToArray(window.localStorage.getItem(
          windowLocalStorageIdentifier)),
      }, ],
    };
    const credentialInfoAssertion = await navigator.credentials.get({
      publicKey
    });
    console.log(credentialInfoAssertion);
    info('Successful login with ' + windowLocalStorageIdentifier + ': ' +
      objectToString(credentialInfoAssertion));
  } catch (err) {
    error(err);
  }
}

if (PublicKeyCredential) {
  if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => {
        info(`isUserVerifyingPlatformAuthenticatorAvailable: ${available}`);
      }).catch((error) => {
        error(`Error when calling isUserVerifyingPlatformAuthenticatorAvailable: ${error.message}`);
      });
  } else {
    error('PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable method not detected');
  }
} else {
  error('PublicKeyCredential interface not detected');
}

function extensionsOutputToString(credentialInfoAssertion) {
  const clientExtensionResults =
      credentialInfoAssertion.getClientExtensionResults();
  if (clientExtensionResults.payment !== undefined &&
      clientExtensionResults.payment.browser_bound_signature !== undefined) {
      var browser_bound_signature = clientExtensionResults.payment.browser_bound_signature;
      browser_bound_signature.signature_output =
          arrayBufferToBase64(browser_bound_signature.signature_output);
  }
  // Decode sequences of browser bound signatures (which were output by early prototypes).
  if (clientExtensionResults.payment !== undefined &&
      clientExtensionResults.payment.browser_bound_signatures !== undefined) {
    for (sig of clientExtensionResults.payment.browser_bound_signatures) {
      if (sig.signature_output !== undefined) {
        sig.signature_output = arrayBufferToBase64(sig.signature_output);
      }
    }
  }
  return JSON.stringify(clientExtensionResults, /*replacer=*/ undefined, /*space=*/ 2);
}

