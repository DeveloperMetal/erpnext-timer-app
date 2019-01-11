import { app, Tray, nativeImage } from 'electron';
import EventEmitter from 'events';

export class TrayAnimation extends EventEmitter {
    constructor(frames) {
        super();

        if ( frames ) {
            this.frames = frames;
        } else {
            this.frames = [];
        }
        this.currentFrame = -1;
        this.nextTimeout = null;
    }

    addFrame(image, delay) {
        this.frames.push({
            image,
            delay
        });
    }

    nextFrame() {
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        let frame = this.frames[this.currentFrame];
        if ( !frame.image) {
            frame.image = nativeImage.createFromPath(frame.path);
        }
        this.emit('frame', frame.image);
        this._nextTimeout = setTimeout(() => {
            if ( this.started ) {
                this.nextFrame();
            }
        }, frame.delay)
    }

    start() {
        this.started = true;
        this.currentFrame = -1;
        this.nextFrame();
    }

    stop() {
        this.started = false;
        if ( this._nextTimeout ) {
            clearTimeout(this._nextTimeout);
            this._nextTimeout = null;
        }
    }
}

export class TrayState {
    constructor(tray, mainWindow) {
        this.tray = tray;
        this.mainWindow = mainWindow;
    }

    addIdleImage(image) {
        this.idleImage = image;
    }

    addRunningAnimation(animation) {
        this.runningAnimation = animation;
        this.runningAnimation.on('frame', (image) => {
            if ( image ) {
                this.tray.setImage(image);
                this.mainWindow.setOverlayIcon(image, "Timer Running");
            }
        })
    }

    setIdle() {
        this.runningAnimation.stop();
        this.tray.setImage(this.idleImage);
        this.mainWindow.setOverlayIcon(null, "Timer Stopped");
    }

    setTimerRunning() {
        this.runningAnimation.start();
    }
}