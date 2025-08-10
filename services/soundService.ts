
import { SoundName } from '../types';

class SoundService {
    private audioContext: AudioContext | null = null;

    private initializeAudioContext() {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
            }
        }
    }

    private playTone(frequency: number, type: OscillatorType, duration: number = 0.15) {
        this.initializeAudioContext();
        if (!this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    public play(soundName: SoundName) {
        switch (soundName) {
            case 'chime':
                this.playTone(880, 'sine', 0.2);
                setTimeout(() => this.playTone(1046.5, 'sine', 0.2), 100);
                break;
            case 'notify':
                this.playTone(523.25, 'triangle', 0.15);
                break;
            case 'success':
                this.playTone(659.25, 'sine', 0.1);
                 setTimeout(() => this.playTone(880, 'sine', 0.15), 120);
                break;
            case 'buzz':
                this.playTone(110, 'sawtooth', 0.2);
                break;
            case 'none':
            default:
                break;
        }
    }
}

export const soundService = new SoundService();