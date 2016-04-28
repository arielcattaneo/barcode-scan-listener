# Barcode Scan Listener

Listen for barcode scan events in the browser.

## Usage
```
npm i barcode-scan-listener --save
```

```js
import barcodeScanListener from 'barcode-scan-listener';

const removeScanListener = barcodeScanListener.onScan({
  barcodePrefix: 'L%',
  scanDuration: 500
}, function (barcode) {
  console.log(barcode);
});

// Now, scanning a barcode 'L%123abc' will log '123abc'

removeScanListener()
```

#### `barcodeLength`
If your barcodes have a known, fixed length, eliminate partial scans and double scans
by passng in `barcodeLength` - your callback will only be called if `barcodeLength`
number of characters are reached, and any characters read past that length before
`scanDuration` is reached will be ignored.

```js
barcodeScanListener.onScan({
  barcodePrefix: 'L%',
  barcodeLength: 24,
  scanDuration: 500
}, function (barcode) {
  console.log(barcode);
});
```

## Contributing

This module is written in ES2015 and converted to node-friendly CommonJS via
[Babel](http://babeljs.io/).

To compile the `src` directory to `build`:

```
npm run build
```

## Deploying a new version

```
npm version [major|minor|patch]
npm run build
npm publish build # publish the build directory instead of the main directory
git push --follow-tags # update github
```
