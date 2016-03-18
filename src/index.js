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
    }
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
    }
    const removeListener = function () {
      document.removeEventListener('keypress', keypressHandler);
    }
    document.addEventListener('keypress', keypressHandler);
    return removeListener;
  }
}
