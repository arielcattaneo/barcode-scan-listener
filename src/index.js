/* eslint-env browser */

export default {
  /**
   * Listen for scan with specified characteristics
   * @param  {String} scanOptions.barcodePrefix
   * @param  {RegExp} scanOptions.barcodeValueTest - RegExp defining valid scan value (not including prefix).
   * @param  {Boolean} [scanOptions.finishScanOnMatch] - if true, test scan value (not including prefix)
   *   match with barcodeValueTest on each character. If matched, immediately
   *   call the scanHandler with the value. This will generally make scans faster.
   * @param  {Number} [scanOptions.scanDuration] - time allowed to complete the scan.
   * @param  {Function} scanHandler - called with the results of the scan
   * @return {Function} remove this listener
   */
  onScan ({barcodePrefix, barcodeValueTest, finishScanOnMatch, scanDuration} = {}, scanHandler) {
    if (typeof barcodePrefix !== 'string') {
      throw new TypeError('barcodePrefix must be a string');
    }
    if (typeof barcodeValueTest !== 'object' || typeof barcodeValueTest.test !== 'function') {
      throw new TypeError('barcodeValueTest must be a regular expression');
    }
    if (finishScanOnMatch != null && typeof finishScanOnMatch !== 'boolean') { // eslint-disable-line no-eq-null
      throw new TypeError('finishScanOnMatch must be a boolean');
    }
    if (scanDuration && typeof scanDuration !== 'number') {
      throw new TypeError('scanDuration must be a number');
    }
    if (typeof scanHandler !== 'function') {
      throw new TypeError('scanHandler must be a function');
    }

    scanDuration = scanDuration || 50;
    let finishScanTimeoutId = null;
    let codeBuffer = '';
    let scannedPrefix = '';
    const finishScan = function () {
      if (codeBuffer && barcodeValueTest.test(codeBuffer)) {
        scanHandler(codeBuffer);
      }
      resetScanState();
    };
    const resetScanState = function () {
      scannedPrefix = '';
      codeBuffer = '';
    };
    const keypressHandler = function (e) {
      const char = String.fromCharCode(e.which);
      const charIndex = barcodePrefix.indexOf(char);
      const expectedPrefix = barcodePrefix.slice(0, charIndex);
      if (!finishScanTimeoutId) {
        finishScanTimeoutId = setTimeout(finishScan, scanDuration);
      }
      if (scannedPrefix === barcodePrefix && /[^\s]/.test(char)) {
        codeBuffer += char;
        if (finishScanOnMatch && barcodeValueTest.test(codeBuffer)) {
          clearTimeout(finishScanTimeoutId);
          finishScan();
        }
      } else if (scannedPrefix === expectedPrefix && char === barcodePrefix.charAt(charIndex)) {
        scannedPrefix += char;
      }
    };
    const removeListener = function () {
      document.removeEventListener('keypress', keypressHandler);
    };
    document.addEventListener('keypress', keypressHandler);
    return removeListener;
  },
};
