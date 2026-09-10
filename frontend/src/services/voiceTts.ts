import api from './api';

export async function fetchCashlyVoiceAudio(text: string, voiceId: string): Promise<Blob> {
    const response = await api.post('/voice/tts', {
        text,
        voiceId,
    }, {
        responseType: 'blob',
        timeout: 20000,
    });

    const data = response.data as Blob;
    if (data && data.type && data.type.includes('json')) {
        throw new Error('Voice playback is unavailable');
    }
    return data;
}

export async function playCashlyVoiceAudio(blob: Blob, previous?: HTMLAudioElement | null): Promise<HTMLAudioElement> {
    if (previous) {
        previous.pause();
        previous.src = '';
    }
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.onended = () => URL.revokeObjectURL(audioUrl);
    audio.onerror = () => URL.revokeObjectURL(audioUrl);
    await audio.play();
    return audio;
}
