/* eslint-env goodeggs/server-side-test */
/* eslint-env browser */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';

import barcodeScanListener from '../build';

chai.use(sinonChai);
chai.use(dirtyChai);
const expect = chai.expect;

const scanBarcode = function (barcode, {scanDuration} = {scanDuration: 100}) {
  const clock = sinon.useFakeTimers();
  const triggerKeypressEvent = function (char) {
    const event = new Event('keypress');
    event.which = char.charCodeAt(0);
    document.dispatchEvent(event);
  };
  barcode.split('').forEach(triggerKeypressEvent);
  clock.tick(scanDuration);
};

describe('barcodeScanListener.onScan()', function () {
  describe('validation', function () {
    it('errors if no barcode prefix', function () {
      const createOnScan = () => barcodeScanListener.onScan({}, sinon.stub());
      expect(createOnScan).to.throw('barcodePrefix must be a string');
    });

    it('errors if barcodeValueTest is not a RegExp', function () {
      const createOnScan = () => barcodeScanListener.onScan({barcodePrefix: 'L%', barcodeValueTest: {}}, sinon.stub());
      expect(createOnScan).to.throw('barcodeValueTest must be a regular expression');
    });

    it('errors if finishScanOnMatch is not a boolean', function () {
      const createOnScan = () => barcodeScanListener.onScan({barcodePrefix: 'L%', barcodeValueTest: /.*/, finishScanOnMatch: 3}, sinon.stub());
      expect(createOnScan).to.throw('finishScanOnMatch must be a boolean');
    });

    it('errors if barcodeValueTest is not a RegExp', function () {
      const createOnScan = () => barcodeScanListener.onScan({barcodePrefix: 'L%', barcodeValueTest: {}}, sinon.stub());
      expect(createOnScan).to.throw('barcodeValueTest must be a regular expression');
    });

    it('errors if callback not a function', function () {
      const createOnScan = () => barcodeScanListener.onScan({barcodePrefix: 'L%', barcodeValueTest: /.*/}, 5);
      expect(createOnScan).to.throw('scanHandler must be a function');
    });

    it('errors if scan duration not a number', function () {
      const createOnScan = () => barcodeScanListener.onScan({
        barcodePrefix: 'L%',
        barcodeValueTest: /.*/,
        scanDuration: '500',
      }, sinon.stub());
      expect(createOnScan).to.throw('scanDuration must be a number');
    });
  });

  describe('barcodePrefix', function () {
    it('calls handler for scanned barcode with prefix', function () {
      const scanHandler = sinon.stub();
      barcodeScanListener.onScan({
        barcodePrefix: 'L%',
        barcodeValueTest: /.*/,
      }, scanHandler);
      scanBarcode('L%123abc');
      expect(scanHandler).to.have.been.calledOnce();
      expect(scanHandler).to.have.been.calledWith('123abc');
    });

    it('does not call handler if barcode does not match prefix', function () {
      const scanHandler = sinon.stub();
      barcodeScanListener.onScan({
        barcodePrefix: 'L%',
        barcodeValueTest: /.*/,
      }, scanHandler);
      scanBarcode('C%123abc');
      expect(scanHandler).not.to.have.been.called();
    });
  });

  describe('barcodeValueTest', function () {
    it('calls handler for scanned barcode passes test', function () {
      const scanHandler = sinon.stub();
      barcodeScanListener.onScan({
        barcodePrefix: 'L%',
        barcodeValueTest: /^123.*/,
      }, scanHandler);
      scanBarcode('L%123abc');
      expect(scanHandler).to.have.been.calledOnce();
      expect(scanHandler).to.have.been.calledWith('123abc');
    });

    it('does not call handler if barcode does not pass test', function () {
      const scanHandler = sinon.stub();
      barcodeScanListener.onScan({
        barcodePrefix: 'L%',
        barcodeValueTest: /^123.*/,
      }, scanHandler);
      scanBarcode('C%213abc');
      expect(scanHandler).not.to.have.been.called();
    });
  });

  describe('finishScanOnMatch', function () {
    it('calls handler immediately if scanned barcode passes test', function () {
      const scanHandler = sinon.stub();
      barcodeScanListener.onScan({
        barcodePrefix: 'L%',
        barcodeValueTest: /^123.*/,
        finishScanOnMatch: true,
      }, scanHandler);
      scanBarcode('L%123blabla', {scanDuration: 10});
      expect(scanHandler).to.have.been.calledOnce();
      expect(scanHandler).to.have.been.calledWith('123');
    });
  });

  describe('scanDuration', function () {
    it('does not call handler if scan not finished within scan duration', function () {
      const scanHandler = sinon.stub();
      barcodeScanListener.onScan({
        barcodePrefix: 'L%',
        barcodeValueTest: /.*/,
        scanDuration: 25,
      }, scanHandler);
      scanBarcode('C%123abc');
      expect(scanHandler).not.to.have.been.called();
    });
  });

  it('removes the listener', function () {
    const scanHandler = sinon.stub();
    const removeListener = barcodeScanListener.onScan({
      barcodePrefix: 'L%',
      barcodeValueTest: /.*/,
    }, scanHandler);
    scanBarcode('L%123abc');
    expect(scanHandler).to.have.been.calledOnce();
    expect(scanHandler).to.have.been.calledWith('123abc');
    scanHandler.reset();
    removeListener();
    scanBarcode('L%123abc');
    expect(scanHandler).not.to.have.been.called();
  });
});
