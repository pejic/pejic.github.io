/* exported onBuyClicked */

/**
 * Launches payment request for SPC.
 */
async function onBuyClicked() {
  try {
    const request = await createSPCPaymentRequest({
      credentialIds: [Uint8Array.from(
          atob(window.localStorage.getItem('no_credential_identifier')),
          c => c.charCodeAt(0))],
    });

    const result = await request.canMakePayment();
    info(result ? "Can make payment" : "Cannot make payment");
    // We don't mind if this fails.
    try {
      const hEI = await request.hasEnrolledInstrument();
      info(hEI ? "Has enrolled instrument" : "No enrolled instrument");
    } catch (err) {
      error("Has enrolled instrument FAILED - " + err);
    }

    const instrumentResponse = await request.show();
    await instrumentResponse.complete('success')
    info(JSON.stringify(instrumentResponse, undefined, 2));
  } catch (err) {
    error(err);
  }
}
