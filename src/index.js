/* eslint-env browser */

export default {
  /**
   * Listen for scan with specified characteristics
   * @param  {String} scanCharacteristics.barcodePrefix
   * @param  {Number} [scanCharacteristics.scanDuration]
   * @param  {Function} scanHandler - called with the results of the scan
   * @return {Function} remove this listener
   */
  onScan ({barcodePrefix, scanDuration} = {}, scanHandler) {
    if (typeof barcodePrefix !== 'string') {
      throw new TypeError('barcodePrefix must be a string');
    }
    if (scanDuration && typeof scanDuration !== 'number') {
      throw new TypeError('scanDuration must be a number');
    }
    if (typeof scanHandler !== 'function') {
      throw new TypeError('scanHandler must be a function');
    }

    /**
     * SwipeTrack calls this function, if defined, whenever a barcode is scanned
     * within the SwipeTrack browser.  See "SwipeTrack Browser JavaScript Functions" section of
     * SwipeTrack API: http://swipetrack.net/support/faq/pdf/SwipeTrack%20API%20(v5.0.0).pdf
    */
    if (typeof window.onScanAppBarCodeData !== 'function') {
      window.onScanAppBarCodeData = function (barcode) {
        window.onScanAppBarCodeData.scanHandlers.forEach((handler) => handler(barcode));
        return true;
      };
      window.onScanAppBarCodeData.scanHandlers = [];
    }
    const swipeTrackHandler = function (barcode) {
      if (barcode.match(`^${barcodePrefix}`) !== null)
        scanHandler(barcode.slice(barcodePrefix.length));
    };
    window.onScanAppBarCodeData.scanHandlers.push(swipeTrackHandler);

    scanDuration = scanDuration || 50;
    let isScanning = false;
    let codeBuffer = '';
    let scannedPrefix = '';
    const finishScan = function () {
      if (codeBuffer) {
        scanHandler(codeBuffer);
      }
      scannedPrefix = '';
      codeBuffer = '';
      isScanning = false;
    };
    const keypressHandler = function (e) {
      const char = String.fromCharCode(e.which);
      const charIndex = barcodePrefix.indexOf(char);
      const expectedPrefix = barcodePrefix.slice(0, charIndex);
      if (!isScanning) {
        isScanning = true;
        setTimeout(finishScan, scanDuration);
      }
      if (scannedPrefix === barcodePrefix && /[^\s]/.test(char)) {
        codeBuffer += char;
      } else if (scannedPrefix === expectedPrefix && char === barcodePrefix.charAt(charIndex)) {
        scannedPrefix += char;
      }
    };
    const removeListener = function () {
      document.removeEventListener('keypress', keypressHandler);
      const swipeTrackHandlerIndex = window.onScanAppBarCodeData.scanHandlers.indexOf(swipeTrackHandler);
      if (swipeTrackHandlerIndex >= 0)
        window.onScanAppBarCodeData.scanHandlers.splice(swipeTrackHandlerIndex, 1);
    };
    document.addEventListener('keypress', keypressHandler);
    return removeListener;
  },
};
