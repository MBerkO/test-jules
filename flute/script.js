document.addEventListener('DOMContentLoaded', () => {
    // Audio Context Setup
    let audioCtx;

    const initAudio = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    };

    // Elements
    const holes = document.querySelectorAll('.hole');
    const volumeSlider = document.getElementById('volume');
    const octaveDisplay = document.getElementById('octave-display');
    const octaveUpBtn = document.getElementById('octave-up');
    const octaveDownBtn = document.getElementById('octave-down');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    // State
    let currentOctave = 4;
    let masterGain;
    const activeOscillators = {};

    // Base Frequencies for 4th octave (A4 = 440Hz)
    const baseFrequencies = {
        'C': 261.63,
        'D': 293.66,
        'E': 329.63,
        'F': 349.23,
        'G': 392.00,
        'A': 440.00,
        'B': 493.88,
        'C-high': 523.25
    };

    const getFrequency = (note, octave) => {
        const baseFreq = baseFrequencies[note];
        // Calculate frequency based on current octave relative to base octave 4
        return baseFreq * Math.pow(2, octave - 4);
    };

    const playNote = (note, keyElement) => {
        initAudio();

        if (activeOscillators[note]) return; // Already playing

        keyElement.classList.add('active');

        if (!masterGain) {
            masterGain = audioCtx.createGain();
            masterGain.connect(audioCtx.destination);
            masterGain.gain.value = volumeSlider.value;
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // Flute-like sound settings
        // A mix of sine and triangle wave or a custom waveform could be better,
        // but triangle gives a decent simple flute/woodwind approximation.
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(getFrequency(note, currentOctave), audioCtx.currentTime);

        // Envelope for softer attack and release (flute characteristic)
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.1); // Attack

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.start();

        activeOscillators[note] = {
            oscillator: oscillator,
            gainNode: gainNode,
            element: keyElement
        };
    };

    const stopNote = (note) => {
        if (!activeOscillators[note]) return;

        const { oscillator, gainNode, element } = activeOscillators[note];

        element.classList.remove('active');

        // Release envelope
        gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1); // Release

        oscillator.stop(audioCtx.currentTime + 0.1);

        delete activeOscillators[note];
    };

    // Event Listeners for UI interaction
    holes.forEach(hole => {
        const note = hole.getAttribute('data-note');

        // Mouse events
        hole.addEventListener('mousedown', () => playNote(note, hole));
        hole.addEventListener('mouseup', () => stopNote(note));
        hole.addEventListener('mouseleave', () => stopNote(note));

        // Touch events
        hole.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling/zooming
            playNote(note, hole);
        });
        hole.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopNote(note);
        });
        hole.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            stopNote(note);
        });
    });

    // Keyboard interaction
    document.addEventListener('keydown', (e) => {
        if (e.repeat) return; // Prevent continuous trigger on holding key down

        const key = e.key.toUpperCase();
        const hole = Array.from(holes).find(h => h.getAttribute('data-key') === key);

        if (hole) {
            const note = hole.getAttribute('data-note');
            playNote(note, hole);
        }
    });

    document.addEventListener('keyup', (e) => {
        const key = e.key.toUpperCase();
        const hole = Array.from(holes).find(h => h.getAttribute('data-key') === key);

        if (hole) {
            const note = hole.getAttribute('data-note');
            stopNote(note);
        }
    });

    // Controls
    volumeSlider.addEventListener('input', (e) => {
        if (masterGain) {
            masterGain.gain.value = e.target.value;
        }
    });

    octaveUpBtn.addEventListener('click', () => {
        if (currentOctave < 7) {
            currentOctave++;
            octaveDisplay.textContent = currentOctave;
        }
    });

    octaveDownBtn.addEventListener('click', () => {
        if (currentOctave > 2) {
            currentOctave--;
            octaveDisplay.textContent = currentOctave;
        }
    });

    // Fullscreen Support
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.log(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
            });
            fullscreenBtn.textContent = 'Küçült';
        } else {
            document.exitFullscreen();
            fullscreenBtn.textContent = 'Tam Ekran';
        }
    });

    // Also update button text if fullscreen is exited via Esc key
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            fullscreenBtn.textContent = 'Tam Ekran';
        }
    });
});
