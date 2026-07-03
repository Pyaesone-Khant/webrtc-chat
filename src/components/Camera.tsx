import { useRef, useState } from 'react'

export function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      console.log('Got MediaStream:', stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing media devices.', error)
    }
  }



  const handlePlay = () => {
    videoRef.current?.play()
  }

  const handlePause = () => {
    videoRef.current?.pause()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
    }
  }

  const handleRecord = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'recording.webm'
        a.click()
        URL.revokeObjectURL(url)
      }

      recorder.start()
      setIsRecording(true)
    }
  }

  const handleResume = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
    }
    videoRef.current?.play()
  }

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = 'capture.png'
        a.click()
      }
    }
  }

  const handleExit = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }

  return (
    <div className=" bg-blue-50 p-8 rounded-xl">
      <h2>Video Component</h2>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        dir="right"
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: '#000',
          borderRadius: '8px',
        }}
      ></video>

      <div className="flex flex-row gap-4">
        <button onClick={handleStart} className="p-2 rounded-md bg-red-200 ">
          Start
        </button>
        <button onClick={handleRecord} className="p-2 rounded-md bg-red-200 ">
          {isRecording ? 'Stop Recording' : 'Record'}
        </button>
        <button onClick={handleResume} className="p-2 rounded-md bg-red-200 ">
          Resume
        </button>
        <button onClick={handlePlay} className="p-2 rounded-md bg-red-200 ">
          Play
        </button>
        <button onClick={handlePause} className="p-2 rounded-md bg-red-200 ">
          Pause
        </button>
        <button onClick={handleCapture} className="p-2 rounded-md bg-red-200 ">
          Capture
        </button>
        <button onClick={handleExit} className="p-2 rounded-md bg-red-200 ">
          Exit
        </button>
      </div>
    </div>
  )
}
