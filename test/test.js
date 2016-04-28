/* eslint-env goodeggs/server-side-test */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import _ from 'lodash';
import sinon from 'sinon';

import barcodeScanListener from '../build';

chai.use(sinonChai);
const expect = chai.expect;

const scanBarcode = function (barcode) {
  const clock = sinon.useFakeTimers();
  const triggerKeypressEvent = function (char) {
    const event = new Event('keypress');
    event.which = char.charCodeAt(0);
    document.dispatchEvent(event);
  };
  barcode.split('').forEach(triggerKeypressEvent);
  clock.tick(100);
};

describe('barcodeScanListener.onScan()', function () {
  it('errors if no barcode prefix', function () {
    const createOnScan = () => barcodeScanListener.onScan({}, sinon.stub());
    expect(createOnScan).to.throw('barcodePrefix must be a string');
  });

  it('errors if callback not a function', function () {
    const createOnScan = () => barcodeScanListener.onScan({barcodePrefix: 'L%'}, 5);
    expect(createOnScan).to.throw('scanHandler must be a function');
  });

  it('errors if scan duration not a number', function () {
    const createOnScan = () => barcodeScanListener.onScan({
      barcodePrefix: 'L%',
      scanDuration: '500'
    }, sinon.stub());
    expect(createOnScan).to.throw('scanDuration must be a number');
  });

  it('calls handler for scanned barcode with prefix', function () {
    const scanHandler = sinon.stub()
    barcodeScanListener.onScan({barcodePrefix: 'L%'}, scanHandler);
    scanBarcode('L%123abc')
    expect(scanHandler).to.have.been.calledOnce
    expect(scanHandler).to.have.been.calledWith('123abc')
  });

  it('does not call handler if barcode does not match prefix', function () {
    const scanHandler = sinon.stub()
    barcodeScanListener.onScan({barcodePrefix: 'L%'}, scanHandler);
    scanBarcode('C%123abc')
    expect(scanHandler).not.to.have.been.called
  });

  it('does not call handler if scan not finished within scan duration', function () {
    const scanHandler = sinon.stub()
    barcodeScanListener.onScan({
      barcodePrefix: 'L%',
      scanDuration: 25
    }, scanHandler);
    scanBarcode('C%123abc')
    expect(scanHandler).not.to.have.been.called
  });

  it('removes the listener', function () {
    const scanHandler = sinon.stub()
    const removeListener = barcodeScanListener.onScan({barcodePrefix: 'L%'}, scanHandler);
    scanBarcode('L%123abc')
    expect(scanHandler).to.have.been.calledOnce
    expect(scanHandler).to.have.been.calledWith('123abc')
    scanHandler.reset()
    removeListener()
    scanBarcode('L%123abc')
    expect(scanHandler).not.to.have.been.called
  });

  describe('SwipeTrack adapter', function () {
    it('does not call through to scanHandler if prefix does not match', function () {
      const scanHandler = sinon.stub()
      barcodeScanListener.onScan({barcodePrefix: 'L%'}, scanHandler);
      window.onScanAppBarCodeData('S%123abc')
      expect(scanHandler).not.to.have.been.called
    });

    it('calls through to scanHandler if prefix matches', function () {
      const scanHandler = sinon.stub()
      barcodeScanListener.onScan({barcodePrefix: 'L%'}, scanHandler);
      window.onScanAppBarCodeData('L%123abc')
      expect(scanHandler).to.have.been.calledOnce
      expect(scanHandler).to.have.been.calledWith('123abc')
    });

    it('works with multiple listeners', function () {
      const lotScanHandler = sinon.stub()
      barcodeScanListener.onScan({barcodePrefix: 'L%'}, lotScanHandler);

      const sheepScanHandler = sinon.stub()
      barcodeScanListener.onScan({barcodePrefix: 'S%'}, sheepScanHandler);

      window.onScanAppBarCodeData('L%mylot')
      window.onScanAppBarCodeData('S%mysheep')

      expect(lotScanHandler).to.have.been.calledOnce
      expect(lotScanHandler).to.have.been.calledWith('mylot')

      expect(sheepScanHandler).to.have.been.calledOnce
      expect(sheepScanHandler).to.have.been.calledWith('mysheep')
    });

    it('removes the listener on remove', function () {
      const lotScanHandler = sinon.stub()
      const removeListener = barcodeScanListener.onScan({barcodePrefix: 'L%'}, lotScanHandler);

      const sheepScanHandler = sinon.stub()
      barcodeScanListener.onScan({barcodePrefix: 'S%'}, sheepScanHandler);

      removeListener()

      window.onScanAppBarCodeData('S%123abc')
      expect(sheepScanHandler).to.have.been.calledOnce

      window.onScanAppBarCodeData('L%123abc')
      expect(lotScanHandler).not.to.have.been.called
    });
  });
});
