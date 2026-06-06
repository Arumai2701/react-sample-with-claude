import React, { useEffect, useRef, useState } from 'react'
import { convertToWebP, WebPConversionError } from './webp'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function stripExtension(name) {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

export default function ImageConverter() {
  const [status, setStatus] = useState('idle')
  const [original, setOriginal] = useState(null)
  const [converted, setConverted] = useState(null)
  const [error, setError] = useState(null)
  const urlsRef = useRef([])

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      urlsRef.current = []
    }
  }, [])

  function releaseUrls() {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    urlsRef.current = []
  }

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    releaseUrls()
    setError(null)
    setOriginal(null)
    setConverted(null)
    setStatus('converting')

    const originalUrl = URL.createObjectURL(file)
    urlsRef.current.push(originalUrl)
    setOriginal({ name: file.name, size: file.size, url: originalUrl })

    try {
      const result = await convertToWebP(file)
      urlsRef.current.push(result.url)
      setConverted({
        url: result.url,
        size: result.webpSize,
        width: result.width,
        height: result.height,
        downloadName: `${stripExtension(file.name)}.webp`,
      })
      setStatus('done')
    } catch (err) {
      const message =
        err instanceof WebPConversionError
          ? err.message
          : 'Unexpected error while converting the image.'
      setError(message)
      setStatus('error')
    }
  }

  const savings =
    original && converted
      ? Math.max(0, Math.round((1 - converted.size / original.size) * 100))
      : null

  return (
    <section className="converter" aria-labelledby="converter-title">
      <h2 id="converter-title" className="converter__title">WebP Converter</h2>
      <p className="converter__hint">
        Pick an image — it will be converted to WebP in your browser. Nothing is uploaded.
      </p>

      <label className="converter__picker">
        <span>Choose image</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={status === 'converting'}
        />
      </label>

      {status === 'converting' && (
        <p className="converter__status" role="status">Converting…</p>
      )}

      {error && (
        <p className="converter__error" role="alert">{error}</p>
      )}

      {original && (
        <div className="converter__previews">
          <figure className="converter__preview">
            <img src={original.url} alt="Original" />
            <figcaption>
              <strong>Original</strong>
              <span>{formatBytes(original.size)}</span>
            </figcaption>
          </figure>
          {converted && (
            <figure className="converter__preview">
              <img src={converted.url} alt="Converted to WebP" />
              <figcaption>
                <strong>WebP</strong>
                <span>{formatBytes(converted.size)}</span>
              </figcaption>
            </figure>
          )}
        </div>
      )}

      {savings !== null && (
        <p className="converter__savings">
          WebP is <strong>{savings}%</strong> smaller.
        </p>
      )}

      {converted && (
        <a
          className="converter__download"
          href={converted.url}
          download={converted.downloadName}
        >
          Download .webp
        </a>
      )}
    </section>
  )
}
