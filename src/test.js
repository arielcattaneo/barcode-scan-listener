/* eslint-env mocha */
/* global expect:false, given:false */

import {expect} from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import barcodeScanListener from './index';

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
});
