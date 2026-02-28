import { useRef, useState, useEffect } from 'react';

export function useBGMPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  function loadFile(file: File) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    _load(url, file.name);
  }

  function loadUrl(url: string, name: string) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null; // static URL — don't revoke on cleanup
    _load(url, name);
  }

  function _load(src: string, name: string) {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.src = src;
    audio.loop = true;
    audio.volume = volume;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
    setFileName(name);
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function setVolume(v: number) {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  return { fileName, isPlaying, volume, loadFile, loadUrl, toggle, setVolume };
}
