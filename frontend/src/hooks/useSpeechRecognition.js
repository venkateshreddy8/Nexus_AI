'use client';
import { useCallback, useRef, useState, useEffect } from 'react';

export function useSpeechRecognition({ onResult, onInterim, onError } = {}) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError?.('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = 'en-US';
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        const confidence = e.results[i][0].confidence;
        if (e.results[i].isFinal) {
          onResult?.(transcript.trim(), confidence || 1.0);
        } else {
          interim += transcript;
        }
      }
      if (interim) onInterim?.(interim);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') onError?.(e.error);
    };

    recognition.onend = () => {
      // Auto-restart if still meant to be listening
      if (recognitionRef.current) {
        try { recognition.start(); } catch { /* already running */ }
      }
    };

    recognition.start();
    setIsListening(true);
  }, [onResult, onInterim, onError]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // prevent auto-restart
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return { start, stop, isListening, isSupported };
}
