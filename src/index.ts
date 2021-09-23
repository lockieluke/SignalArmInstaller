import * as https from 'https';
import * as fs from 'fs-extra';
import * as path from 'path';
import consola from 'consola';
import cliProgress from 'cli-progress';
import extractDmg from 'extract-dmg';
import open from 'open';
import alert from 'alert';

const signalArm64: string = "https://signal.dennisameling.com/dl/signal-desktop-unofficial-mac-5.17.2-arm64.dmg";
const downloadLocation: string = path.join(process.env["HOME"] || '~', 'Desktop', 'Signal-arm64.dmg');
const installationLocation: string = path.join(path.dirname(downloadLocation), 'Signal Installation');

if (process.platform !== 'darwin' && process.arch != 'arm64') {
    consola.error("Platform not supported");
}

const installSignal = () => {
    consola.info("Extracting Signal...");
    extractDmg(downloadLocation, installationLocation).then(files => {
        fs.removeSync(path.join(installationLocation, 'Applications'));
        consola.info("Finished Extracting Signal...");

        const signalLocation: string = path.join('/Applications', 'Signal.app');
        const signalArmSrc: string = path.join(installationLocation, 'Signal Unofficial.app')
        const intelSignalBackupLocation: string = path.join(path.dirname(downloadLocation), 'Signal Installation', 'Backup', 'Signal.app');
        if (fs.existsSync(signalLocation)) {
            if (!fs.existsSync(path.dirname(signalLocation)))
                fs.mkdirSync(path.dirname(signalLocation));
            consola.info("Preparing to install Signal arm64 - backup Intel app before installation...");
            fs.copySync(signalLocation, intelSignalBackupLocation);
            consola.info("Finished backing up Intel app");
        }

        consola.info("Installing Signal arm64...");
        fs.removeSync(signalLocation);
        fs.copySync(signalArmSrc, signalLocation);
        consola.info("Restoring previous chat histories...");
        const oldSignalChats: string = path.join(process.env['HOME'] || '~', 'Library', 'Signal');
        const newSignalChats: string = path.join(process.env['HOME'] || '~', 'Library', 'Signal Unofficial');
        fs.moveSync(oldSignalChats, newSignalChats);
        consola.info("Signal chats restored...");
        open(signalLocation);
        consola.info("Cleaning up...");
        fs.rmSync(downloadLocation);
        const finishedMsg: string = "Finished installing Signal arm64 - Thanks for using Signal Installer!  The backup file is in the Signal Installation folder on your desktop.";
        consola.info(finishedMsg);
        alert(finishedMsg);
        process.exit(0);
    })
}

if (!fs.existsSync(downloadLocation)) {
    const signalZip = fs.createWriteStream(downloadLocation);
    const downloadProgressBar = new cliProgress.SingleBar({
        clearOnComplete: true,
        stopOnComplete: true,
        align: 'center',
        autopadding: true
    }, cliProgress.Presets.shades_classic);
    https.get(signalArm64, response => {
        const total: number = parseInt(response.headers['content-length'] || '0', 10) / 1048576;
        let received: number = 0;
        let percentage: number = 0;
        consola.info("Downloading Signal...");
        downloadProgressBar.start(100, 0);
        response.on('data', chunk => {
            received += parseInt(chunk.length, 10) / 1048576;
            const currentPercentage: number = Math.round((received / total) * 100);
            if (percentage != currentPercentage) {
                percentage = currentPercentage;
                downloadProgressBar.update(percentage);
            }
        })
        signalZip.once('finish', () => {
            signalZip.close();
            downloadProgressBar.stop();
            consola.info("Finished downloading Signal");
            installSignal();
        })
        response.pipe(signalZip);
    }).on('error', err => {
        fs.unlinkSync(downloadLocation);
        downloadProgressBar.stop();
        if (err) consola.error(err);
    })
} else {
    installSignal();
}