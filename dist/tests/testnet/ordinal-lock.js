"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ordinal_lock_1 = require("../../src/contracts/ordinal-lock");
const txHelper_1 = require("./utils/txHelper");
const scrypt_ts_1 = require("scrypt-ts");
const privateKey_1 = require("../utils/privateKey");
const payScript = scrypt_ts_1.bsv.Script.fromAddress(privateKey_1.myAddress);
// const paySats = 1000n
const payOut = new scrypt_ts_1.bsv.Transaction.Output({
    script: payScript,
    satoshis: 1000,
})
    .toBufferWriter()
    .toBuffer();
async function main() {
    await ordinal_lock_1.OrdinalLock.compile();
    let instance = new ordinal_lock_1.OrdinalLock((0, scrypt_ts_1.Ripemd160)(privateKey_1.myPublicKeyHash.toString('hex')), payOut.toString('hex'));
    await instance.connect((0, txHelper_1.getDefaultSigner)(privateKey_1.myPrivateKey));
    // contract deployment
    let deployTx = await instance.deploy(1);
    console.log('OrdinalLock contract deployed: ', deployTx.id);
    // contract call
    const { tx: cancelTx } = await instance.methods.cancel((sigResps) => (0, scrypt_ts_1.findSig)(sigResps, privateKey_1.myPublicKey), (0, scrypt_ts_1.PubKey)(privateKey_1.myPublicKey.toString()), {
        pubKeyOrAddrToSign: [privateKey_1.myPublicKey],
    });
    console.log('OrdinalLock contract `cancel` called: ', cancelTx.id);
    instance = new ordinal_lock_1.OrdinalLock((0, scrypt_ts_1.Ripemd160)(privateKey_1.myPublicKeyHash.toString('hex')), payOut.toString('hex'));
    await instance.connect((0, txHelper_1.getDefaultSigner)(privateKey_1.myPrivateKey));
    instance.bindTxBuilder('purchase', ordinal_lock_1.OrdinalLock.purchaseTxBuilder);
    // contract deployment
    deployTx = await instance.deploy(1);
    console.log('OrdinalLock contract deployed: ', deployTx.id);
    const selfOutput = (0, scrypt_ts_1.toHex)(new scrypt_ts_1.bsv.Transaction.Output({
        script: new scrypt_ts_1.bsv.Script(privateKey_1.myAddress),
        satoshis: instance.balance,
    })
        .toBufferWriter()
        .toBuffer());
    const trailingOutputs = (0, scrypt_ts_1.toHex)(new scrypt_ts_1.bsv.Transaction.Output({
        script: (0, scrypt_ts_1.buildOpreturnScript)('00'),
        satoshis: instance.balance,
    })
        .toBufferWriter()
        .toBuffer());
    const { tx: callTx, atInputIndex } = await instance.methods.purchase(selfOutput, trailingOutputs, {
        pubKeyOrAddrToSign: [privateKey_1.myPublicKey],
        partiallySigned: true,
        autoPayFee: false,
    });
    const result = callTx.verifyScript(atInputIndex);
    console.log('OrdinalLock contract `purchase` called: ', result);
    const needSatoshiAsFee = callTx.outputAmount + callTx.getEstimateFee() + callTx.inputAmount;
    console.log('needSatoshiAsFee', needSatoshiAsFee);
}
